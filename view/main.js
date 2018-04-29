const SITEURL = location.href.replace(location.search, "");

const privacyPicker = document.getElementById("controlPanel-privacy");

window.addEventListener("DOMContentLoaded", () => {
	privacyPicker.addEventListener("change", event => {
		let privacy = event.target.value;
			cookieStore.set("MR-privacy", privacy);
	});
});

window.addEventListener("DOMContentLoaded", () => {
	
});