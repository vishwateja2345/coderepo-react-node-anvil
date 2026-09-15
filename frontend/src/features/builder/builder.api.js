import { apiRequest } from "../../shared/api/client.js";

export const builderApi = {
	async execute(payload) {
		const response = await apiRequest("/execute", {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
	async snippet(payload) {
		const response = await apiRequest("/snippets", {
			body: payload,
			method: "POST",
		});
		return response.data;
	},
};
