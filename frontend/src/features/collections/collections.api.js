import { apiRequest } from "../../shared/api/client.js";

export const collectionsApi = {
	async list() {
		const response = await apiRequest("/collections");
		return response.data;
	},
	async createCollection(payload) {
		const response = await apiRequest("/collections", {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
	async updateCollection(id, payload) {
		const response = await apiRequest(`/collections/${id}`, {
			body: payload,
			method: "PATCH",
		});
		return response.data;
	},
	async deleteCollection(id) {
		await apiRequest(`/collections/${id}`, { method: "DELETE" });
	},
	async duplicateCollection(id) {
		const response = await apiRequest(`/collections/${id}/duplicate`, { method: "POST" });
		return response.data;
	},
	async reorderCollections(orderedIds) {
		await apiRequest("/collections/reorder", {
			body: { orderedIds },
			method: "PATCH",
		});
	},
	async createFolder(collectionId, payload) {
		const response = await apiRequest(`/collections/${collectionId}/folders`, {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
	async updateFolder(id, payload) {
		const response = await apiRequest(`/folders/${id}`, {
			body: payload,
			method: "PATCH",
		});
		return response.data;
	},
	async deleteFolder(id) {
		await apiRequest(`/folders/${id}`, { method: "DELETE" });
	},
	async duplicateFolder(id) {
		const response = await apiRequest(`/folders/${id}/duplicate`, { method: "POST" });
		return response.data;
	},
	async reorderFolders(collectionId, orderedIds) {
		await apiRequest(`/collections/${collectionId}/folders/reorder`, {
			body: { orderedIds },
			method: "PATCH",
		});
	},
	async createRequest(collectionId, payload) {
		const response = await apiRequest(`/collections/${collectionId}/requests`, {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
	async updateRequest(id, payload) {
		const response = await apiRequest(`/requests/${id}`, {
			body: payload,
			method: "PATCH",
		});
		return response.data;
	},
	async deleteRequest(id) {
		await apiRequest(`/requests/${id}`, { method: "DELETE" });
	},
	async duplicateRequest(id) {
		const response = await apiRequest(`/requests/${id}/duplicate`, { method: "POST" });
		return response.data;
	},
	async reorderRequests(collectionId, folderId, orderedIds) {
		await apiRequest(`/collections/${collectionId}/requests/reorder`, {
			body: { folderId: folderId ?? null, orderedIds },
			method: "PATCH",
		});
	},
};
