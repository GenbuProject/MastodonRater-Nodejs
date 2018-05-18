const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");
const MongoHandler = require("./lib/MongoHandler");
const APIHandler = require("./lib/APIHandler");
const R = require("./lib/Resources");

//This code is for only developing
require("dotenv").config();



const SITEURL = "https://mastodon-rater.herokuapp.com/";
const Mongo = new MongoHandler(process.env.DB_URI, process.env.DB_NAME);

let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/view`));
	app.use("/locales", express.static(`${__dirname}/locales`));

	app.set("PORT", process.env.PORT);

	app.all("*", (req, res, next) => {
		if (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] === "http") {
			res.redirect('https://' + req.headers.host + req.url);
		} else {
			return next();
		}
	});

	/**
	 * Gets whether MastodonRater exists in the instance
	 */
	app.get("/api/exists", (req, res) => {
		if (!Mongo.db) {
			res.status(400).end(R.API_END_WITH_ERROR(R.ERROR.ENV.DB_URI));
			return;
		}

		const instance = req.query.instance.replace(/\/$/, "");
		const { redirectTo } = req.query;

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

		const instance = req.query.instance.replace(/\/$/, "");
		const { redirectTo } = req.query;

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

		const instance = req.body.instance.replace(/\/$/, "");
		const { redirectTo } = req.body;
		
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
		const instance = req.query.instance.replace(/\/$/, "");
		const { clientId, secretId, code, redirectTo } = req.query;

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
	 * Gets how provided token is valid
	 */
	app.get("/api/tokenValidate", (req, res) => {
		const instance = req.query.instance.replace(/\/$/, "");
		const { token } = req.query;

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
			Mstdn.get("accounts/verify_credentials").then(info => res.end(R.API_END({ valid: !info.data.error })));
	});

	/**
	 * Toots with provided contents
	 */
	app.post("/api/toot", (req, res) => {
		const instance = req.body.instance.replace(/\/$/, "");
		const { token, privacy, status } = req.body;

		if (!instance || !token) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'token' are required.")));
		}

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
			Mstdn.post("statuses", {
				status,
				visibility: privacy || "public"
			}).then(info => {
				res.end(R.API_END({ status: info.data }));
			});
	});

	/**
	 * Executes Toot Rater
	 */
	app.post("/api/feature/TootRater", (req, res) => {
		const instance = req.body.instance.replace(/\/$/, "");
		const { token, privacy } = req.body;

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
		const instance = req.body.instance.replace(/\/$/, "");
		const { token, privacy } = req.body;

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
		const instance = req.body.instance.replace(/\/$/, "");
		const { token, privacy, isImmediately } = req.body;
		let { dateRange } = req.body;

		if (!instance || !token) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'token' are required.")));
		}

		if (!dateRange) {
			let today = new Date();
				dateRange = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		} else if (Number.isInteger(dateRange)) {
			dateRange = new Date(dateRange);
		}

		let me = {};
		let friends = [];
		let ranking = [];

		let Mstdn = new Mastodon({ api_url: `${instance}/api/v1/`, access_token: token });
		let mstdnHandler = new APIHandler(Mstdn);
			Mstdn.get("accounts/verify_credentials").then(info => {
				me = info.data;

				if (me.following_count > me.followers_count) {
					return mstdnHandler.getFollowers(me.id);
				} else {
					return mstdnHandler.getFollowing(me.id);
				}
			}).then(users => {
				return mstdnHandler.getFriends(users);
			}).then(_friends => {
				friends = _friends;
				return mstdnHandler.getStatuses(me.id, new Date(), dateRange);
			}).then(statuses => {
				for (let status of statuses) {
					if (status.reblog && friends[status.reblog.account.id]) friends[status.reblog.account.id].reblogScore += R.API_FEATURE_RA_REBLOG;

					if (status.mentions) {
						for (let mention of status.mentions) {
							if (friends[mention.id]) friends[mention.id].mentionScore += R.API_FEATURE_RA_MENTION;
						}
					}
				}
			}).then(() => {
				ranking = friends.filter(friend => (friend.sumScore = friend.reblogScore + friend.mentionScore) !== 0);
				ranking = ranking.sort((a, b) => {
					if (a.sumScore < b.sumScore) return 1;
					if (a.sumScore > b.sumScore) return -1;
					return 0;
				});

				let tootContent = [
					"#RelevanceAnalyzer",
					`${dateRange.toLocaleString()}までの #統計さん`,
					"",
					`@${me.acct} さんと`,
					`仲良しのユーザーは`,
					"",
					(amount => {
						const rankIn = [];

						for (let i = 0; i < amount; i++) {
							if (!ranking[i]) return rankIn.join("\r\n");

							rankIn.push([
								`《${i + 1}位》`,
								`${ranking[i].acct}(Score ${ranking[i].sumScore})`,
								""
							].join("\r\n"));
						}

						return rankIn.join("\r\n");
					})(R.API_FEATURE_RA_AMOUNT),
					"の方々です！！",
					"",
					"(Tooted from #MastodonRater)",
					SITEURL
				].join("\r\n");

				if (isImmediately) {
					return Mstdn.post("statuses", {
						status: tootContent,
						visibility: privacy || "public"
					});
				}
					
				res.end(R.API_END({ ranking: tootContent, isImmediately: false }));
			}).then(() => {
				res.end(R.API_END({ ranking, isImmediately: true }));
			});
	});



let listener = app.listen((app.get("PORT") || 8001), () => {
	app.set("PORT", listener.address().port);
	console.log(`[MastodonRater] I'm running on port:${app.get("PORT")}✨`);
});