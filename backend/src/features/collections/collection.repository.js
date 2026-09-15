import { Collection, Folder, SavedRequest } from "./collection.model.js";

export const collectionRepository = {
	listCollections(ownerId) {
		return Collection.find({ ownerId }).sort({ order: 1, createdAt: 1 }).lean();
	},
	listFolders(ownerId) {
		return Folder.find({ ownerId }).sort({ order: 1, createdAt: 1 }).lean();
	},
	listRequests(ownerId) {
		return SavedRequest.find({ ownerId }).sort({ order: 1, createdAt: 1 }).lean();
	},
	findCollectionById(id, ownerId) {
		return Collection.findOne({ _id: id, ownerId }).lean();
	},
	findFolderById(id, ownerId) {
		return Folder.findOne({ _id: id, ownerId }).lean();
	},
	findRequestById(id, ownerId) {
		return SavedRequest.findOne({ _id: id, ownerId }).lean();
	},
	countCollections(ownerId) {
		return Collection.countDocuments({ ownerId });
	},
	countFolders(collectionId, ownerId) {
		return Folder.countDocuments({ collectionId, ownerId });
	},
	countRequests(collectionId, folderId, ownerId) {
		return SavedRequest.countDocuments({ collectionId, folderId: folderId || null, ownerId });
	},
	createCollection(input) {
		return Collection.create(input);
	},
	updateCollection(id, ownerId, update) {
		return Collection.findOneAndUpdate({ _id: id, ownerId }, update, { new: true, lean: true, runValidators: true });
	},
	deleteCollection(id, ownerId) {
		return Collection.findOneAndDelete({ _id: id, ownerId }).lean();
	},
	deleteFoldersByCollection(collectionId, ownerId) {
		return Folder.deleteMany({ collectionId, ownerId });
	},
	deleteRequestsByCollection(collectionId, ownerId) {
		return SavedRequest.deleteMany({ collectionId, ownerId });
	},
	createFolder(input) {
		return Folder.create(input);
	},
	updateFolder(id, ownerId, update) {
		return Folder.findOneAndUpdate({ _id: id, ownerId }, update, { new: true, lean: true, runValidators: true });
	},
	deleteFolder(id, ownerId) {
		return Folder.findOneAndDelete({ _id: id, ownerId }).lean();
	},
	deleteRequestsByFolder(id, ownerId) {
		return SavedRequest.deleteMany({ folderId: id, ownerId });
	},
	listRequestsByCollection(collectionId, ownerId) {
		return SavedRequest.find({ collectionId, ownerId }).sort({ order: 1, createdAt: 1 }).lean();
	},
	listRequestsByFolder(folderId, ownerId) {
		return SavedRequest.find({ folderId, ownerId }).sort({ order: 1, createdAt: 1 }).lean();
	},
	createRequest(input) {
		return SavedRequest.create(input);
	},
	updateRequest(id, ownerId, update) {
		return SavedRequest.findOneAndUpdate({ _id: id, ownerId }, update, { new: true, lean: true, runValidators: true });
	},
	deleteRequest(id, ownerId) {
		return SavedRequest.findOneAndDelete({ _id: id, ownerId }).lean();
	},
	insertFolders(inputs) {
		return Folder.insertMany(inputs);
	},
	insertRequests(inputs) {
		return SavedRequest.insertMany(inputs);
	},
	async reorderCollections(ownerId, orderedIds) {
		await Promise.all(orderedIds.map((id, index) => Collection.updateOne({ _id: id, ownerId }, { $set: { order: index } })));
	},
	async reorderFolders(ownerId, collectionId, orderedIds) {
		await Promise.all(orderedIds.map((id, index) => Folder.updateOne({ _id: id, ownerId, collectionId }, { $set: { order: index } })));
	},
	async reorderRequests(ownerId, collectionId, folderId, orderedIds) {
		await Promise.all(
			orderedIds.map((id, index) =>
				SavedRequest.updateOne({ _id: id, ownerId, collectionId, folderId: folderId || null }, { $set: { order: index } }),
			),
		);
	},
};
