import mongoose from "mongoose";
import { z } from "zod";
import { HTTP_METHODS } from "./http.js";

export const BODY_MODES = ["none", "json", "text", "form"];
export const API_KEY_LOCATIONS = ["header", "query"];
export const REQUEST_AUTH_TYPES = ["none", "inherit", "bearer", "basic", "apiKey"];
export const COLLECTION_AUTH_TYPES = ["none", "bearer", "basic", "apiKey"];

export const keyValueMongooseSchema = new mongoose.Schema(
	{
		key: { type: String, required: true, trim: true, maxlength: 200 },
		value: { type: String, default: "", maxlength: 5000 },
		enabled: { type: Boolean, default: true },
	},
	{ _id: false, versionKey: false },
);

export const requestBodyMongooseSchema = new mongoose.Schema(
	{
		mode: { type: String, enum: BODY_MODES, default: "none" },
		raw: { type: String, default: "", maxlength: 50000 },
		formItems: { type: [keyValueMongooseSchema], default: [] },
	},
	{ _id: false, versionKey: false },
);

export function createAuthMongooseSchema({ allowInherit = false, defaultType = "none" } = {}) {
	return new mongoose.Schema(
		{
			type: { type: String, enum: allowInherit ? REQUEST_AUTH_TYPES : COLLECTION_AUTH_TYPES, default: defaultType },
			bearerToken: { type: String, default: "", maxlength: 5000 },
			basicUsername: { type: String, default: "", maxlength: 5000 },
			basicPassword: { type: String, default: "", maxlength: 5000 },
			apiKeyKey: { type: String, default: "", maxlength: 5000 },
			apiKeyValue: { type: String, default: "", maxlength: 5000 },
			apiKeyLocation: { type: String, enum: API_KEY_LOCATIONS, default: "header" },
		},
		{ _id: false, versionKey: false },
	);
}

export const keyValueZodSchema = z
	.object({
		key: z.string().max(200).default(""),
		value: z.string().max(5000).default(""),
		enabled: z.boolean().default(true),
	})
	.strict();

export const requestBodyZodSchema = z
	.object({
		mode: z.enum(BODY_MODES).default("none"),
		raw: z.string().max(50000).default(""),
		formItems: z.array(keyValueZodSchema).max(200).default([]),
	})
	.strict();

export function createAuthZodSchema({ allowInherit = false, defaultType = "none" } = {}) {
	return z
		.object({
			type: z.enum(allowInherit ? REQUEST_AUTH_TYPES : COLLECTION_AUTH_TYPES).default(defaultType),
			bearerToken: z.string().max(5000).default(""),
			basicUsername: z.string().max(5000).default(""),
			basicPassword: z.string().max(5000).default(""),
			apiKeyKey: z.string().max(5000).default(""),
			apiKeyValue: z.string().max(5000).default(""),
			apiKeyLocation: z.enum(API_KEY_LOCATIONS).default("header"),
		})
		.strict();
}

export const collectionAuthZodSchema = createAuthZodSchema({ allowInherit: false, defaultType: "none" });
export const requestAuthZodSchema = createAuthZodSchema({ allowInherit: true, defaultType: "inherit" });

export const savedRequestCreateZodSchema = z
	.object({
		folderId: z
			.string()
			.regex(/^[a-f\d]{24}$/i)
			.nullable()
			.optional(),
		name: z.string().trim().min(1).max(120),
		method: z.enum(HTTP_METHODS).default("GET"),
		url: z.string().trim().max(4000).default(""),
		params: z.array(keyValueZodSchema).max(200).default([]),
		headers: z.array(keyValueZodSchema).max(200).default([]),
		body: requestBodyZodSchema.default({ mode: "none", raw: "", formItems: [] }),
		auth: requestAuthZodSchema.default({
			type: "inherit",
			bearerToken: "",
			basicUsername: "",
			basicPassword: "",
			apiKeyKey: "",
			apiKeyValue: "",
			apiKeyLocation: "header",
		}),
	})
	.strict();

export const savedRequestUpdateZodSchema = z
	.object({
		folderId: z
			.string()
			.regex(/^[a-f\d]{24}$/i)
			.nullable()
			.optional(),
		name: z.string().trim().min(1).max(120).optional(),
		method: z.enum(HTTP_METHODS).optional(),
		url: z.string().trim().max(4000).optional(),
		params: z.array(keyValueZodSchema).max(200).optional(),
		headers: z.array(keyValueZodSchema).max(200).optional(),
		body: requestBodyZodSchema.optional(),
		auth: requestAuthZodSchema.optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
