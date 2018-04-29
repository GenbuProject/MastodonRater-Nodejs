const SITEURL = location.href.replace(location.search, "");

const privacySelector = document.getElementById("controlPanel-privacy");

window.addEventListener("DOMContentLoaded", () => {
	privacySelector.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});
});

window.addEventListener("DOMContentLoaded", () => {
	cookieStore.get("MR-privacy").then(item => privacySelector.namedItem(`privacy.${item.value}`).selected = true);
});