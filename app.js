const express = require("express");
const bodyParser = require("body-parser");

let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/view`));

let listener = app.listen((process.env.PORT || 8001), () => {
	console.log(`[MastodonRater] I'm running on port:${listener.address().port}✨`);
});