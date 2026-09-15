export function securityHeaders(request, response, next) {
	response.setHeader("X-Content-Type-Options", "nosniff");
	response.setHeader("X-Frame-Options", "DENY");
	response.setHeader("Referrer-Policy", "no-referrer");
	response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	next();
}
