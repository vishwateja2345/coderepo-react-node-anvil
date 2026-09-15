import { Router } from "express";
import {
	activateEnvironment,
	createEnvironment,
	deleteEnvironment,
	getEnvironment,
	listEnvironments,
	updateEnvironment,
} from "./environment.controller.js";

export const environmentRouter = Router();
environmentRouter.get("/", listEnvironments);
environmentRouter.get("/:environmentId", getEnvironment);
environmentRouter.post("/", createEnvironment);
environmentRouter.patch("/:environmentId/activate", activateEnvironment);
environmentRouter.patch("/:environmentId", updateEnvironment);
environmentRouter.delete("/:environmentId", deleteEnvironment);
