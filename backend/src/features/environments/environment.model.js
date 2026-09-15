import mongoose from "mongoose";

const environmentVariableSchema = new mongoose.Schema(
	{
		key: { type: String, required: true, trim: true, maxlength: 120 },
		value: { type: String, default: "", maxlength: 5000 },
		isSecret: { type: Boolean, default: false },
		enabled: { type: Boolean, default: true },
	},
	{ _id: false, versionKey: false },
);

const environmentSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkspaceAccount", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		description: { type: String, default: "", maxlength: 500 },
		color: { type: String, default: "#f59e0b", match: /^#[0-9A-Fa-f]{6}$/ },
		isDefault: { type: Boolean, default: false },
		isActive: { type: Boolean, default: false },
		variables: { type: [environmentVariableSchema], default: [] },
	},
	{ timestamps: true, versionKey: false },
);

export const Environment = mongoose.model("Environment", environmentSchema);
