import { AppError } from "../errors/app-error.js";

/**
 * Minimal in-memory fixed-window rate limiter. No external dependency: a small
 * Map keyed by client IP is sufficient for a single-process deployment of this
 * scale, and avoids expanding the approved dependency surface.
 */
export function rateLimit({ windowMs, max, message = "Too many requests. Please try again later." }) {
	const hits = new Map();

	return function rateLimitMiddleware(request, response, next) {
		const key = request.ip || "unknown";
		const now = Date.now();
		const entry = hits.get(key);

		if (!entry || now > entry.resetAt) {
			hits.set(key, { count: 1, resetAt: now + windowMs });
			return next();
		}

		entry.count += 1;
		if (entry.count > max) {
			const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
			response.setHeader("Retry-After", String(retryAfterSeconds));
			return next(new AppError(429, "RATE_LIMITED", message));
		}

		return next();
	};
}
