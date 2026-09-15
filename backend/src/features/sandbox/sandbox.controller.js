function clampStatusCode(value) {
	const code = Number.parseInt(value, 10);
	if (Number.isNaN(code)) {
		return 500;
	}
	return Math.max(100, Math.min(599, code));
}

function sleep(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function echoSandboxRequest(request, response) {
	response.json({
		data: {
			method: request.method,
			path: request.path,
			query: request.query,
			headers: Object.fromEntries(
				Object.entries(request.headers).filter(([key]) => !["host", "connection", "content-length"].includes(key)),
			),
			body: request.body ?? null,
			receivedAt: new Date().toISOString(),
		},
	});
}

export async function respondWithStatus(request, response) {
	const code = clampStatusCode(request.params.code);
	response.status(code).json({ data: { code } });
}

export async function respondWithDelay(request, response) {
	const delayedSeconds = Math.max(0, Math.min(5, Number.parseInt(request.params.seconds, 10) || 0));
	await sleep(delayedSeconds * 1000);
	response.json({ data: { delayedSeconds } });
}
