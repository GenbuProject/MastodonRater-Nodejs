const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");
const Database = require("./lib/Database");
const R = require("./lib/Resources");

//This code is for only developing
require("dotenv").config();



const DB = new Database(process.env.DB_URI);

let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/view`));

	/**
	 * Gets whether MastodonRater exists in the instance
	 */
	app.get("/api/app", (req, res) => {
		const { instance } = req.query;

		if (!instance) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("A query, 'instance' is required.")));
			return;
		}

		if (!DB.db) {
			res.status(400).end(R.API_END_WITH_ERROR(R.ERROR.CONST.DB_URI));
			return;
		}

		DB.existApp(instance).then(exists => res.end(R.API_END({ exists })));
	});

	/**
	 * Generates MastodonRater in the instance
	 */
	app.post("/api/app", (req, res) => {
		const { instance, redirectTo } = req.body;
		
		if (!instance || !redirectTo) {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("2 payloads, 'instance' and 'redirectTo' are required.")));
			return;
		}

		DB.existApp(instance).then(exists => {
			if (exists) {
				res.end(R.API_END());
			} else {
				let appInfo = {};
				Mastodon.createOAuthApp(`${instance}/api/v1/apps`, "MastodonRater", "read write", redirectTo).then(info => {
					const { id } = info;
					const clientId = info.client_id;
					const secretId = info.client_secret;

					appInfo = Object.assign({}, { id, redirectTo, clientId, secretId });
					DB.storeApp(instance, appInfo);

					return Mastodon.getAuthorizationUrl(clientId, secretId, instance, "read write", redirectTo);
				}).then(authUrl => {
					res.end(R.API_END(Object.assign(appInfo, { authUrl })));
				});
			}
		});
	});

	/**
	 * Gets user's token from received code
	 */
	app.get("/api/token", (req, res) => {
		const { code, client_id, client_secret } = req.query;

		Mastodon.getAccessToken(client_id, client_secret, code).then(accessToken => {
			res.end(R.API_END({ accessToken }));
		}).catch(error => {
			res.status(400).end(R.API_END_WITH_ERROR(new TypeError("A query, 'code' is invalid.")));
			return;
		});
	});

let listener = app.listen((process.env.PORT || 8001), () => {
	console.log(`[MastodonRater] I'm running on port:${listener.address().port}✨`);
});