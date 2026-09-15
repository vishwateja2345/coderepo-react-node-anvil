import { AppError } from "../../shared/errors/app-error.js";
import { assertObjectId } from "../../shared/utils/object-id.js";
import { collectionService } from "../collections/collection.service.js";
import { historyRepository } from "./history.repository.js";

export const historyService = {
	list(ownerId, filters) {
		return historyRepository.listByOwner(ownerId, filters);
	},
	async getById(id, ownerId) {
		assertObjectId(id, "HISTORY_NOT_FOUND", "The requested history entry does not exist.");
		const historyEntry = await historyRepository.findById(id, ownerId);
		if (!historyEntry) throw new AppError(404, "HISTORY_NOT_FOUND", "The requested history entry does not exist.");
		return historyEntry;
	},
	async remove(id, ownerId) {
		assertObjectId(id, "HISTORY_NOT_FOUND", "The requested history entry does not exist.");
		const historyEntry = await historyRepository.remove(id, ownerId);
		if (!historyEntry) throw new AppError(404, "HISTORY_NOT_FOUND", "The requested history entry does not exist.");
	},
	async clear(ownerId) {
		await historyRepository.clear(ownerId);
	},
	async record(ownerId, payload) {
		const historyEntry = await historyRepository.create({ ...payload, ownerId });
		return historyEntry.toObject();
	},
	async saveToCollection(id, ownerId, payload) {
		const historyEntry = await this.getById(id, ownerId);
		return collectionService.saveHistorySnapshot(
			{
				collectionId: payload.collectionId,
				folderId: payload.folderId || null,
				name: payload.name,
				method: historyEntry.method,
				url: historyEntry.url,
				params: historyEntry.params || [],
				headers: historyEntry.headers || [],
				body: historyEntry.body || { mode: "none", raw: "", formItems: [] },
				auth: historyEntry.auth || { type: "inherit" },
			},
			ownerId,
		);
	},
};
