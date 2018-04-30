class DOM {
	/**
	 * セレクタ($1)に応じてDOM要素を返す
	 * 
	 * ($1) セレクタ
	 * => {:elemName} … elemName要素を生成
	 * => #{:elemName} … IDがelemNameの要素を返す
	 * => .{:elemName} … elemNameクラスの要素を返す
	 * => *{:elemName} … NameがelemNameの要素を返す
	 * => :{:elemName} … elemName要素を返す
	 * => ${:elemName} … elemNameセレクタの1要素を返す
	 * => @{:elemName} … elemNameセレクタの要素を返す
	 * 
	 * @param {String} [selectorStr=""] A selector
	 * @param {Object} [option={}] An element's option(See document.createElementWithParam)
	 * @param {String} option.id
	 * @param {Object} option.classes
	 * @param {String} option.text
	 * @param {String} option.html
	 * @param {Object} option.attributes
	 * @param {Object} option.dataset
	 * @param {Object} option.styles
	 * @param {Node[]} option.children
	 * @param {Object} option.events
	 * 
	 * @returns {HTMLElement} An element
	 */
	constructor (selectorStr = "", option = {}) {
		let elem = null;

		switch (selectorStr.substr(0, 1)) {
			default:
				try {
					elem = document.createElementWithParam(selectorStr, option);
				} catch (err) {
					throw new SyntaxError("The selector includes invalid characters.");
				}

				break;

			case "#":
				elem = document.getElementById(selectorStr.slice(1));
				break;

			case ".":
				elem = document.getElementsByClassName(selectorStr.slice(1));
				break;

			case "*":
				elem = document.getElementsByName(selectorStr.slice(1));
				break;

			case ":":
				elem = document.getElementsByTagName(selectorStr.slice(1));
				break;

			case "$":
				elem = document.querySelector(selectorStr.slice(1));
				break;

			case "@":
				elem = document.querySelectorAll(selectorStr.slice(1));
				break;
		}

		if (!elem) {
			throw new EvalError("No elements matched.");
		}

		return elem;
	}



	/**
	 * Connects to the URL
	 * 
	 * @param {Object} [option={}] A collection of connecting options
	 * @param {String} [option.type="GET"] A connecting method
	 * @param {String} [option.url=location.href] Where the connector will connect
	 * @param {Boolean} [option.doesSync=false] How the connector will connect asynchronously
	 * @param {String} option.resType A response type
	 * @param {Object} option.headers the connector's headers
	 * @param {Object} option.params A collection of query strings
	 * @param {Object} option.data A data for sending
	 * @param {function (ProgressEvent)} [option.onLoad=function (event) {}] A callback, called when the connector will have connected
	 * 
	 * @returns {Promise} The connector
	 */
	static xhr (option = { type: "GET", url: location.href, doesSync: false, onLoad: (event) => {} }) {
		let connector = new XMLHttpRequest();
			!option.resType || (connector.responseType = option.resType);
			
			connector.open(option.type, option.url + (option.params ? "?" + (() => {
				let param = [];

				for (let paramName in option.params) {
					param.push(paramName + "=" + option.params[paramName]);
				}

				return param.join("&");
			})() : ""), option.doesSync);

			!option.headers || (() => {
				for (let headerName in option.headers) {
					connector.setRequestHeader(headerName, option.headers[headerName]);
				}
			})();

			connector.addEventListener("load", option.onLoad);
			connector.send(option.data);

		return connector;
	}
}