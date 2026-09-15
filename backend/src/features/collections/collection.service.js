import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { assertObjectId } from "../../shared/utils/object-id.js";
import { collectionRepository } from "./collection.repository.js";

function defaultCollectionAuth(auth = {}) {
	return {
		type: auth.type || "none",
		bearerToken: auth.bearerToken || "",
		basicUsername: auth.basicUsername || "",
		basicPassword: auth.basicPassword || "",
		apiKeyKey: auth.apiKeyKey || "",
		apiKeyValue: auth.apiKeyValue || "",
		apiKeyLocation: auth.apiKeyLocation || "header",
	};
}

function defaultRequestAuth(auth = {}) {
	return {
		type: auth.type || "inherit",
		bearerToken: auth.bearerToken || "",
		basicUsername: auth.basicUsername || "",
		basicPassword: auth.basicPassword || "",
		apiKeyKey: auth.apiKeyKey || "",
		apiKeyValue: auth.apiKeyValue || "",
		apiKeyLocation: auth.apiKeyLocation || "header",
	};
}

function defaultBody(body = {}) {
	return {
		mode: body.mode || "none",
		raw: body.raw || "",
		formItems: Array.isArray(body.formItems) ? body.formItems : [],
	};
}

function formatFolder(folder) {
	return {
		_id: String(folder._id),
		name: folder.name,
		order: folder.order || 0,
	};
}

function formatRequest(request) {
	return {
		_id: String(request._id),
		folderId: request.folderId ? String(request.folderId) : null,
		name: request.name,
		method: request.method,
		url: request.url,
		params: request.params || [],
		headers: request.headers || [],
		body: defaultBody(request.body),
		auth: defaultRequestAuth(request.auth),
		order: request.order || 0,
	};
}

function formatCollection(collection, folders = [], requests = []) {
	return {
		_id: String(collection._id),
		name: collection.name,
		description: collection.description || "",
		auth: defaultCollectionAuth(collection.auth),
		order: collection.order || 0,
		folders: folders.map(formatFolder),
		requests: requests.map(formatRequest),
	};
}

async function ensureCollection(collectionId, ownerId) {
	assertObjectId(collectionId, "COLLECTION_NOT_FOUND", "The requested collection does not exist.");
	const collection = await collectionRepository.findCollectionById(collectionId, ownerId);
	if (!collection) {
		throw new AppError(404, "COLLECTION_NOT_FOUND", "The requested collection does not exist.");
	}
	return collection;
}

async function ensureFolder(folderId, ownerId) {
	assertObjectId(folderId, "FOLDER_NOT_FOUND", "The requested folder does not exist.");
	const folder = await collectionRepository.findFolderById(folderId, ownerId);
	if (!folder) {
		throw new AppError(404, "FOLDER_NOT_FOUND", "The requested folder does not exist.");
	}
	return folder;
}

async function ensureRequest(requestId, ownerId) {
	assertObjectId(requestId, "REQUEST_NOT_FOUND", "The requested request does not exist.");
	const request = await collectionRepository.findRequestById(requestId, ownerId);
	if (!request) {
		throw new AppError(404, "REQUEST_NOT_FOUND", "The requested request does not exist.");
	}
	return request;
}

async function validateFolderPlacement(collectionId, folderId, ownerId) {
	if (!folderId) {
		return null;
	}
	const folder = await ensureFolder(folderId, ownerId);
	if (String(folder.collectionId) !== String(collectionId)) {
		throw new AppError(422, "FOLDER_COLLECTION_MISMATCH", "The selected folder does not belong to this collection.");
	}
	return folder;
}

