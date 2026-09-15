const TOKEN_PATTERN = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

export function interpolateTemplate(input, values = {}) {
	const missing = new Set();
	const value = String(input ?? "").replace(TOKEN_PATTERN, (match, key) => {
		if (Object.hasOwn(values, key) && values[key] != null) {
			return String(values[key]);
		}
		missing.add(key);
		return match;
	});

	return { value, missingKeys: [...missing] };
}

export function interpolatePairs(pairs = [], values = {}) {
	const missing = new Set();
	const rendered = pairs.map((pair) => {
		const renderedKey = interpolateTemplate(pair?.key ?? "", values);
		const renderedValue = interpolateTemplate(pair?.value ?? "", values);
		renderedKey.missingKeys.forEach((key) => missing.add(key));
		renderedValue.missingKeys.forEach((key) => missing.add(key));
		return {
			key: renderedKey.value,
			value: renderedValue.value,
			enabled: pair?.enabled !== false,
		};
	});

	return { rendered, missingKeys: [...missing] };
}
