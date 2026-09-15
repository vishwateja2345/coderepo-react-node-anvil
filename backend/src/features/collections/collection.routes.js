import { Router } from "express";
import {
	createCollection,
	createFolder,
	createRequest,
	deleteCollection,
	deleteFolder,
	deleteRequest,
	duplicateCollection,
	duplicateFolder,
	duplicateRequest,
	listCollections,
	reorderCollections,
	reorderFolders,
	reorderRequests,
	updateCollection,
	updateFolder,
	updateRequest,
} from "./collection.controller.js";

export const collectionRouter = Router();
export const folderRouter = Router();
export const savedRequestRouter = Router();

collectionRouter.get("/", listCollections);
collectionRouter.post("/", createCollection);
collectionRouter.patch("/reorder", reorderCollections);
collectionRouter.post("/:id/duplicate", duplicateCollection);
collectionRouter.patch("/:id", updateCollection);
collectionRouter.delete("/:id", deleteCollection);
collectionRouter.post("/:collectionId/folders", createFolder);
collectionRouter.patch("/:collectionId/folders/reorder", reorderFolders);
collectionRouter.post("/:collectionId/requests", createRequest);
collectionRouter.patch("/:collectionId/requests/reorder", reorderRequests);

folderRouter.patch("/:id", updateFolder);
folderRouter.delete("/:id", deleteFolder);
folderRouter.post("/:id/duplicate", duplicateFolder);

savedRequestRouter.patch("/:id", updateRequest);
savedRequestRouter.delete("/:id", deleteRequest);
savedRequestRouter.post("/:id/duplicate", duplicateRequest);
