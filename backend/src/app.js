import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./features/auth/auth.routes.js";
import { collectionRouter, folderRouter, savedRequestRouter } from "./features/collections/collection.routes.js";
import { environmentRouter } from "./features/environments/environment.routes.js";
import { executionRouter } from "./features/execution/execution.routes.js";
import { historyRouter } from "./features/history/history.routes.js";
import { sandboxRouter } from "./features/sandbox/sandbox.routes.js";
import { snippetRouter } from "./features/snippets/snippet.routes.js";
import { requireWorkspaceAuth } from "./shared/middleware/auth.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.js";
import { securityHeaders } from "./shared/middleware/security-headers.js";

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

export function createApp() {
	const app = express();
	app.disable("x-powered-by");
	app.use(securityHeaders);
	app.use(cors());
	app.use(express.json({ limit: "250kb" }));
	app.use(express.urlencoded({ extended: true, limit: "250kb" }));
	app.use(express.text({ type: ["text/*", "application/xml", "application/graphql"], limit: "250kb" }));
	app.use(express.static(publicDirectory));

	app.get("/api/v1/health", (request, response) => {
		const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
		response.status(database === "connected" ? 200 : 503).json({
			data: {
				status: database === "connected" ? "ok" : "degraded",
				database,
				timestamp: new Date().toISOString(),
			},
		});
	});

	app.use("/api/v1/auth", authRouter);
	app.use("/api/v1/sandbox", sandboxRouter);
	app.use("/api/v1", requireWorkspaceAuth);
	app.use("/api/v1/environments", environmentRouter);
	app.use("/api/v1/collections", collectionRouter);
	app.use("/api/v1/folders", folderRouter);
	app.use("/api/v1/requests", savedRequestRouter);
	app.use("/api/v1/history", historyRouter);
	app.use("/api/v1/execute", executionRouter);
	app.use("/api/v1/snippets", snippetRouter);
	app.use(notFoundHandler);
	app.use(errorHandler);
	return app;
}
