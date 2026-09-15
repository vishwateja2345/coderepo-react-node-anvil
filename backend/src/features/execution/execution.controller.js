import { z } from "zod";
import { HTTP_METHODS } from "../../shared/utils/http.js";
import { OBJECT_ID_PATTERN } from "../../shared/utils/object-id.js";
import {
	collectionAuthZodSchema,
	keyValueZodSchema,
	requestAuthZodSchema,
	requestBodyZodSchema,
} from "../../shared/utils/request-contract.js";
import { executionService } from "./execution.service.js";

const executeSchema = z
	.object({
		name: z.string().trim().max(120).optional(),
		method: z.enum(HTTP_METHODS).default("GET"),
		url: z.string().trim().min(1).max(4000),
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
		collectionAuth: collectionAuthZodSchema.optional(),
		environmentId: z.string().regex(OBJECT_ID_PATTERN).optional(),
		savedRequestId: z.string().regex(OBJECT_ID_PATTERN).optional(),
		timeoutMs: z.number().int().min(250).max(20000).default(10000),
		saveHistory: z.boolean().default(true),
	})
	.strict();

export async function executeRequest(request, response, next) {
	try {
		response.json({ data: await executionService.execute(executeSchema.parse(request.body), request.account) });
	} catch (error) {
		next(error);
	}
}
