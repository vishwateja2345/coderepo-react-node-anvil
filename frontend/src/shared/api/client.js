const API_BASE = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "anvil-session-token";

class ApiError extends Error {
	constructor(message, status, payload) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.payload = payload;
	}
}

function withBase(path) {
	return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function dispatchSessionExpired(message) {
	window.dispatchEvent(new CustomEvent("anvil-session-expired", { detail: message || "Your Anvil session has expired." }));
}

export function readErrorMessage(payload, fallback = "Something went wrong.") {
	const base = payload?.error?.message || fallback;
	const fieldErrors = payload?.error?.details?.fieldErrors;
	if (fieldErrors && typeof fieldErrors === "object") {
		const firstIssue = Object.entries(fieldErrors).find(([, messages]) => Array.isArray(messages) && messages.length > 0);
		if (firstIssue) {
			const [field, messages] = firstIssue;
			return `${base} (${field}: ${messages[0]})`;
		}
	}
	return base;
}

export function getSessionToken() {
	return localStorage.getItem(TOKEN_KEY) || "";
}

export function setSessionToken(token) {
	if (token) {
		localStorage.setItem(TOKEN_KEY, token);
	} else {
		localStorage.removeItem(TOKEN_KEY);
	}
}

export function clearSessionToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export function hasSessionToken() {
	return Boolean(getSessionToken());
}

export async function apiRequest(path, options = {}) {
	const { auth = true, body, headers = {}, method = "GET", signal } = options;
	const requestHeaders = new Headers(headers);
	if (auth && getSessionToken()) {
		requestHeaders.set("Authorization", `Bearer ${getSessionToken()}`);
	}

	let payload = body;
	if (body !== undefined && body !== null && !(body instanceof FormData)) {
		requestHeaders.set("Content-Type", "application/json");
		payload = JSON.stringify(body);
	}

	const response = await fetch(withBase(path), {
		method,
		headers: requestHeaders,
		body: payload,
		signal,
	});

	const contentType = response.headers.get("content-type") || "";
	let responsePayload = null;
	if (response.status !== 204) {
		if (contentType.includes("application/json")) {
			responsePayload = await response.json();
		} else {
			const text = await response.text();
			responsePayload = text ? { data: text } : null;
		}
	}

	if (response.status === 401) {
		clearSessionToken();
		dispatchSessionExpired(readErrorMessage(responsePayload, "Your Anvil session has expired."));
	}

	if (!response.ok) {
		throw new ApiError(readErrorMessage(responsePayload), response.status, responsePayload);
	}

	return responsePayload;
}
