import { WorkspaceAccount } from "./workspace-account.model.js";

export const authRepository = {
	findActiveByEmailWithPassword(email) {
		return WorkspaceAccount.findOne({ email, active: true }).select("+passwordHash");
	},
	findActiveById(id) {
		return WorkspaceAccount.findOne({ _id: id, active: true }).lean();
	},
};
