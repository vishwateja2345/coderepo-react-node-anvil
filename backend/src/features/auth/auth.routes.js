import { Router } from "express";
import { login, logout, session } from "./auth.controller.js";
import { requireWorkspaceAuth } from "../../shared/middleware/auth.js";
import { rateLimit } from "../../shared/middleware/rate-limit.js";

const loginRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: "Too many sign-in attempts. Please wait a few minutes and try again.",
});

export const authRouter = Router();
authRouter.post("/login", loginRateLimit, login);
authRouter.get("/session", requireWorkspaceAuth, session);
authRouter.post("/logout", requireWorkspaceAuth, logout);
