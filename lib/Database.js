const MongoDB = require("mongodb");
const R = require("./Resources");

module.exports = class Database {
	constructor (uri = "") {
		MongoDB.MongoClient.connect(uri).then(client => {
			this.db = client.db(R.DB_NAME);
		}).catch(error => {
			throw R.ERROR_DB_URI;
		});
	}

	existApp (instance = "") {
		return new Promise((resolve, reject) => {
			this.db.collection(instance).stats().then(() => {
				resolve(true);
			}).catch(() => {
				resolve(false);
			});
		});
	}

	storeApp (instance = "", data = {}) {
		this.db.createCollection(instance).then(collection => {
			collection.insertOne(data);
		});
	}
};