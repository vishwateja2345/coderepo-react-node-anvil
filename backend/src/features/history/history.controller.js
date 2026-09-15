import { z } from "zod";
import { HTTP_METHODS } from "../../shared/utils/http.js";
import { OBJECT_ID_PATTERN } from "../../shared/utils/object-id.js";
import { historyService } from "./history.service.js";

const listSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	method: z.enum(HTTP_METHODS).optional(),
	q: z.string().trim().max(200).optional(),
});

const saveSchema = z
	.object({
		collectionId: z.string().regex(OBJECT_ID_PATTERN),
		folderId: z.string().regex(OBJECT_ID_PATTERN).nullable().optional(),
		name: z.string().trim().min(1).max(120),
	})
	.strict();

export async function listHistory(request, response, next) {
	try {
		response.json({ data: await historyService.list(request.account._id, listSchema.parse(request.query)) });
	} catch (error) {
		next(error);
	}
}

export async function getHistoryEntry(request, response, next) {
	try {
		response.json({ data: await historyService.getById(request.params.historyId, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function deleteHistoryEntry(request, response, next) {
	try {
		await historyService.remove(request.params.historyId, request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

export async function clearHistory(request, response, next) {
	try {
		await historyService.clear(request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

export async function saveHistoryEntry(request, response, next) {
	try {
		response
			.status(201)
			.json({
				data: await historyService.saveToCollection(request.params.historyId, request.account._id, saveSchema.parse(request.body)),
			});
	} catch (error) {
		next(error);
	}
}
