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

function minutesAgo(minutes) {
	return new Date(Date.now() - minutes * 60000);
}

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

	const secondaryAccount = await WorkspaceAccount.create({
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

	const secondaryEnvironment = await Environment.create({
		ownerId: secondaryAccount._id,
		name: "Personal",
		description: "A second account's own environment, isolated from Jordan's.",
		color: "#45d483",
		isDefault: true,
		isActive: true,
		variables: [{ key: "baseUrl", value: "http://127.0.0.1:8000/api/v1", enabled: true, isSecret: false }],
	});

	const secondaryCollection = await Collection.create({
		ownerId: secondaryAccount._id,
		name: "Sam's Requests",
		description: "A second account's own collection, isolated from Jordan's.",
		auth: { type: "none" },
		order: 0,
	});

	await SavedRequest.create({
		ownerId: secondaryAccount._id,
		collectionId: secondaryCollection._id,
		folderId: null,
		name: "Echo check",
		method: "GET",
		url: "{{baseUrl}}/sandbox/echo",
		params: [],
		headers: [],
		body: { mode: "none", raw: "", formItems: [] },
		auth: {
			type: "none",
			bearerToken: "",
			basicUsername: "",
			basicPassword: "",
			apiKeyKey: "",
			apiKeyValue: "",
			apiKeyLocation: "header",
		},
		order: 0,
	});

	await RequestHistory.insertMany([
		{
			ownerId: primaryAccount._id,
			environmentId: activeEnvironment._id,
			environmentName: activeEnvironment.name,
			name: "Bearer echo",
			method: "POST",
			url: "{{echoUrl}}",
			resolvedUrl: "http://127.0.0.1:8000/api/v1/sandbox/echo?source=seed",
			params: [{ key: "source", value: "seed", enabled: true }],
			headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
			body: { mode: "json", raw: '{"message":"Hello from Anvil","role":"seeded"}', formItems: [] },
			auth: {
				type: "bearer",
				bearerToken: "seeded-bearer-token",
				basicUsername: "",
				basicPassword: "",
				apiKeyKey: "",
				apiKeyValue: "",
				apiKeyLocation: "header",
			},
			ok: true,
			response: {
				status: 200,
				statusText: "OK",
				headers: [{ key: "content-type", value: "application/json; charset=utf-8", enabled: true }],
				body: '{"data":{"method":"POST","path":"/echo","query":{"source":"seed"},"headers":{"authorization":"Bearer seeded-bearer-token"},"body":{"message":"Hello from Anvil","role":"seeded"}}}',
				sizeBytes: 178,
				bodyTruncated: false,
			},
			error: { message: "" },
			timeMs: 42,
			createdAt: minutesAgo(65),
			updatedAt: minutesAgo(65),
		},
		{
			ownerId: primaryAccount._id,
			environmentId: activeEnvironment._id,
			environmentName: activeEnvironment.name,
			name: "Status 404",
			method: "GET",
			url: "{{baseUrl}}/sandbox/status/404",
			resolvedUrl: "http://127.0.0.1:8000/api/v1/sandbox/status/404",
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
			ok: true,
			response: {
				status: 404,
				statusText: "Not Found",
				headers: [{ key: "content-type", value: "application/json; charset=utf-8", enabled: true }],
				body: '{"data":{"code":404}}',
				sizeBytes: 21,
				bodyTruncated: false,
			},
			error: { message: "" },
			timeMs: 18,
			createdAt: minutesAgo(48),
			updatedAt: minutesAgo(48),
		},
		{
			ownerId: primaryAccount._id,
			environmentId: activeEnvironment._id,
			environmentName: activeEnvironment.name,
			name: "Delay 2 seconds",
			method: "GET",
			url: "{{baseUrl}}/sandbox/delay/2",
			resolvedUrl: "http://127.0.0.1:8000/api/v1/sandbox/delay/2",
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
			ok: true,
			response: {
				status: 200,
				statusText: "OK",
				headers: [{ key: "content-type", value: "application/json; charset=utf-8", enabled: true }],
				body: '{"data":{"delayedSeconds":2}}',
				sizeBytes: 29,
				bodyTruncated: false,
			},
			error: { message: "" },
			timeMs: 2008,
			createdAt: minutesAgo(30),
			updatedAt: minutesAgo(30),
		},
		{
			ownerId: primaryAccount._id,
			environmentId: null,
			environmentName: "",
			name: "Unreachable host",
			method: "GET",
			url: "https://staging.invalid.example/api/v1/ping",
			resolvedUrl: "https://staging.invalid.example/api/v1/ping",
			params: [],
			headers: [],
			body: { mode: "none", raw: "", formItems: [] },
			auth: {
				type: "none",
				bearerToken: "",
				basicUsername: "",
				basicPassword: "",
				apiKeyKey: "",
				apiKeyValue: "",
				apiKeyLocation: "header",
			},
			ok: false,
			response: null,
			error: { message: "Unable to connect. Is the computer able to access the url?" },
			timeMs: 3012,
			createdAt: minutesAgo(12),
			updatedAt: minutesAgo(12),
		},
	]);

	console.log("Seed complete");
	console.log("Accounts: jordan@anvil.dev / password123, sam@anvil.dev / password123");
	console.log(`Active environment: ${activeEnvironment.name}`);
	console.log(`Secondary account environment: ${secondaryEnvironment.name}`);
} finally {
	await disconnectDatabase();
}
