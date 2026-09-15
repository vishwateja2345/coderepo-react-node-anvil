import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getConfig } from "../../shared/config/index.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authRepository } from "./auth.repository.js";

function publicAccount(account) {
	return {
		_id: String(account._id),
		name: account.name,
		email: account.email,
	};
}

function signToken(account) {
	return jwt.sign({ sub: String(account._id), type: "workspace" }, getConfig().jwtSecret, {
		expiresIn: getConfig().jwtExpiresIn,
		issuer: "anvil-api",
		audience: "anvil-app",
	});
}

export const authService = {
	async login(email, password) {
		const account = await authRepository.findActiveByEmailWithPassword(email.toLowerCase());
		const valid = account ? bcrypt.compareSync(password, account.passwordHash) : false;

		if (!valid) {
			throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
		}

		return {
			user: publicAccount(account),
			token: signToken(account),
		};
	},
	async authenticate(token) {
		let payload;
		try {
			payload = jwt.verify(token, getConfig().jwtSecret, { issuer: "anvil-api", audience: "anvil-app" });
		} catch {
			throw new AppError(401, "INVALID_TOKEN", "Your Anvil session is invalid or has expired.");
		}

		if (!mongoose.isValidObjectId(payload.sub) || payload.type !== "workspace") {
			throw new AppError(401, "INVALID_TOKEN", "Your Anvil session is invalid or has expired.");
		}

		const account = await authRepository.findActiveById(payload.sub);
		if (!account) {
			throw new AppError(401, "ACCOUNT_UNAVAILABLE", "This Anvil workspace is no longer available.");
		}

		return { account, payload };
	},
	session(account) {
		return { user: publicAccount(account) };
	},
};
