module.exports = class Formatter {
	static getLinkFromLinkHeader (linkHeader = "", type = "next") {
		let link = linkHeader.match(new RegExp(`<(\\S+)>; rel="${type}"`));
		return link && link[1];
	}

	static queriesToObject (url = "") {
		const queries = url.split("?")[1].split("&");

		let formatted = {};
		for (let query of queries) {
			let [ key, value ] = query.split("=");

			formatted[key] = value;
		}

		return formatted;
	}
};