export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function normalizeKeyValuePairs(pairs = []) {
	return (Array.isArray(pairs) ? pairs : [])
		.filter((pair) => pair && pair.enabled !== false && String(pair.key || "").trim())
		.map((pair) => ({
			key: String(pair.key).trim(),
			value: String(pair.value ?? ""),
			enabled: pair.enabled !== false,
		}));
}

export function keyValuePairsToObject(pairs = []) {
	return normalizeKeyValuePairs(pairs).reduce((accumulator, pair) => {
		accumulator[pair.key] = pair.value;
		return accumulator;
	}, {});
}

export function headersToPairs(headers) {
	return [...headers.entries()].map(([key, value]) => ({ key, value }));
}
