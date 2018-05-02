const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");
const MongoHandler = require("./lib/MongoHandler");
const Formatter = require("./lib/Formatter");
const R = require("./lib/Resources");

//This code is for only developing
require("dotenv").config();


const SITEURL = "https://mastodon-rater.herokuapp.com/";
const Mongo = new MongoHandler(process.env.DB_URI, process.env.DB_NAME);

let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/view`));
	app.use("/locales", express.static(`${__dirname}/locales`));

	/**
	 * Gets whether MastodonRater exists in the instance
	 */
	app.get("/api/exists", (req, res) => {
		if (!Mongo.db) {
			res.status(400).end(R.API_END_WITH_ERROR(R.ERROR.ENV.DB_URI));
			return;
		}



		const { instance, redirectTo } = req.query;

		if (!instance || !redirectTo) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 queries, 'instance' and 'redirectTo' are required.")));
			return;
		}

		Mongo.existsApp(instance, redirectTo).then(exists => res.end(R.API_END({ exists })));
	});

	/**
	 * Gets information of MastodonRater in the instance
	 */
	app.get("/api/app", (req, res) => {
		if (!Mongo.db) {
			res.status(400).end(R.API_END_WITH_ERROR(R.ERROR.ENV.DB_URI));
			return;
		}



		const { instance, redirectTo } = req.query;

		if (!instance || !redirectTo) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 queries, 'instance' and 'redirectTo' are required.")));
			return;
		}

		Mongo.getApp(instance, redirectTo).then(info => res.end(R.API_END(info)));
	});

	/**
	 * Generates MastodonRater in the instance
	 */
	app.post("/api/app", (req, res) => {
		if (!Mongo.db) {
			res.status(400).end(R.API_END_WITH_ERROR(R.ERROR.ENV.DB_URI));
			return;
		}



		const { instance, redirectTo } = req.body;
		
		if (!instance || !redirectTo) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'redirectTo' are required.")));
			return;
		}

		Mongo.existsApp(instance, redirectTo).then(exists => {
			if (exists) {
				res.end(R.API_END());
			} else {
				let appInfo = {};
				Mastodon.createOAuthApp(`${instance}/api/v1/apps`, "MastodonRater", "read write", redirectTo).then(info => {
					const { id } = info;
					const clientId = info.client_id;
					const secretId = info.client_secret;

					appInfo = Object.assign({}, { id, redirectTo, clientId, secretId });
					Mongo.storeApp(instance, appInfo);

					return Mastodon.getAuthorizationUrl(clientId, secretId, instance, "read write", redirectTo);
				}).then(authUrl => {
					res.end(R.API_END(Object.assign(appInfo, { authUrl })));
				}).catch(error => {
					res.status(400).end(R.API_END_WITH_ERROR(new URIError(`${instance} is not an instance.`)));
				});
			}
		});
	});

	/**
	 * Gets user's token from received code
	 */
	app.get("/api/token", (req, res) => {
		const { instance, clientId, secretId, code, redirectTo } = req.query;

		if (!instance || !clientId || !secretId || !code || !redirectTo) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("5 queries, 'instance', 'clientId', 'secretId', 'code', and 'redirectTo' are required.")));
			return;
		}

		Mastodon.getAccessToken(clientId, secretId, code, instance, redirectTo).then(accessToken => {
			res.end(R.API_END({ accessToken }));
		}).catch(error => {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("Any queries are invalid.")));
			return;
		});
	});

	/**
	 * Executes Toot Rater
	 */
	app.post("/api/feature/TootRater", (req, res) => {
		const { instance, token, privacy } = req.body;

		if (!instance || !token) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'token' are required.")));
		}

		let serverStatuses = 0,
			userStatuses = 0,
			rate = 0;

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
			Mstdn.get("instance").then(info => {
				serverStatuses = info.data.stats.status_count;

				return Mstdn.get("accounts/verify_credentials");
			}).then(info => {
				userStatuses = info.data.statuses_count;
				rate = (userStatuses / serverStatuses * 100).toFixed(3);

				return Mstdn.post("statuses", {
					status: [
						`@${info.data.acct} さんの`,
						`#トゥート率 は${rate}%です！`,
						"",
						"(Tooted from #MastodonRater)",
						SITEURL
					].join("\r\n"),

					visibility: privacy || "public"
				});
			}).then(() => {
				res.end(R.API_END({ rate }));
			});
	});

	/**
	 * Executes TPD
	 */
	app.post("/api/feature/TPD", (req, res) => {
		const { instance, token, privacy } = req.body;

		if (!instance || !token) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'token' are required.")));
		}

		let days = 0,
			tpd = 0;

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
			Mstdn.get("accounts/verify_credentials").then(info => {
				let nowTime = new Date().getTime(),
					createdAt = new Date(info.data.created_at).getTime();

				days = Math.floor((nowTime - createdAt) / (1000 * 60 * 60 * 24));
				tpd = Math.floor(info.data.statuses_count / days);

				return Mstdn.post("statuses", {
					status: [
						`@${info.data.acct} さんの`,
						`経過日数は${days}日`,
						`#TPD は${tpd}です！`,
						"",
						"(Tooted from #MastodonRater)",
						SITEURL
					].join("\r\n"),

					visibility: privacy || "public"
				});
			}).then(() => {
				res.end(R.API_END({ days, tpd }));
			});
	});

	/**
	 * Executes Relevance Analyzer
	 */
	app.post("/api/feature/RelevanceAnalyzer", (req, res) => {
		const { instance, token, privacy } = req.body;

		if (!instance || !token) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'token' are required.")));
		}

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
			Mstdn.get("accounts/verify_credentials").then(info => {
				const user = info.data;

				if (user.following_count > user.followers_count) {
					return Mstdn.get(`accounts/${user.id}/followers`, { limit: 80 });
				} else {
					return Mstdn.get(`accounts/${user.id}/following`, { limit: 80 });
				}
			}).then(info => {
				console.log(info);
			});

		res.end(R.API_END());
	});

let listener = app.listen((process.env.PORT || 8001), () => {
	console.log(`[MastodonRater] I'm running on port:${listener.address().port}✨`);
});