const SITEURL = location.href.replace(location.search, "");

const privacyPicker = document.getElementById("main-controlPanel-privacy");

window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
	document.querySelectorAll(".dropdown-target").forEach(dropdownTarget => M.Dropdown.init(dropdownTarget));
});

window.addEventListener("DOMContentLoaded", () => {
	privacyPicker.addEventListener("change", event => {
		let privacy = event.target.value;

		//localStorage.setItem("com.GenbuProject.MastodonRater.currentPrivacy", privacy);
	});
});