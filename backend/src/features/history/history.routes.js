import { Router } from "express";
import { clearHistory, deleteHistoryEntry, getHistoryEntry, listHistory, saveHistoryEntry } from "./history.controller.js";

export const historyRouter = Router();
historyRouter.get("/", listHistory);
historyRouter.delete("/", clearHistory);
historyRouter.post("/:historyId/save", saveHistoryEntry);
historyRouter.get("/:historyId", getHistoryEntry);
historyRouter.delete("/:historyId", deleteHistoryEntry);
