const SITEURL = location.href.replace(location.search, "");

const privacySelector = document.getElementById("controlPanel-privacy");

window.addEventListener("DOMContentLoaded", () => {
	privacySelector.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});
});

window.addEventListener("DOMContentLoaded", () => {
	privacySelector.namedItem(`privacy.${cookieStore.get("MR-privacy")}`).selected = true;
});