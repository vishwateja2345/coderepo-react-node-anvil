import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(request, response) {
	response.status(404).json({
		error: {
			code: "NOT_FOUND",
			message: `Route ${request.method} ${request.path} was not found.`,
		},
	});
}

export function errorHandler(error, request, response, next) {
	if (error instanceof ZodError) {
		return response.status(400).json({
			error: {
				code: "VALIDATION_ERROR",
				message: "Request validation failed.",
				details: error.flatten(),
			},
		});
	}

	if (error instanceof AppError) {
		return response.status(error.statusCode).json({
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
			},
		});
	}

	if (error.type === "entity.parse.failed" || (error instanceof SyntaxError && error.status === 400)) {
		return response.status(400).json({
			error: {
				code: "MALFORMED_JSON",
				message: "The request body is not valid JSON.",
			},
		});
	}

	console.error(error);
	return response.status(500).json({
		error: {
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred.",
		},
	});
}
