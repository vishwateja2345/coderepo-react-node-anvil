export function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return "—";
	}

	if (bytes < 1024) {
		return `${bytes} B`;
	}

	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let index = 0;

	while (value >= 1024 && index < units.length - 1) {
		value /= 1024;
		index += 1;
	}

	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export function formatDuration(milliseconds) {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) {
		return "—";
	}

	if (milliseconds < 1000) {
		return `${Math.round(milliseconds)} ms`;
	}

	if (milliseconds < 60000) {
		return `${(milliseconds / 1000).toFixed(milliseconds >= 10000 ? 0 : 1)} s`;
	}

	const minutes = Math.floor(milliseconds / 60000);
	const seconds = Math.round((milliseconds % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}

export function formatDateTime(value) {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

export function methodToClass(method) {
	return String(method || "get").toLowerCase();
}

export function getInitials(name) {
	return (
		String(name || "User")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() || "")
			.join("") || "U"
	);
}
