import { z } from "zod";
import { OBJECT_ID_PATTERN } from "../../shared/utils/object-id.js";
import { collectionAuthZodSchema, savedRequestCreateZodSchema, savedRequestUpdateZodSchema } from "../../shared/utils/request-contract.js";
import { collectionService } from "./collection.service.js";

const collectionCreateSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		description: z.string().max(1000).default(""),
		auth: collectionAuthZodSchema.optional(),
	})
	.strict();

const collectionUpdateSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		description: z.string().max(1000).optional(),
		auth: collectionAuthZodSchema.optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

const folderCreateSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
const folderUpdateSchema = folderCreateSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const reorderSchema = z.object({ orderedIds: z.array(z.string().regex(OBJECT_ID_PATTERN)).min(1) }).strict();
const requestReorderSchema = z
	.object({ folderId: z.string().regex(OBJECT_ID_PATTERN).nullable(), orderedIds: z.array(z.string().regex(OBJECT_ID_PATTERN)).min(1) })
	.strict();

export async function listCollections(request, response, next) {
	try {
		response.json({ data: await collectionService.list(request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function createCollection(request, response, next) {
	try {
		response
			.status(201)
			.json({ data: await collectionService.createCollection(collectionCreateSchema.parse(request.body), request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function updateCollection(request, response, next) {
	try {
		response.json({
			data: await collectionService.updateCollection(
				request.params.id,
				collectionUpdateSchema.parse(request.body),
				request.account._id,
			),
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteCollection(request, response, next) {
	try {
		await collectionService.deleteCollection(request.params.id, request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

export async function duplicateCollection(request, response, next) {
	try {
		response.status(201).json({ data: await collectionService.duplicateCollection(request.params.id, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function reorderCollections(request, response, next) {
	try {
		const { orderedIds } = reorderSchema.parse(request.body);
		await collectionService.reorderCollections(orderedIds, request.account._id);
		response.json({ data: { orderedIds } });
	} catch (error) {
		next(error);
	}
}

export async function createFolder(request, response, next) {
	try {
		response
			.status(201)
			.json({
				data: await collectionService.createFolder(
					request.params.collectionId,
					folderCreateSchema.parse(request.body),
					request.account._id,
				),
			});
	} catch (error) {
		next(error);
	}
}

export async function updateFolder(request, response, next) {
	try {
		response.json({
			data: await collectionService.updateFolder(request.params.id, folderUpdateSchema.parse(request.body), request.account._id),
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteFolder(request, response, next) {
	try {
		await collectionService.deleteFolder(request.params.id, request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

export async function duplicateFolder(request, response, next) {
	try {
		response.status(201).json({ data: await collectionService.duplicateFolder(request.params.id, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function reorderFolders(request, response, next) {
	try {
		const { orderedIds } = reorderSchema.parse(request.body);
		await collectionService.reorderFolders(request.params.collectionId, orderedIds, request.account._id);
		response.json({ data: { orderedIds } });
	} catch (error) {
		next(error);
	}
}

export async function createRequest(request, response, next) {
	try {
		response
			.status(201)
			.json({
				data: await collectionService.createRequest(
					request.params.collectionId,
					savedRequestCreateZodSchema.parse(request.body),
					request.account._id,
				),
			});
	} catch (error) {
		next(error);
	}
}

export async function updateRequest(request, response, next) {
	try {
		response.json({
			data: await collectionService.updateRequest(
				request.params.id,
				savedRequestUpdateZodSchema.parse(request.body),
				request.account._id,
			),
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteRequest(request, response, next) {
	try {
		await collectionService.deleteRequest(request.params.id, request.account._id);
		response.status(204).end();
	} catch (error) {
		next(error);
	}
}

export async function duplicateRequest(request, response, next) {
	try {
		response.status(201).json({ data: await collectionService.duplicateRequest(request.params.id, request.account._id) });
	} catch (error) {
		next(error);
	}
}

export async function reorderRequests(request, response, next) {
	try {
		const { folderId, orderedIds } = requestReorderSchema.parse(request.body);
		await collectionService.reorderRequests(request.params.collectionId, folderId, orderedIds, request.account._id);
		response.json({ data: { folderId, orderedIds } });
	} catch (error) {
		next(error);
	}
}
