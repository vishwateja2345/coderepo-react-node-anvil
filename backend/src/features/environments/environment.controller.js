import { z } from "zod";
import { environmentService } from "./environment.service.js";

const variableSchema = z
	.object({
		key: z.string().trim().min(1).max(120),
		value: z.string().max(5000).default(""),
		isSecret: z.boolean().default(false),
		enabled: z.boolean().default(true),
	})
	.strict();

const createSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		description: z.string().max(500).default(""),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.default("#f59e0b"),
		isDefault: z.boolean().default(false),
		isActive: z.boolean().default(false),
		variables: z
			.array(variableSchema)
			.max(100)
			.default([])
			.refine(
				(variables) => new Set(variables.map((item) => item.key.toLowerCase())).size === variables.length,
				"Variable keys must be unique.",
			),
	})
	.strict();

const updateSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		description: z.string().max(500).optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.optional(),
		isDefault: z.boolean().optional(),
		isActive: z.boolean().optional(),
		variables: z
			.array(variableSchema)
			.max(100)
			.optional()
			.refine(
				(variables) => !variables || new Set(variables.map((item) => item.key.toLowerCase())).size === variables.length,
				"Variable keys must be unique.",
			),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export async function listEnvironments(request, response, next) {
	try {
		response.json({ data: await environmentService.list(request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function getEnvironment(request, response, next) {
	try {
		response.json({ data: await environmentService.getById(request.params.environmentId, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function createEnvironment(request, response, next) {
	try {
		response.status(201).json({ data: await environmentService.create(createSchema.parse(request.body), request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function updateEnvironment(request, response, next) {
	try {
		response.json({
			data: await environmentService.update(request.params.environmentId, updateSchema.parse(request.body), request.account._id),
		});
	} catch (error) {
		next(error);
	}
}

export async function activateEnvironment(request, response, next) {
	try {
		response.json({ data: await environmentService.activate(request.params.environmentId, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function deleteEnvironment(request, response, next) {
	try {
		await environmentService.remove(request.params.environmentId, request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}
