class Locale {
	static get currentLang () {
		return cookieStore.get("MR-lang");
	}

	/**
	 * @param {String} eventname
	 * @returns {Promise}
	 */
	static on (eventname) {
		if (!eventname) throw new TypeError("An argument, 'eventname' is required.");

		return new Promise(resolve => {
			let detector = null;

			switch (eventname) {
				default:
					throw new TypeError("An argument, 'eventname' is not acceptable.");
				case "load":
					detector = setInterval(() => {
						if (Locale.loaded) {
							clearInterval(detector);
							resolve(definedMessages);
						}
					});

					break;
			}
		});
	}

	static load (languageCode = "en") {
		return fetch(`locale/${languageCode}.json`).catch(() => fetch("locale/en.json")).then(response => response.json()).then(messages => messages);
	}

	static apply (messages = {}) {
		let localeElements = document.querySelectorAll('Locale[Message]');
			localeElements.forEach(elem => {
				let localeId = elem.getAttribute("Message");

				try {
					elem.textContent = messages[localeId];
				} catch (error) {
					throw new TypeError(`The provided locale-id<${localeId}> is not defined`);
				}
			});

		let localeAttrs = document.querySelectorAll('*[Locale-Message]');
			localeAttrs.forEach(attrElem => {
				let localeId = attrElem.getAttribute("Locale-Message");

				try {
					if (Array.isArray(messages[localeId])) {
						attrElem.innerHTML = messages[localeId].join("<Br />");
					} else {
						attrElem.textContent = messages[localeId];
					}
				} catch (error) {
					throw new TypeError(`The provided locale-id<${localeId}> is not defined`);
				}
			});

		document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
		document.querySelectorAll(".dropdown-target").forEach(dropdownTarget => M.Dropdown.init(dropdownTarget));
		document.querySelectorAll(".modal").forEach(modal => M.Modal.init(modal));
		document.querySelectorAll(".sidenav").forEach(sidenav => M.Sidenav.init(sidenav));
	}
}



let cookieStore = new CookieStore();
let definedMessages = {};

if (!cookieStore.has("MR-lang")) cookieStore.set("MR-lang", navigator.language || "en");
if (!cookieStore.has("MR-privacy")) cookieStore.set("MR-privacy", "public");

window.addEventListener("DOMContentLoaded", () => {
	Locale.load(Locale.currentLang).then(messages => {
		definedMessages = messages;
		return Locale.load();
	}).then(messages => {
		for (let localeId in messages) {
			if (!definedMessages[localeId]) definedMessages[localeId] = messages[localeId];
		}

		Locale.loaded = true;
		Locale.apply(definedMessages);
	});
});



/* global M, CookieStore */