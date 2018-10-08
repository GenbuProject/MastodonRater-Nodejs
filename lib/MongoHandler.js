const MongoDB = require("mongodb");
const R = require("./Resources");

module.exports = class MongoHandler {
	constructor (uri = "", name = "") {
		MongoDB.MongoClient.connect(uri).then(client => {
			this.db = client.db(name);
		}).catch(() => {
			throw R.ERROR.ENV.DB_URI;
		});
	}

	getInstances () {
		return this.db.listCollections().toArray();
	}

	getApp (instance, redirectTo) {
		if (!instance || !redirectTo) throw new TypeError("2 arguments, 'instance' and 'redirectTo' are required.");
		
		return this.db.collection(instance).findOne({ redirectTo });
	}

	existsApp (instance, redirectTo) {
		if (!instance || !redirectTo) throw new TypeError("2 arguments, 'instance' and 'redirectTo' are required.");

		return this.db.collection(instance).findOne({ redirectTo }).then(info => info && info.redirectTo == redirectTo ? true : false);
	}

	storeApp (instance, data = {}) {
		if (!instance) throw new TypeError("An argument, 'instance' is required.");

		return this.db.createCollection(instance).then(collection => collection.insertOne(data));
	}

	removeApp (instance) {
		if (!instance) throw new TypeError("An argument, 'instance' is required.");

		return this.db.dropCollection(instance);
	}
};