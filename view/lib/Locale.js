class Locale {
	static get currentLang () {
		return cookieStore.get("MR-lang");
	}

	static load (languageCode = "en") {
		return fetch(`locales/${languageCode}.json`).catch(error => fetch("locales/en.json")).then(response => response.json()).then(messages => messages);
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
		document.querySelectorAll(".sidenav").forEach(sidenav => M.Sidenav.init(sidenav));
	}
}



let cookieStore = new CookieStore();
let definedMessages = {};
let LANG = "";

window.addEventListener("DOMContentLoaded", () => {
	let querys = new URLSearchParams(location.search);

	if (querys.has("lang")) {
		LANG = querys.get("lang");
		cookieStore.set("MR-lang", querys.get("lang"));

		Locale.load(LANG).then(messages => {
			definedMessages = messages;
			return Locale.load();
		}).then(messages => {
			for (let localeId in messages) {
				if (!definedMessages[localeId]) definedMessages[localeId] = messages[localeId];
			}

			Locale.apply(definedMessages);
		});

		return;
	}

	LANG = Locale.currentLang;
	
	Locale.load(LANG).then(messages => {
		definedMessages = messages;
		return Locale.load();
	}).then(messages => {
		for (let localeId in messages) {
			if (!definedMessages[localeId]) definedMessages[localeId] = messages[localeId];
		}

		Locale.apply(definedMessages);
	});
});