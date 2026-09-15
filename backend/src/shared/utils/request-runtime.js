import { AppError } from "../errors/app-error.js";
import { interpolatePairs, interpolateTemplate } from "./template.js";
import { normalizeKeyValuePairs } from "./http.js";

function defaultRequestAuth() {
	return {
		type: "inherit",
		bearerToken: "",
		basicUsername: "",
		basicPassword: "",
		apiKeyKey: "",
		apiKeyValue: "",
		apiKeyLocation: "header",
	};
}

function defaultCollectionAuth() {
	return {
		type: "none",
		bearerToken: "",
		basicUsername: "",
		basicPassword: "",
		apiKeyKey: "",
		apiKeyValue: "",
		apiKeyLocation: "header",
	};
}

function defaultBody() {
	return { mode: "none", raw: "", formItems: [] };
}

function interpolateAuth(auth, variables) {
	const normalized = { ...defaultCollectionAuth(), ...auth };
	const missing = new Set();
	const read = (value) => {
		const interpolated = interpolateTemplate(value ?? "", variables);
		interpolated.missingKeys.forEach((key) => missing.add(key));
		return interpolated.value;
	};

	return {
		auth: {
			type: normalized.type,
			bearerToken: read(normalized.bearerToken),
			basicUsername: read(normalized.basicUsername),
			basicPassword: read(normalized.basicPassword),
			apiKeyKey: read(normalized.apiKeyKey),
			apiKeyValue: read(normalized.apiKeyValue),
			apiKeyLocation: normalized.apiKeyLocation || "header",
		},
		missingKeys: [...missing],
	};
}

export function resolveRequestAuth(auth, collectionAuth, variables) {
	const requested = { ...defaultRequestAuth(), ...(auth || {}) };
	const fallback = { ...defaultCollectionAuth(), ...(collectionAuth || {}) };
	const effective = requested.type === "inherit" ? fallback : requested;
	const interpolated = interpolateAuth(effective, variables);
	return { auth: interpolated.auth, missingKeys: interpolated.missingKeys };
}

function setHeaderCaseInsensitive(headers, key, value) {
	const existingKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
	headers[existingKey || key] = value;
}

