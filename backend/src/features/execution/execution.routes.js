import { Router } from "express";
import { executeRequest } from "./execution.controller.js";

export const executionRouter = Router();
executionRouter.post("/", executeRequest);
