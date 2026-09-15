import mongoose from "mongoose";
import { HTTP_METHODS } from "../../shared/utils/http.js";
import { createAuthMongooseSchema, keyValueMongooseSchema, requestBodyMongooseSchema } from "../../shared/utils/request-contract.js";

const responseSchema = new mongoose.Schema(
	{
		status: { type: Number, default: null },
		statusText: { type: String, default: "", maxlength: 200 },
		headers: { type: [keyValueMongooseSchema], default: [] },
		body: { type: String, default: "", maxlength: 200000 },
		sizeBytes: { type: Number, default: 0 },
		bodyTruncated: { type: Boolean, default: false },
	},
	{ _id: false, versionKey: false },
);

const requestHistorySchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkspaceAccount", required: true, index: true },
		environmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Environment", default: null },
		environmentName: { type: String, default: "", maxlength: 120 },
		name: { type: String, default: "Untitled request", maxlength: 120 },
		method: { type: String, enum: HTTP_METHODS, required: true },
		url: { type: String, required: true, maxlength: 4000 },
		resolvedUrl: { type: String, required: true, maxlength: 4000 },
		params: { type: [keyValueMongooseSchema], default: [] },
		headers: { type: [keyValueMongooseSchema], default: [] },
		body: { type: requestBodyMongooseSchema, default: () => ({ mode: "none", raw: "", formItems: [] }) },
		auth: { type: createAuthMongooseSchema({ allowInherit: true, defaultType: "inherit" }), default: () => ({ type: "inherit" }) },
		ok: { type: Boolean, default: true },
		response: { type: responseSchema, default: null },
		error: {
			message: { type: String, default: "" },
		},
		timeMs: { type: Number, required: true },
	},
	{ timestamps: true, versionKey: false },
);

export const RequestHistory = mongoose.model("RequestHistory", requestHistorySchema);
