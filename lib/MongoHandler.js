const MongoDB = require("mongodb");
const R = require("./Resources");

module.exports = class MongoHandler {
	constructor (uri = "", name = "") {
		MongoDB.MongoClient.connect(uri).then(client => {
			this.db = client.db(name);
		}).catch(error => {
			throw R.ERROR.ENV.DB_URI;
		});
	}

	getApp (instance = "", redirectTo = "") {
		return this.db.collection(instance).findOne({ redirectTo });
	}

	existsApp (instance = "", redirectTo = "") {
		return this.db.collection(instance).findOne({ redirectTo }).then(info => info && info.redirectTo == redirectTo ? true : false);
	}

	storeApp (instance = "", data = {}) {
		this.db.createCollection(instance).then(collection => {
			collection.insertOne(data);
		});
	}
};