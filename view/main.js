const SITEURL = location.href.replace(location.search, "");

const signOutBtnOnHeader = document.getElementById("header-signOut");
const signInPanel = document.getElementById("signInPanel");
const instanceInputter = document.getElementById("signInPanel-instance");
const signInBtn = document.getElementById("signInPanel-signIn");
const controlPanel = document.getElementById("controlPanel");
const privacySelector = document.getElementById("controlPanel-privacy");

window.addEventListener("DOMContentLoaded", () => {
	signInBtn.addEventListener("click", () => {
		const instance = instanceInputter.value;

		if (instance && instanceInputter.checkValidity()) {
			fetch(`api/exists?instance=${instance}`).then(res => res.json()).then(res => {
				if (res.exists) {
					return fetch(`api/app?instance=${instance}`).then(res => res.json());
				}
			}).then(info => {
				console.log(info);

				cookieStore.set("MR-instance", instance);
				location.href = info.authUrl;
			});
		}
	});

	privacySelector.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});
});

window.addEventListener("DOMContentLoaded", () => {
	if (cookieStore.get("MR-instance") && cookieStore.get("MR-token")) {
		controlPanel.classList.remove("disabled");
		signOutBtnOnHeader.classList.remove("disabled");
	} else {
		signInPanel.classList.remove("disabled");
	}

	privacySelector.namedItem(`privacy.${cookieStore.get("MR-privacy")}`).selected = true;
});

window.addEventListener("DOMContentLoaded", () => {
	const querys = new URLSearchParams(location.search);
	const instance = cookieStore.get("MR-instance");

	if (querys.has("code") && instance) {
		fetch(`api/app?instance=${instance}`).then(res => res.json()).then(info => {
			const { clientId, secretId } = info;

			return fetch(`api/token?code=${querys.get("code")}&clientId=${clientId}&secretId=${secretId}`).then(res => res.json());
		}).then(token => {
			cookieStore.set("MR-token", accessToken);
		});
	}
});