export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
export const SNIPPET_LANGUAGES = [
	{ value: "curl", label: "cURL" },
	{ value: "javascript-fetch", label: "JavaScript fetch" },
	{ value: "python-requests", label: "Python requests" },
];
export const AUTH_TYPE_OPTIONS = [
	{ value: "none", label: "No auth" },
	{ value: "inherit", label: "Inherit from collection" },
	{ value: "bearer", label: "Bearer token" },
	{ value: "basic", label: "Basic auth" },
	{ value: "apiKey", label: "API key" },
];

export function createKeyValueRow(values = {}) {
	return {
		id: values.id || crypto.randomUUID(),
		key: values.key || "",
		value: values.value || "",
		enabled: values.enabled !== false,
	};
}

export function defaultAuth(type = "none") {
	return {
		type,
		bearerToken: "",
		basicUsername: "",
		basicPassword: "",
		apiKeyKey: "",
		apiKeyValue: "",
		apiKeyLocation: "header",
	};
}

export function normalizeAuth(auth = {}) {
	return {
		...defaultAuth(auth.type || "none"),
		...auth,
	};
}

export function sanitizeAuth(auth = {}) {
	const normalized = normalizeAuth(auth);
	return {
		type: normalized.type,
		bearerToken: normalized.bearerToken,
		basicUsername: normalized.basicUsername,
		basicPassword: normalized.basicPassword,
		apiKeyKey: normalized.apiKeyKey,
		apiKeyValue: normalized.apiKeyValue,
		apiKeyLocation: normalized.apiKeyLocation,
	};
}

export function defaultBody() {
	return {
		mode: "none",
		raw: "",
		formItems: [createKeyValueRow()],
	};
}

export function normalizeBody(body = {}) {
	return {
		mode: body.mode || "none",
		raw: body.raw || "",
		formItems: normalizeKeyValueList(body.formItems, { ensureOne: true }),
	};
}

export function sanitizeKeyValueList(rows = []) {
	return rows
		.map((row) => ({
			key: row.key || "",
			value: row.value || "",
			enabled: row.enabled !== false,
		}))
		.filter((row) => row.key.trim() || row.value.trim());
}

export function normalizeKeyValueList(rows = [], options = {}) {
	const normalized = Array.isArray(rows) ? rows.map((row) => createKeyValueRow(row)) : [];
	if (options.ensureOne !== false && normalized.length === 0) {
		normalized.push(createKeyValueRow());
	}
	return normalized;
}

export function sanitizeBody(body = {}) {
	const normalized = normalizeBody(body);
	return {
		mode: normalized.mode,
		raw: normalized.raw,
		formItems: sanitizeKeyValueList(normalized.formItems),
	};
}

export function createBlankRequest(overrides = {}) {
	return {
		name: overrides.name || "Untitled request",
		method: overrides.method || "GET",
		url: overrides.url || "",
		params: normalizeKeyValueList(overrides.params, { ensureOne: true }),
		headers: normalizeKeyValueList(overrides.headers, { ensureOne: true }),
		body: normalizeBody(overrides.body),
		auth: normalizeAuth(overrides.auth),
	};
}

export function hydrateSavedRequest(savedRequest = {}) {
	return createBlankRequest({
		name: savedRequest.name,
		method: savedRequest.method,
		url: savedRequest.url,
		params: savedRequest.params,
		headers: savedRequest.headers,
		body: savedRequest.body,
		auth: savedRequest.auth,
	});
}

export function serializeRequest(request) {
	return JSON.stringify({
		name: request.name,
		method: request.method,
		url: request.url,
		params: sanitizeKeyValueList(request.params),
		headers: sanitizeKeyValueList(request.headers),
		body: sanitizeBody(request.body),
		auth: sanitizeAuth(request.auth),
	});
}
