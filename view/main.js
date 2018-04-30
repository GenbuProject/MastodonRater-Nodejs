const SITEURL = location.href.replace(location.search, "");

const signOutBtnOnHeader = document.getElementById("header-signOut");
const signOutBtnOnSidebar = document.getElementById("sidebar-signOut");
const signInPanel = document.getElementById("signInPanel");
const instanceInputter = document.getElementById("signInPanel-instance");
const signInBtn = document.getElementById("signInPanel-signIn");
const controlPanel = document.getElementById("controlPanel");
const currentInstance = document.getElementById("controlPanel-currentInstance");
const privacySelector = document.getElementById("controlPanel-privacy");
const tootRaterBtn = document.querySelector("#feature-tootRater > A.secondary-content");

window.addEventListener("DOMContentLoaded", () => {
	[signOutBtnOnHeader, signOutBtnOnSidebar].forEach(signOutBtn => {
		signOutBtn.addEventListener("click", () => {
			cookieStore.set("MR-instance", "");
			cookieStore.set("MR-token", "");

			location.href = SITEURL;
		});
	});

	signInBtn.addEventListener("click", () => {
		const instance = instanceInputter.value;

		if (instance && instanceInputter.checkValidity()) {
			fetch(`api/exists?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(res => {
				if (res.exists) {
					return fetch(`api/app?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json());
				} else {
					return new Promise((resolve, reject) => {
						let connector = new XMLHttpRequest();
							connector.responseType = "json";
							connector.open("POST", "api/app", true);

							connector.setRequestHeader("Content-Type", "application/json");
							connector.send(JSON.stringify({
								instance,
								redirectTo: SITEURL
							}));

							connector.addEventListener("load", event => {
								const { status, response } = event.target;

								if (status == 400) {
									reject(response.error);
								} else {
									resolve(response);
								}
							});
					});
				}
			}).catch(error => {
				throw error;
			}).then(info => {
				cookieStore.set("MR-instance", instance);
				location.href = info.authUrl;
			});
		}
	});

	privacySelector.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});

	tootRaterBtn.addEventListener("click", event => {
		event.preventDefault();
	});
});

window.addEventListener("DOMContentLoaded", () => {
	if (cookieStore.get("MR-instance") && cookieStore.get("MR-token")) {
		controlPanel.classList.remove("disabled");
		signOutBtnOnHeader.classList.remove("disabled");
		signOutBtnOnSidebar.classList.remove("disabled");

		currentInstance.textContent = currentInstance.href = cookieStore.get("MR-instance");
	} else {
		signInPanel.classList.remove("disabled");
	}

	privacySelector.namedItem(`privacy.${cookieStore.get("MR-privacy")}`).selected = true;
});

window.addEventListener("DOMContentLoaded", () => {
	const querys = new URLSearchParams(location.search);
	const instance = cookieStore.get("MR-instance");

	if (querys.has("code") && instance) {
		fetch(`api/app?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(info => {
			const { clientId, secretId, redirectTo } = info;

			return fetch(`api/token?instance=${instance}&clientId=${clientId}&secretId=${secretId}&code=${querys.get("code")}&redirectTo=${redirectTo}`).then(res => res.json());
		}).then(res => {
			cookieStore.set("MR-token", res.accessToken);
			location.href = SITEURL;
		});
	}
});