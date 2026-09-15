import { Router } from "express";
import { createSnippet } from "./snippet.controller.js";

export const snippetRouter = Router();
snippetRouter.post("/", createSnippet);