export const collectionService = {
	async list(ownerId) {
		const [collections, folders, requests] = await Promise.all([
			collectionRepository.listCollections(ownerId),
			collectionRepository.listFolders(ownerId),
			collectionRepository.listRequests(ownerId),
		]);

		const foldersByCollection = new Map();
		for (const folder of folders) {
			const key = String(folder.collectionId);
			if (!foldersByCollection.has(key)) {
				foldersByCollection.set(key, []);
			}
			foldersByCollection.get(key).push(folder);
		}

		const requestsByCollection = new Map();
		for (const request of requests) {
			const key = String(request.collectionId);
			if (!requestsByCollection.has(key)) {
				requestsByCollection.set(key, []);
			}
			requestsByCollection.get(key).push(request);
		}

		return collections.map((collection) =>
			formatCollection(
				collection,
				foldersByCollection.get(String(collection._id)) || [],
				requestsByCollection.get(String(collection._id)) || [],
			),
		);
	},

	async createCollection(input, ownerId) {
		const order = await collectionRepository.countCollections(ownerId);
		const collection = await collectionRepository.createCollection({
			ownerId,
			name: input.name,
			description: input.description || "",
			auth: defaultCollectionAuth(input.auth),
			order,
		});
		return formatCollection(collection.toObject(), [], []);
	},

	async updateCollection(collectionId, input, ownerId) {
		await ensureCollection(collectionId, ownerId);
		const update = { ...input };
		if (update.auth) {
			update.auth = defaultCollectionAuth(update.auth);
		}
		const collection = await collectionRepository.updateCollection(collectionId, ownerId, update);
		const [folders, requests] = await Promise.all([
			collectionRepository.listFolders(ownerId),
			collectionRepository.listRequestsByCollection(collectionId, ownerId),
		]);
		return formatCollection(
			collection,
			folders.filter((folder) => String(folder.collectionId) === String(collectionId)),
			requests,
		);
	},

	async deleteCollection(collectionId, ownerId) {
		await ensureCollection(collectionId, ownerId);
		await collectionRepository.deleteRequestsByCollection(collectionId, ownerId);
		await collectionRepository.deleteFoldersByCollection(collectionId, ownerId);
		await collectionRepository.deleteCollection(collectionId, ownerId);
	},

	async duplicateCollection(collectionId, ownerId) {
		const source = await ensureCollection(collectionId, ownerId);
		const [folders, requests] = await Promise.all([
			collectionRepository.listFolders(ownerId),
			collectionRepository.listRequestsByCollection(collectionId, ownerId),
		]);
		const collectionFolders = folders
			.filter((folder) => String(folder.collectionId) === String(collectionId))
			.sort((left, right) => (left.order || 0) - (right.order || 0));
		const order = await collectionRepository.countCollections(ownerId);
		const duplicate = await collectionRepository.createCollection({
			ownerId,
			name: `${source.name} copy`,
			description: source.description || "",
			auth: defaultCollectionAuth(source.auth),
			order,
		});

		const folderIdMap = new Map();
		const duplicatedFolders = [];
		for (const folder of collectionFolders) {
			const created = await collectionRepository.createFolder({
				ownerId,
				collectionId: duplicate._id,
				name: `${folder.name} copy`,
				order: folder.order || 0,
			});
			const plain = created.toObject();
			folderIdMap.set(String(folder._id), plain._id);
			duplicatedFolders.push(plain);
		}

		const duplicatedRequests = [];
		for (const request of requests) {
			const created = await collectionRepository.createRequest({
				ownerId,
				collectionId: duplicate._id,
				folderId: request.folderId ? folderIdMap.get(String(request.folderId)) || null : null,
				name: `${request.name} copy`,
				method: request.method,
				url: request.url,
				params: request.params || [],
				headers: request.headers || [],
				body: defaultBody(request.body),
				auth: defaultRequestAuth(request.auth),
				order: request.order || 0,
			});
			duplicatedRequests.push(created.toObject());
		}

		return formatCollection(duplicate.toObject(), duplicatedFolders, duplicatedRequests);
	},

	async reorderCollections(orderedIds, ownerId) {
		for (const id of orderedIds) {
			await ensureCollection(id, ownerId);
		}
		await collectionRepository.reorderCollections(ownerId, orderedIds);
	},

	async createFolder(collectionId, input, ownerId) {
		await ensureCollection(collectionId, ownerId);
		const order = await collectionRepository.countFolders(collectionId, ownerId);
		const folder = await collectionRepository.createFolder({ ownerId, collectionId, name: input.name, order });
		return formatFolder(folder.toObject());
	},

	async updateFolder(folderId, input, ownerId) {
		await ensureFolder(folderId, ownerId);
		const folder = await collectionRepository.updateFolder(folderId, ownerId, input);
		return formatFolder(folder);
	},

	async deleteFolder(folderId, ownerId) {
		await ensureFolder(folderId, ownerId);
		await collectionRepository.deleteRequestsByFolder(folderId, ownerId);
		await collectionRepository.deleteFolder(folderId, ownerId);
	},

	async duplicateFolder(folderId, ownerId) {
		const source = await ensureFolder(folderId, ownerId);
		const requests = await collectionRepository.listRequestsByFolder(folderId, ownerId);
		const order = await collectionRepository.countFolders(source.collectionId, ownerId);
		const duplicate = await collectionRepository.createFolder({
			ownerId,
			collectionId: source.collectionId,
			name: `${source.name} copy`,
			order,
		});

		for (const request of requests) {
			await collectionRepository.createRequest({
				ownerId,
				collectionId: source.collectionId,
				folderId: duplicate._id,
				name: `${request.name} copy`,
				method: request.method,
				url: request.url,
				params: request.params || [],
				headers: request.headers || [],
				body: defaultBody(request.body),
				auth: defaultRequestAuth(request.auth),
				order: request.order || 0,
			});
		}

		return formatFolder(duplicate.toObject());
	},

	async reorderFolders(collectionId, orderedIds, ownerId) {
		await ensureCollection(collectionId, ownerId);
		const folders = await Promise.all(orderedIds.map((id) => ensureFolder(id, ownerId)));
		if (folders.some((folder) => String(folder.collectionId) !== String(collectionId))) {
			throw new AppError(422, "FOLDER_COLLECTION_MISMATCH", "One or more folders do not belong to this collection.");
		}
		await collectionRepository.reorderFolders(ownerId, collectionId, orderedIds);
	},

	async createRequest(collectionId, input, ownerId) {
		await ensureCollection(collectionId, ownerId);
		await validateFolderPlacement(collectionId, input.folderId || null, ownerId);
		const order = await collectionRepository.countRequests(collectionId, input.folderId || null, ownerId);
		const request = await collectionRepository.createRequest({
			ownerId,
			collectionId,
			folderId: input.folderId || null,
			name: input.name,
			method: input.method || "GET",
			url: input.url || "",
			params: input.params || [],
			headers: input.headers || [],
			body: defaultBody(input.body),
			auth: defaultRequestAuth(input.auth),
			order,
		});
		return formatRequest(request.toObject());
	},

	async updateRequest(requestId, input, ownerId) {
		const existing = await ensureRequest(requestId, ownerId);
		const nextFolderId = Object.prototype.hasOwnProperty.call(input, "folderId")
			? input.folderId
			: existing.folderId
				? String(existing.folderId)
				: null;
		await validateFolderPlacement(existing.collectionId, nextFolderId, ownerId);
		const update = { ...input };
		if (Object.prototype.hasOwnProperty.call(update, "folderId")) {
			update.folderId = update.folderId || null;
		}
		if (update.body) {
			update.body = defaultBody(update.body);
		}
		if (update.auth) {
			update.auth = defaultRequestAuth(update.auth);
		}
		const request = await collectionRepository.updateRequest(requestId, ownerId, update);
		return formatRequest(request);
	},

	async deleteRequest(requestId, ownerId) {
		await ensureRequest(requestId, ownerId);
		await collectionRepository.deleteRequest(requestId, ownerId);
	},

	async duplicateRequest(requestId, ownerId) {
		const source = await ensureRequest(requestId, ownerId);
		const order = await collectionRepository.countRequests(source.collectionId, source.folderId || null, ownerId);
		const request = await collectionRepository.createRequest({
			ownerId,
			collectionId: source.collectionId,
			folderId: source.folderId || null,
			name: `${source.name} copy`,
			method: source.method,
			url: source.url,
			params: source.params || [],
			headers: source.headers || [],
			body: defaultBody(source.body),
			auth: defaultRequestAuth(source.auth),
			order,
		});
		return formatRequest(request.toObject());
	},

	async reorderRequests(collectionId, folderId, orderedIds, ownerId) {
		await ensureCollection(collectionId, ownerId);
		await validateFolderPlacement(collectionId, folderId || null, ownerId);
		const requests = await Promise.all(orderedIds.map((id) => ensureRequest(id, ownerId)));
		if (
			requests.some(
				(request) =>
					String(request.collectionId) !== String(collectionId) || String(request.folderId || "") !== String(folderId || ""),
			)
		) {
			throw new AppError(422, "REQUEST_COLLECTION_MISMATCH", "One or more requests do not belong to the selected container.");
		}
		await collectionRepository.reorderRequests(ownerId, collectionId, folderId || null, orderedIds);
	},

	async saveHistorySnapshot(input, ownerId) {
		return this.createRequest(
			input.collectionId,
			{
				folderId: input.folderId || null,
				name: input.name,
				method: input.method,
				url: input.url,
				params: input.params || [],
				headers: input.headers || [],
				body: input.body || { mode: "none", raw: "", formItems: [] },
				auth: input.auth || { type: "inherit" },
			},
			ownerId,
		);
	},
};
