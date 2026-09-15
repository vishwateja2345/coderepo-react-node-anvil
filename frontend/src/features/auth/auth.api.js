import { apiRequest } from "../../shared/api/client.js";

export const authApi = {
	async login(email, password) {
		const response = await apiRequest("/auth/login", {
			auth: false,
			body: { email, password },
			method: "POST",
		});
		return response.data;
	},
	async logout() {
		await apiRequest("/auth/logout", {
			method: "POST",
		});
	},
	async session() {
		const response = await apiRequest("/auth/session");
		return response.data;
	},
};
