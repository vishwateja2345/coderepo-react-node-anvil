import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { WorkspaceAccount } from "../features/auth/workspace-account.model.js";
import { Collection, Folder, SavedRequest } from "../features/collections/collection.model.js";
import { Environment } from "../features/environments/environment.model.js";
import { RequestHistory } from "../features/history/history.model.js";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { initConfig } from "../shared/config/index.js";

dotenv.config({ quiet: true });

const config = initConfig();
await connectDatabase(config.mongodbUri);

async function clearLegacyCollections() {
	const legacyCollections = ["requestcollections", "codesnippets", "sandboxpresets"];

	const existing = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
	const existingNames = new Set(existing.map((collection) => collection.name));
	await Promise.all(
		legacyCollections.filter((name) => existingNames.has(name)).map((name) => mongoose.connection.db.collection(name).deleteMany({})),
	);
}

try {
	await Promise.all([
		WorkspaceAccount.deleteMany({}),
		Environment.deleteMany({}),
		Collection.deleteMany({}),
		Folder.deleteMany({}),
		SavedRequest.deleteMany({}),
		RequestHistory.deleteMany({}),
	]);
	await clearLegacyCollections();

	const passwordHash = await bcrypt.hash("password123", 12);
	const primaryAccount = await WorkspaceAccount.create({
		name: "Jordan Rivera",
		email: "jordan@anvil.dev",
		passwordHash,
		active: true,
	});

	await WorkspaceAccount.create({
		name: "Sam Okafor",
		email: "sam@anvil.dev",
		passwordHash,
		active: true,
	});

	const activeEnvironment = await Environment.create({
		ownerId: primaryAccount._id,
		name: "Local Sandbox",
		description: "Active variables for local sandbox demos.",
		color: "#f59e0b",
		isDefault: true,
		isActive: true,
		variables: [
			{ key: "baseUrl", value: "http://127.0.0.1:8000/api/v1", enabled: true, isSecret: false },
			{ key: "echoUrl", value: "http://127.0.0.1:8000/api/v1/sandbox/echo", enabled: true, isSecret: false },
			{ key: "authToken", value: "seeded-bearer-token", enabled: true, isSecret: true },
		],
	});

	await Environment.create({
		ownerId: primaryAccount._id,
		name: "Preview",
		description: "Inactive preview environment.",
		color: "#3b82f6",
		isDefault: false,
		isActive: false,
		variables: [
			{ key: "baseUrl", value: "http://127.0.0.1:8000/api/v1", enabled: true, isSecret: false },
			{ key: "authToken", value: "preview-token", enabled: true, isSecret: true },
		],
	});

	const collection = await Collection.create({
		ownerId: primaryAccount._id,
		name: "Sandbox demos",
		description: "Seeded requests for sandbox verification and auth flows.",
		auth: { type: "none" },
		order: 0,
	});

	const authFolder = await Folder.create({
		ownerId: primaryAccount._id,
		collectionId: collection._id,
		name: "Authenticated",
		order: 0,
	});

	await SavedRequest.insertMany([
		{
			ownerId: primaryAccount._id,
			collectionId: collection._id,
			folderId: authFolder._id,
			name: "Bearer echo",
			method: "POST",
			url: "{{echoUrl}}",
			params: [{ key: "source", value: "seed", enabled: true }],
			headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
			body: { mode: "json", raw: '{"message":"Hello from Anvil","role":"seeded"}', formItems: [] },
			auth: {
				type: "bearer",
				bearerToken: "{{authToken}}",
				basicUsername: "",
				basicPassword: "",
				apiKeyKey: "",
				apiKeyValue: "",
				apiKeyLocation: "header",
			},
			order: 0,
		},
		{
			ownerId: primaryAccount._id,
			collectionId: collection._id,
			folderId: null,
			name: "Status 404",
			method: "GET",
			url: "{{baseUrl}}/sandbox/status/404",
			params: [],
			headers: [],
			body: { mode: "none", raw: "", formItems: [] },
			auth: {
				type: "inherit",
				bearerToken: "",
				basicUsername: "",
				basicPassword: "",
				apiKeyKey: "",
				apiKeyValue: "",
				apiKeyLocation: "header",
			},
			order: 0,
		},
		{
			ownerId: primaryAccount._id,
			collectionId: collection._id,
			folderId: null,
			name: "Delay 2 seconds",
			method: "GET",
			url: "{{baseUrl}}/sandbox/delay/2",
			params: [],
			headers: [],
			body: { mode: "none", raw: "", formItems: [] },
			auth: {
				type: "inherit",
				bearerToken: "",
				basicUsername: "",
				basicPassword: "",
				apiKeyKey: "",
				apiKeyValue: "",
				apiKeyLocation: "header",
			},
			order: 1,
		},
	]);

	console.log("Seed complete");
	console.log("Accounts: jordan@anvil.dev / password123, sam@anvil.dev / password123");
	console.log(`Active environment: ${activeEnvironment.name}`);
} finally {
	await disconnectDatabase();
}
