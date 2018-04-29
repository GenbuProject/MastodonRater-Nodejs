module.exports = {
	/** @param {Object} data */
	API_END: data => JSON.stringify(Object.assign({ status: module.exports.API_SUCCEED }, data)),
	/** @param {Error} error */
	API_END_WITH_ERROR: error => JSON.stringify({ status: module.exports.API_FAILED, error: error.message }),

	API_FAILED: "failure",
	API_SUCCEED: "success",

	ERROR: {
		ENV: {
			DB_URI: new TypeError("An environment variable, 'DB_URI' is not acceptable. It's permitted only MongoDB-format."),
			DB_NAME: new TypeError("An environment variable, 'DB_URI' is not defined.")
		}
	}
};