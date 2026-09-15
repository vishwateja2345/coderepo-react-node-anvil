import { apiRequest } from "../../shared/api/client.js";

function buildQuery(params) {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.set(key, String(value));
		}
	});
	const query = searchParams.toString();
	return query ? `?${query}` : "";
}

export const historyApi = {
	async list(params = {}) {
		const response = await apiRequest(`/history${buildQuery(params)}`);
		return response.data;
	},
	async remove(id) {
		await apiRequest(`/history/${id}`, { method: "DELETE" });
	},
	async clear() {
		await apiRequest("/history", { method: "DELETE" });
	},
	async save(id, payload) {
		const response = await apiRequest(`/history/${id}/save`, {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
};
