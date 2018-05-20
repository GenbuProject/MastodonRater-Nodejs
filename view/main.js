const SITEURL = location.href.replace(location.search, "");

const signOutBtnOnHeader = document.getElementById("header-signOut");
const signOutBtnOnSidebar = document.getElementById("sidebar-signOut");
const signInPanel = document.getElementById("signInPanel");
const instanceInputter = document.getElementById("signInPanel-instance");
const signInBtn = document.getElementById("signInPanel-signIn");
const controlPanel = document.getElementById("controlPanel");
const currentInstance = document.getElementById("controlPanel-currentInstance");
const privacySelector = document.getElementById("controlPanel-privacy");
const tootRater = document.getElementById("feature-tootRater");
const tootRaterBtn = tootRater.querySelector("A.secondary-content");
const tpd = document.getElementById("feature-tpd");
const tpdBtn = tpd.querySelector("A.secondary-content");
const RA = document.getElementById("feature-relevanceAnalyzer");
const RARangeConfirmer = RA.querySelector("#feature-relevanceAnalyzer-rangeConfirmer");
const RARangeConfirmerRange = RARangeConfirmer.querySelector("#feature-relevanceAnalyzer-rangeConfirmer-range");
const RARangeConfirmerSkipConfirm = RARangeConfirmer.querySelector("#feature-relevanceAnalyzer-rangeConfirmer-skipConfirm");
const RARangeConfirmerLaunch = RARangeConfirmer.querySelector("#feature-relevanceAnalyzer-rangeConfirmer-launch");
const RARankingConfirmer = RA.querySelector("#feature-relevanceAnalyzer-rankingConfirmer");
const RARankingConfirmerContent = RARankingConfirmer.querySelector("#feature-relevanceAnalyzer-rankingConfirmer-ranking");
const RARankingConfirmerLaunch = RARankingConfirmer.querySelector("#feature-relevanceAnalyzer-rankingConfirmer-launch");
const RARankingConfirmerCancel = RARankingConfirmer.querySelector(".modal-footer > A.modal-close:Not(.modal-action)");

