class CookieStore {
	constructor () {
		this.rawCookie = document.cookie;
		setInterval(() => this.rawCookie = document.cookie);
	}

	get rawCookie () { return this._rawCookie }
	set rawCookie (value = "") {
		this._rawCookie = value;

		let formatted = {};
		let cookies = this._rawCookie.split("; ");
			cookies.forEach(cookie => {
				cookie = cookie.split("=");

				formatted[cookie[0]] = cookie[1];
			});

		this.cookie = formatted;
	}



	/**
	 * Get how the cookie exists
	 * 
	 * @param {String} key Cookie's key
	 * @returns {Boolean} How the cookie exists
	 */
	has (key = "") {
		if (!key) throw new TypeError('An argument, "key" is not acceptable.');

		return this.cookie[key] ? true : false;
	}
	
	/**
	 * Get a value from provided key
	 * 
	 * @param {String} key Cookie's key
	 * @returns {String} Cookie's value
	 */
	get (key = "") {
		if (!key) throw new TypeError('An argument, "key" is not acceptable.');

		return this.cookie[key] ? decodeURIComponent(this.cookie[key]) : null;
	}

	/**
	 * Get cookies
	 * @returns {{}} An object of cookies
	 */
	getAll () {
		return this.cookie;
	}

	/**
	 * Set a cookie
	 * 
	 * @param {String} key Cookie's key
	 * @param {String} value Cooie's value
	 * @param {Object} options Cookie's options
	 * @param {String} options.path
	 * @param {String} options.domain
	 * @param {String} options.maxAge
	 * @param {String} options.expires
	 * @param {Boolean} options.secure
	 */
	set (key = "", value = "", options = {}) {
		if (!key) throw new TypeError('One of arguments, "key" is not acceptable.');

		let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; `;

		if (options) {
			for (let name in options) {
				switch (name) {
					default:
						cookie += `${encodeURIComponent(name)}=${options[name]}; `;
						break;

					case "maxAge":
						cookie += `max-age=${options[name]}; `;
						break;

					case "secure":
						cookie += "secure; ";
						break;
				}
			}
		}

		document.cookie = cookie;
		this.rawCookie = document.cookie;
	}

	/**
	 * Remove a cookie
	 * 
	 * @param {String} key Cookie's key
	 * @param {Object} options Cookie's options
	 */
	delete (key = "", options = {}) {
		if (!key) throw new TypeError('An argument, "key" is not acceptable.');

		this.set(key, "", Object.assign({ maxAge: -1 }, options));
	}
}