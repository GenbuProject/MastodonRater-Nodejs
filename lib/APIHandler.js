const Mastodon = require("mastodon-api");
const Formatter = require("./Formatter");

module.exports = class APIHandler {
	/** @param {Mastodon} mastodonObj */
	constructor (mastodonObj) {
		this.Mstdn = mastodonObj;
	}

	getFollowers (userId = 0) {
		const { Mstdn } = this;

		let followers = [];
		return (function looper (max_id) {
			const props = { limit: 80 };

			if (max_id) {
				props.max_id = max_id;
			}

			return Mstdn.get(`accounts/${userId}/followers`, props).then(info => {
				if (info.resp.statusCode !== 200) return Promise.reject(info);
				
				followers = followers.concat(info.data);

				const nextLink = Formatter.getLinkFromLinkHeader(info.resp.headers.link, "next");
				if (nextLink) {
					return looper(Formatter.queriesToObject(nextLink).max_id);
				} else {
					return Promise.resolve(followers);
				}
			});
		})();
	}

	getFollowing (userId = 0) {
		const { Mstdn } = this;

		let following = [];
		return (function looper (max_id) {
			const props = { limit: 80 };

			if (max_id) {
				props.max_id = max_id;
			}

			return Mstdn.get(`accounts/${userId}/following`, props).then(info => {
				if (info.resp.statusCode !== 200) return Promise.reject(info);

				following = following.concat(info.data);

				const nextLink = Formatter.getLinkFromLinkHeader(info.resp.headers.link, "next");
				if (nextLink) {
					return looper(Formatter.queriesToObject(nextLink).max_id);
				} else {
					return Promise.resolve(following);
				}
			});
		})();
	}

	getFriends (userCollection = []) {
		const { Mstdn } = this;

		return new Promise((resolve, reject) => {
			const flags = new Array(userCollection.length).fill(false);
			const friends = [];

			for (let i = 0; i < userCollection.length; i++) {
				const user = userCollection[i];

				Mstdn.get("accounts/relationships", { id: user.id }).then(info => {
					if (info.resp.statusCode !== 200) return reject(info);

					if (info.data[0].following && info.data[0].followed_by) {
						friends[user.id] = user;
						
						friends[user.id].sumScore =
						friends[user.id].reblogScore =
						friends[user.id].mentionScore = 0;
					}

					flags[i] = true;
				});
			}

			let looper = setInterval(() => {
				if (flags.every(flag => flag == true)) {
					resolve(friends);
					clearInterval(looper);
				}
			});
		});
	}

	getStatuses (userId = 0, startDate = new Date(), endDate = new Date()) {
		const { Mstdn } = this;
		const start = Math.max(startDate, endDate);
		const end = Math.min(startDate, endDate);

		const statuses = [];
		return (function looper (max_id) {
			const props = { limit: 40 };

			if (max_id) {
				props.max_id = max_id;
			}

			return Mstdn.get(`accounts/${userId}/statuses`, props).then(info => {
				if (info.resp.statusCode !== 200) return Promise.reject(info);

				for (let status of info.data) {
					const createdAt = new Date(status.created_at);

					if (start >= createdAt.getTime() && createdAt.getTime() >= end) {
						statuses.push(status);
					} else {
						return Promise.resolve(statuses);
					}
				}

				const nextLink = Formatter.getLinkFromLinkHeader(info.resp.headers.link, "next");
				if (nextLink) {
					return looper(Formatter.queriesToObject(nextLink).max_id);
				} else {
					return Promise.resolve(statuses);
				}
			});
		})();
	}
};