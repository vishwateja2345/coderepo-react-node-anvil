import { RequestHistory } from "./history.model.js";

export const historyRepository = {
	listByOwner(ownerId, { limit, method, q } = {}) {
		const filter = {
			ownerId,
			...(method ? { method } : {}),
			...(q ? { url: { $regex: q, $options: "i" } } : {}),
		};
		return RequestHistory.find(filter)
			.sort({ createdAt: -1 })
			.limit(limit || 50)
			.lean();
	},
	findById(id, ownerId) {
		return RequestHistory.findOne({ _id: id, ownerId }).lean();
	},
	create(input) {
		return RequestHistory.create(input);
	},
	remove(id, ownerId) {
		return RequestHistory.findOneAndDelete({ _id: id, ownerId }).lean();
	},
	clear(ownerId) {
		return RequestHistory.deleteMany({ ownerId });
	},
};
