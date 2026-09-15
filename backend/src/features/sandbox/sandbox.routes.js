import { Router } from "express";
import { echoSandboxRequest, respondWithDelay, respondWithStatus } from "./sandbox.controller.js";

export const sandboxRouter = Router();
sandboxRouter.all("/echo", echoSandboxRequest);
sandboxRouter.get("/status/:code", respondWithStatus);
sandboxRouter.get("/delay/:seconds", respondWithDelay);
