class Logger {
	static log (message = "") {
		if (Array.isArray(message)) message = message.join("<Br />");

		M.toast({ html: message });
	}

	static error (message = "") {
		if (Array.isArray(message)) message = message.join("<Br />");

		M.toast({ html: message, classes: "red darken-2", displayLength: 10000 });
	}
}