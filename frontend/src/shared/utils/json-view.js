export function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseJsonSafely(input) {
	if (typeof input !== "string" || !input.trim()) {
		return { value: null, error: "" };
	}

	try {
		return { value: JSON.parse(input), error: "" };
	} catch (error) {
		return { value: null, error: error.message || "Invalid JSON" };
	}
}

export function valuePreview(value) {
	if (Array.isArray(value)) {
		return `[${value.length}]`;
	}

	if (value && typeof value === "object") {
		return `{${Object.keys(value).length}}`;
	}

	if (typeof value === "string") {
		return `"${value.length > 36 ? `${value.slice(0, 33)}...` : value}"`;
	}

	return String(value);
}

export function primitiveToString(value) {
	if (value === null) {
		return "null";
	}

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return "";
}

export function nodeContainsQuery(value, query, label = "") {
	const normalizedQuery = String(query || "")
		.trim()
		.toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	const haystacks = [label, primitiveToString(value)].filter(Boolean).map((item) => item.toLowerCase());
	if (haystacks.some((item) => item.includes(normalizedQuery))) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.some((item, index) => nodeContainsQuery(item, normalizedQuery, String(index)));
	}

	if (value && typeof value === "object") {
		return Object.entries(value).some(([key, nestedValue]) => nodeContainsQuery(nestedValue, normalizedQuery, key));
	}

	return false;
}

export function isJsonContent(headers = []) {
	const contentTypeHeader = headers.find((header) => String(header.key || "").toLowerCase() === "content-type");
	return /json/i.test(contentTypeHeader?.value || "");
}
