const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");

let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/views`));

	/**
	 * Gets whether this app exists in the instance
	 */
	app.get("/api/app", (req, res) => {
		
	})

	/**
	 * Creates an app in the instance
	 */
	app.post("/api/app", (req, res) => {
		console.log(req.body);

		res.end(JSON.stringify({

		}));
	});



let listener = app.listen(8001, () => {
	console.log(`[MastodonRater] I'm running on port:${listener.address().port}✨`);
});