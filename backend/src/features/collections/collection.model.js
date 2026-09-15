import mongoose from "mongoose";
import { HTTP_METHODS } from "../../shared/utils/http.js";
import { createAuthMongooseSchema, keyValueMongooseSchema, requestBodyMongooseSchema } from "../../shared/utils/request-contract.js";

const collectionSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkspaceAccount", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		description: { type: String, default: "", maxlength: 1000 },
		auth: { type: createAuthMongooseSchema({ allowInherit: false, defaultType: "none" }), default: () => ({ type: "none" }) },
		order: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: true, versionKey: false },
);

const folderSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkspaceAccount", required: true, index: true },
		collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		order: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: true, versionKey: false },
);

const savedRequestSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkspaceAccount", required: true, index: true },
		collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true, index: true },
		folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		method: { type: String, enum: HTTP_METHODS, default: "GET" },
		url: { type: String, default: "", maxlength: 4000 },
		params: { type: [keyValueMongooseSchema], default: [] },
		headers: { type: [keyValueMongooseSchema], default: [] },
		body: { type: requestBodyMongooseSchema, default: () => ({ mode: "none", raw: "", formItems: [] }) },
		auth: { type: createAuthMongooseSchema({ allowInherit: true, defaultType: "inherit" }), default: () => ({ type: "inherit" }) },
		order: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: true, versionKey: false },
);

export const Collection = mongoose.model("Collection", collectionSchema);
export const Folder = mongoose.model("Folder", folderSchema);
export const SavedRequest = mongoose.model("SavedRequest", savedRequestSchema);
