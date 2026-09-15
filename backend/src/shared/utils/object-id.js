import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isObjectId(value) {
	return mongoose.isValidObjectId(value);
}

export function assertObjectId(value, code, message, statusCode = 404) {
	if (!isObjectId(value)) {
		throw new AppError(statusCode, code, message);
	}
}
