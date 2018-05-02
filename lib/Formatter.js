module.exports = class Formatter {
	static getLinkFromLinkHeader (linkHeader = "", type = "next") {
		return linkHeader.replace(new RegExp(`<(\\S+)>; rel="${type}"`), "$1");
	}
};