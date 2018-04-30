const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");
const MongoHandler = require("./lib/MongoHandler");
const R = require("./lib/Resources");

//This code is for only developing
require("dotenv").config();



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

		Mastodon.getAccessToken(clientId, secretId, code, instance, redirectTo).then(accessToken => {
			res.end(R.API_END({ accessToken }));
		}).catch(error => {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("Any queries of all are invalid.")));
			return;
		});
	});

let listener = app.listen((process.env.PORT || 8001), () => {
	console.log(`[MastodonRater] I'm running on port:${listener.address().port}✨`);
});