window.addEventListener("DOMContentLoaded", () => {
	[signOutBtnOnHeader, signOutBtnOnSidebar].forEach(signOutBtn => {
		signOutBtn.addEventListener("click", () => {
			cookieStore.set("MR-instance", "");
			cookieStore.set("MR-token", "");

			location.href = SITEURL;
		});
	});

	signInBtn.addEventListener("click", () => {
		if (!instanceInputter.value || !instanceInputter.checkValidity()) {
			Logger.log(definedMessages["signInPanel.error.InvalidUrl"]);
			return;
		}

		const instance = new URL(instanceInputter.value).origin;

		fetch(`api/exists?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(res => {
			if (res.exists) {
				return fetch(`api/app?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json());
			} else {
				return fetch("api/app", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
		
					body: JSON.stringify({
						instance,
						redirectTo: SITEURL
					}),
				}).then(res => res.json()).then(res => {
					if (res.error) throw res.error;

					return res;
				});
			}
		}).catch(error => {
			Logger.log(definedMessages["signInPanel.error.InvalidInstance"]);
			throw error;
		}).then(info => {
			cookieStore.set("MR-instance", instance);
			location.href = info.authUrl;
		});
	});

	privacySelector.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});

	tootRaterBtn.addEventListener("click", event => {
		event.preventDefault();

		tootRaterBtn.classList.add("disabled");
		tootRater.querySelector(".secondary-content.badge").classList.remove("disabled");
		Logger.log(definedMessages["common.running"]);

		fetch("api/feature/TootRater", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy")
			}),
		}).then(res => res.json()).then(res => {
			if (res.error) throw res.error;

			tootRaterBtn.classList.remove("disabled");
			tootRater.querySelector(".secondary-content.badge").classList.add("disabled");
			Logger.log(definedMessages["common.finish"]);
		});
	});

	tpdBtn.addEventListener("click", event => {
		event.preventDefault();

		tpdBtn.classList.add("disabled");
		tpd.querySelector(".secondary-content.badge").classList.remove("disabled");
		Logger.log(definedMessages["common.running"]);

		fetch("api/feature/TPD", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy")
			}),
		}).then(res => res.json()).then(res => {
			if (res.error) throw res.error;

			tpdBtn.classList.remove("disabled");
			tpd.querySelector(".secondary-content.badge").classList.add("disabled");
			Logger.log(definedMessages["common.finish"]);
		});
	});

	RARangeConfirmerLaunch.addEventListener("click", event => {
		event.preventDefault();

		RA.querySelector("A.secondary-content").classList.add("disabled");
		RA.querySelector(".secondary-content.badge").classList.remove("disabled");
		Logger.log(definedMessages["common.running"]);

		let today = new Date();

		fetch("api/feature/RelevanceAnalyzer", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy"),
				dateRange: new Date(today.getFullYear(), today.getMonth(), today.getDate() - RARangeConfirmerRange.value).getTime(),
				isImmediately: RARangeConfirmerSkipConfirm.checked
			}),
		}).then(res => res.json()).then(res => {
			if (res.error) throw res.error;

			if (!res.isImmediately) {
				RARankingConfirmerContent.textContent = res.ranking;
				RARankingConfirmer.M_Modal.open();

				return;
			}
			
			RA.querySelector("A.secondary-content").classList.remove("disabled");
			RA.querySelector(".secondary-content.badge").classList.add("disabled");
			Logger.log(definedMessages["common.finish"]);
		});
	});

	RARankingConfirmerLaunch.addEventListener("click", () => {
		fetch("api/toot", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy"),
				status: RARankingConfirmerContent.textContent
			}),
		}).then(res => res.json()).then(res => {
			if (res.error) throw res.error;
			
			RA.querySelector("A.secondary-content").classList.remove("disabled");
			RA.querySelector(".secondary-content.badge").classList.add("disabled");
			Logger.log(definedMessages["common.finish"]);
		});
	});

	RARankingConfirmerCancel.addEventListener("click", () => {
		RA.querySelector("A.secondary-content").classList.remove("disabled");
		RA.querySelector(".secondary-content.badge").classList.add("disabled");
		Logger.log(definedMessages["common.abort"]);
	});
});

window.addEventListener("DOMContentLoaded", () => {
	const querys = new URLSearchParams(location.search);
	const instance = cookieStore.get("MR-instance");
	const token = cookieStore.get("MR-token");

	if (querys.has("code") && instance) {
		fetch(`api/app?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(info => {
			const { clientId, secretId, redirectTo } = info;

			return fetch(`api/token?instance=${instance}&clientId=${clientId}&secretId=${secretId}&code=${querys.get("code")}&redirectTo=${redirectTo}`).then(res => res.json());
		}).then(res => {
			cookieStore.set("MR-token", res.accessToken);
			location.href = SITEURL;
		});
	}

	if (instance && token) {
		fetch(`api/tokenValidate?instance=${instance}&token=${token}`).then(res => res.json()).then(info => {
			if (!info.valid) {
				cookieStore.delete("MR-instance");
				cookieStore.delete("MR-token");

				fetch(`api/exists?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(info => {
					if (info.exists) {
						return fetch(`api/app`, {
							method: "DELETE",
							headers: { "Content-Type": "application/json" },

							body: JSON.stringify({ instance })
						});
					}
				}).then(() => location.href = SITEURL + "?error=error.NotFoundApplication");
			} else {
				controlPanel.classList.remove("disabled");
				signOutBtnOnHeader.classList.remove("disabled");
				signOutBtnOnSidebar.classList.remove("disabled");
				
				currentInstance.textContent = currentInstance.href = cookieStore.get("MR-instance");
			}
		});
	} else {
		signInPanel.classList.remove("disabled");
	}

	privacySelector.namedItem(`privacy.${cookieStore.get("MR-privacy")}`).selected = true;
});

Locale.on("load").then(messages => {
	const querys = new URLSearchParams(location.search);

	if (querys.has("error")) Logger.error(definedMessages[querys.get("error")]);
});