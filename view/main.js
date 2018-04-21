const SITEURL = location.href.replace(location.search, "");

window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
	document.querySelectorAll(".dropdown-target").forEach(dropdownTarget => M.Dropdown.init(dropdownTarget));
});