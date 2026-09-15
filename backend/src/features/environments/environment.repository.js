import { Environment } from "./environment.model.js";

export const environmentRepository = {
	listByOwner(ownerId) {
		return Environment.find({ ownerId }).sort({ isActive: -1, isDefault: -1, updatedAt: -1 }).lean();
	},
	findById(id, ownerId) {
		return Environment.findOne({ _id: id, ownerId }).lean();
	},
	findActive(ownerId) {
		return Environment.findOne({ ownerId, isActive: true }).lean();
	},
	findManyByIds(ids, ownerId) {
		return Environment.find({ _id: { $in: ids }, ownerId }).lean();
	},
	create(input) {
		return Environment.create(input);
	},
	update(id, ownerId, update) {
		return Environment.findOneAndUpdate({ _id: id, ownerId }, update, { new: true, lean: true, runValidators: true });
	},
	remove(id, ownerId) {
		return Environment.findOneAndDelete({ _id: id, ownerId }).lean();
	},
	async clearDefault(ownerId, excludeId = null) {
		await Environment.updateMany(excludeId ? { ownerId, _id: { $ne: excludeId } } : { ownerId }, { $set: { isDefault: false } });
	},
	async clearActive(ownerId, excludeId = null) {
		await Environment.updateMany(excludeId ? { ownerId, _id: { $ne: excludeId } } : { ownerId }, { $set: { isActive: false } });
	},
	countByOwner(ownerId) {
		return Environment.countDocuments({ ownerId });
	},
};