function hasHeader(headers, key) {
	return Object.keys(headers).some((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
}

function buildBodyPayload(bodyInput, variables, headers) {
	const body = { ...defaultBody(), ...(bodyInput || {}) };
	const missing = new Set();

	if (body.mode === "none") {
		return { body: { mode: "none", raw: "", formItems: [] }, outboundBody: undefined, missingKeys: [], headers };
	}

	if (body.mode === "form") {
		const interpolated = interpolatePairs(body.formItems || [], variables);
		interpolated.missingKeys.forEach((key) => missing.add(key));
		const params = new URLSearchParams();
		for (const item of normalizeKeyValuePairs(interpolated.rendered)) {
			params.append(item.key, item.value);
		}
		if (!hasHeader(headers, "Content-Type")) {
			setHeaderCaseInsensitive(headers, "Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
		}
		return {
			body: { mode: "form", raw: body.raw || "", formItems: normalizeKeyValuePairs(interpolated.rendered) },
			outboundBody: params.toString(),
			missingKeys: [...missing],
			headers,
		};
	}

	const interpolated = interpolateTemplate(body.raw ?? "", variables);
	interpolated.missingKeys.forEach((key) => missing.add(key));

	if (body.mode === "json" && !hasHeader(headers, "Content-Type")) {
		setHeaderCaseInsensitive(headers, "Content-Type", "application/json");
	}

	return {
		body: { mode: body.mode, raw: body.raw ?? "", formItems: normalizeKeyValuePairs(body.formItems || []) },
		outboundBody: interpolated.value,
		missingKeys: [...missing],
		headers,
	};
}

export function resolveRequestDefinition(input, variables = {}) {
	const urlInterpolation = interpolateTemplate(input.url ?? "", variables);
	let resolvedUrl;
	try {
		resolvedUrl = new URL(urlInterpolation.value);
	} catch {
		throw new AppError(400, "INVALID_URL", "Provide a valid absolute URL after variable interpolation.");
	}

	const paramsInterpolation = interpolatePairs(input.params || [], variables);
	for (const item of normalizeKeyValuePairs(paramsInterpolation.rendered)) {
		resolvedUrl.searchParams.append(item.key, item.value);
	}

	const headersInterpolation = interpolatePairs(input.headers || [], variables);
	const headers = {};
	for (const item of normalizeKeyValuePairs(headersInterpolation.rendered)) {
		headers[item.key] = item.value;
	}

	const authResolution = resolveRequestAuth(input.auth, input.collectionAuth, variables);
	if (authResolution.auth.type === "bearer") {
		setHeaderCaseInsensitive(headers, "Authorization", `Bearer ${authResolution.auth.bearerToken}`);
	}
	if (authResolution.auth.type === "basic") {
		const encoded = Buffer.from(`${authResolution.auth.basicUsername}:${authResolution.auth.basicPassword}`).toString("base64");
		setHeaderCaseInsensitive(headers, "Authorization", `Basic ${encoded}`);
	}
	if (authResolution.auth.type === "apiKey" && authResolution.auth.apiKeyKey) {
		if (authResolution.auth.apiKeyLocation === "query") {
			resolvedUrl.searchParams.append(authResolution.auth.apiKeyKey, authResolution.auth.apiKeyValue);
		} else {
			setHeaderCaseInsensitive(headers, authResolution.auth.apiKeyKey, authResolution.auth.apiKeyValue);
		}
	}

	const bodyPayload = buildBodyPayload(input.body, variables, headers);
	const shouldSendBody = !["GET", "HEAD"].includes(String(input.method || "GET").toUpperCase()) && bodyPayload.body.mode !== "none";
	const responseHeaders = Object.entries(headers).map(([key, value]) => ({ key, value }));

	return {
		name: input.name || "Untitled request",
		method: String(input.method || "GET").toUpperCase(),
		url: String(input.url ?? ""),
		params: normalizeKeyValuePairs(input.params || []),
		headers: normalizeKeyValuePairs(input.headers || []),
		body: bodyPayload.body,
		auth: input.auth || defaultRequestAuth(),
		resolvedAuth: authResolution.auth,
		resolvedHeaders: responseHeaders,
		resolvedParams: normalizeKeyValuePairs(paramsInterpolation.rendered),
		resolvedUrl: resolvedUrl.toString(),
		outboundHeaders: headers,
		outboundBody: shouldSendBody ? bodyPayload.outboundBody : undefined,
		bodyMode: bodyPayload.body.mode,
		missingVariables: [
			...new Set([
				...urlInterpolation.missingKeys,
				...paramsInterpolation.missingKeys,
				...headersInterpolation.missingKeys,
				...bodyPayload.missingKeys,
				...authResolution.missingKeys,
			]),
		],
	};
}

function escapeShell(value) {
	return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function objectLiteral(entries) {
	return JSON.stringify(Object.fromEntries(entries), null, 4);
}

export function generateSnippet(language, resolvedRequest) {
	const headers = Object.fromEntries((resolvedRequest.resolvedHeaders || []).map((header) => [header.key, header.value]));
	const hasHeaders = Object.keys(headers).length > 0;
	const hasBody = resolvedRequest.outboundBody !== undefined;

	if (language === "curl") {
		const lines = [`curl -X ${resolvedRequest.method} ${escapeShell(resolvedRequest.resolvedUrl)}`];
		for (const header of resolvedRequest.resolvedHeaders || []) {
			lines.push(`  -H ${escapeShell(`${header.key}: ${header.value}`)}`);
		}
		if (hasBody) {
			lines.push(`  --data ${escapeShell(resolvedRequest.outboundBody)}`);
		}
		return lines.join(" \\\n");
	}

	if (language === "javascript-fetch") {
		const bodyLine = hasBody ? `,\n    body: ${JSON.stringify(resolvedRequest.outboundBody)}` : "";
		const headersLine = hasHeaders ? `,\n    headers: ${objectLiteral(Object.entries(headers))}` : "";
		return `const response = await fetch(${JSON.stringify(resolvedRequest.resolvedUrl)}, {\n    method: ${JSON.stringify(resolvedRequest.method)}${headersLine}${bodyLine}\n});\n\nconst text = await response.text();\nconsole.log(response.status, response.statusText);\nconsole.log(text);`;
	}

	if (language === "python-requests") {
		const headerBlock = hasHeaders ? `headers = ${JSON.stringify(headers, null, 4)}\n` : "headers = {}\n";
		const bodyArg = hasBody ? `, data=${JSON.stringify(resolvedRequest.outboundBody)}` : "";
		return `import requests\n\nurl = ${JSON.stringify(resolvedRequest.resolvedUrl)}\n${headerBlock}\nresponse = requests.request(${JSON.stringify(resolvedRequest.method)}, url, headers=headers${bodyArg})\nprint(response.status_code, response.reason)\nprint(response.text)`;
	}

	throw new AppError(400, "UNSUPPORTED_SNIPPET_LANGUAGE", "Choose a supported snippet language.");
}
