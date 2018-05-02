module.exports = {
	/** @param {Object} data */
	API_END: data => JSON.stringify(Object.assign({ status: module.exports.API_STATUS_SUCCEED }, data)),
	/** @param {Error} error */
	API_END_WITH_ERROR: error => JSON.stringify({ status: module.exports.API_STATUS_FAILED, error: error.message }),

	API_STATUS_FAILED: "failure",
	API_STATUS_SUCCEED: "success",
	
	API_FEATURE_RA_AMOUNT: 5,
	API_FEATURE_RA_REBLOG: 2,
	API_FEATURE_RA_MENTION: 5,

	ERROR: {
		ENV: {
			DB_URI: new TypeError("An environment variable, 'DB_URI' is not acceptable. It's permitted only MongoDB-format."),
			DB_NAME: new TypeError("An environment variable, 'DB_URI' is not defined.")
		}
	}
};