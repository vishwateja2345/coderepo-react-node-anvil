import { AppError } from "../../shared/errors/app-error.js";
import { headersToPairs } from "../../shared/utils/http.js";

const MAX_RESPONSE_BODY_BYTES = 200000;

export const executionRepository = {
	async executeRequest({ url, method, headers, body, timeoutMs }) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const startedAt = Date.now();

		try {
			const response = await fetch(url, {
				method,
				headers,
				body,
				redirect: "follow",
				signal: controller.signal,
			});
			const rawBody = await response.text();
			const sizeBytes = new TextEncoder().encode(rawBody).length;
			const bodyTruncated = sizeBytes > MAX_RESPONSE_BODY_BYTES;
			const timeMs = Date.now() - startedAt;

			return {
				ok: true,
				status: response.status,
				statusText: response.statusText,
				headers: headersToPairs(response.headers),
				body: bodyTruncated ? rawBody.slice(0, MAX_RESPONSE_BODY_BYTES) : rawBody,
				sizeBytes,
				bodyTruncated,
				timeMs,
				resolvedUrl: response.url || url,
			};
		} catch (error) {
			const timeMs = Date.now() - startedAt;
			if (error.name === "AbortError") {
				throw new AppError(504, "EXECUTION_TIMEOUT", `The request exceeded the ${timeoutMs}ms timeout.`, { timeMs });
			}
			throw new AppError(502, "EXECUTION_FAILED", error.message || "The request could not be completed.", { timeMs });
		} finally {
			clearTimeout(timeout);
		}
	},
};
