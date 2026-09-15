import { apiRequest } from "../../shared/api/client.js";

export const environmentApi = {
	async list() {
		const response = await apiRequest("/environments");
		return response.data;
	},
	async create(payload) {
		const response = await apiRequest("/environments", {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
	async update(id, payload) {
		const response = await apiRequest(`/environments/${id}`, {
			body: payload,
			method: "PATCH",
		});
		return response.data;
	},
	async activate(id) {
		const response = await apiRequest(`/environments/${id}/activate`, {
			method: "PATCH",
		});
		return response.data;
	},
	async remove(id) {
		await apiRequest(`/environments/${id}`, {
			method: "DELETE",
		});
	},
};
