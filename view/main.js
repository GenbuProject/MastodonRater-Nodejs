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
		const instance = instanceInputter.value.replace(/\/$/, "");

		if (instance && instanceInputter.checkValidity()) {
			fetch(`api/exists?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json()).then(res => {
				if (res.exists) {
					return fetch(`api/app?instance=${instance}&redirectTo=${SITEURL}`).then(res => res.json());
				} else {
					return new Promise((resolve, reject) => {
						DOM.xhr({
							type: "POST",
							url: "api/app",
							resType: "json",
							doesSync: true,

							headers: { "Content-Type": "application/json" },

							data: JSON.stringify({
								instance,
								redirectTo: SITEURL
							}),

							onLoad (event) {
								const { status, response } = event.target;

								if (status == 400) {
									reject(response.error);
									return;
								}

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

		tootRaterBtn.classList.add("disabled");
		tootRater.querySelector(".secondary-content.badge").classList.remove("disabled");
		M.toast({ html: definedMessages["common.running"] });

		DOM.xhr({
			type: "POST",
			url: "api/feature/TootRater",
			resType: "json",
			doesSync: true,

			headers: { "Content-Type": "application/json" },

			data: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy")
			}),

			onLoad (event) {
				const { status, response } = event.target;

				if (status == 400) throw response.error;
				
				tootRaterBtn.classList.remove("disabled");
				tootRater.querySelector(".secondary-content.badge").classList.add("disabled");
				M.toast({ html: definedMessages["common.finish"] });
			}
		});
	});

	tpdBtn.addEventListener("click", event => {
		event.preventDefault();

		tpdBtn.classList.add("disabled");
		tpd.querySelector(".secondary-content.badge").classList.remove("disabled");
		M.toast({ html: definedMessages["common.running"] });

		DOM.xhr({
			type: "POST",
			url: "api/feature/TPD",
			resType: "json",
			doesSync: true,

			headers: { "Content-Type": "application/json" },

			data: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy")
			}),

			onLoad (event) {
				const { status, response } = event.target;

				if (status == 400) throw response.error;
				
				tpdBtn.classList.remove("disabled");
				tpd.querySelector(".secondary-content.badge").classList.add("disabled");
				M.toast({ html: definedMessages["common.finish"] });
			}
		});
	});

	RARangeConfirmerLaunch.addEventListener("click", event => {
		event.preventDefault();

		RA.querySelector("A.secondary-content").classList.add("disabled");
		RA.querySelector(".secondary-content.badge").classList.remove("disabled");
		M.toast({ html: definedMessages["common.running"] });

		let today = new Date();

		DOM.xhr({
			type: "POST",
			url: "api/feature/RelevanceAnalyzer",
			resType: "json",
			doesSync: true,

			headers: { "Content-Type": "application/json" },

			data: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy"),
				dateRange: new Date(today.getFullYear(), today.getMonth(), today.getDate() - RARangeConfirmerRange.value).getTime(),
				isImmediately: RARangeConfirmerSkipConfirm.checked
			}),

			onLoad (event) {
				const { status, response } = event.target;

				if (status == 400) throw response.error;

				if (!response.isImmediately) {
					RARankingConfirmerContent.textContent = response.ranking;
					RARankingConfirmer.M_Modal.open();

					return;
				}
				
				RA.querySelector("A.secondary-content").classList.remove("disabled");
				RA.querySelector(".secondary-content.badge").classList.add("disabled");
				M.toast({ html: definedMessages["common.finish"] });
			}
		});
	});

	RARankingConfirmerLaunch.addEventListener("click", () => {
		DOM.xhr({
			type: "POST",
			url: "api/toot",
			resType: "json",
			doesSync: true,

			headers: { "Content-Type": "application/json" },

			data: JSON.stringify({
				instance: cookieStore.get("MR-instance"),
				token: cookieStore.get("MR-token"),
				privacy: cookieStore.get("MR-privacy"),
				status: RARankingConfirmerContent.textContent
			}),

			onLoad (event) {
				const { status, response } = event.target;

				if (status == 400) throw response.error;

				RA.querySelector("A.secondary-content").classList.remove("disabled");
				RA.querySelector(".secondary-content.badge").classList.add("disabled");
				M.toast({ html: definedMessages["common.finish"] });
			}
		});
	});

	RARankingConfirmerCancel.addEventListener("click", () => {
		RA.querySelector("A.secondary-content").classList.remove("disabled");
		RA.querySelector(".secondary-content.badge").classList.add("disabled");
		M.toast({ html: definedMessages["common.abort"] });
	});
});

window.addEventListener("DOMContentLoaded", () => {
	const instance = cookieStore.get("MR-instance");
	const token = cookieStore.get("MR-token");

	if (instance && token) {
		fetch(`api/tokenValidate?instance=${instance}&token=${token}`).then(res => res.json()).then(info => {
			if (!info.valid) {
				cookieStore.delete("MR-instance");
				cookieStore.delete("MR-token");

				location.href = SITEURL;
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