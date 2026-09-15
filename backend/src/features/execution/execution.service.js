import { AppError } from "../../shared/errors/app-error.js";
import { HTTP_METHODS } from "../../shared/utils/http.js";
import { resolveRequestDefinition } from "../../shared/utils/request-runtime.js";
import { environmentService, environmentToVariables } from "../environments/environment.service.js";
import { historyService } from "../history/history.service.js";
import { executionRepository } from "./execution.repository.js";

export const executionService = {
	async execute(input, account) {
		const method = String(input.method || "GET").toUpperCase();
		if (!HTTP_METHODS.includes(method)) {
			throw new AppError(400, "INVALID_METHOD", "The selected HTTP method is not supported.");
		}

		const environment = input.environmentId
			? await environmentService.getById(input.environmentId, account._id)
			: await environmentService.findActiveForOwner(account._id);
		const variables = environmentToVariables(environment);
		const resolved = resolveRequestDefinition({ ...input, method }, variables);

		try {
			const result = await executionRepository.executeRequest({
				url: resolved.resolvedUrl,
				method,
				headers: resolved.outboundHeaders,
				body: resolved.outboundBody,
				timeoutMs: input.timeoutMs,
			});

			const historyEntry =
				input.saveHistory === false
					? null
					: await historyService.record(account._id, {
							environmentId: environment?._id || null,
							environmentName: environment?.name || "",
							name: resolved.name,
							method,
							url: resolved.url,
							resolvedUrl: result.resolvedUrl || resolved.resolvedUrl,
							params: resolved.params,
							headers: resolved.headers,
							body: resolved.body,
							auth: input.auth || { type: "inherit" },
							ok: true,
							response: {
								status: result.status,
								statusText: result.statusText,
								headers: result.headers,
								body: result.body,
								sizeBytes: result.sizeBytes,
								bodyTruncated: result.bodyTruncated,
							},
							error: { message: "" },
							timeMs: result.timeMs,
						});

			return {
				ok: true,
				status: result.status,
				statusText: result.statusText,
				headers: result.headers,
				body: result.body,
				sizeBytes: result.sizeBytes,
				bodyTruncated: result.bodyTruncated,
				timeMs: result.timeMs,
				resolvedUrl: result.resolvedUrl || resolved.resolvedUrl,
				historyId: historyEntry ? String(historyEntry._id) : null,
			};
		} catch (error) {
			if (!(error instanceof AppError) || !["EXECUTION_TIMEOUT", "EXECUTION_FAILED"].includes(error.code)) {
				throw error;
			}

			const timeMs = error.details?.timeMs || 0;
			const historyEntry =
				input.saveHistory === false
					? null
					: await historyService.record(account._id, {
							environmentId: environment?._id || null,
							environmentName: environment?.name || "",
							name: resolved.name,
							method,
							url: resolved.url,
							resolvedUrl: resolved.resolvedUrl,
							params: resolved.params,
							headers: resolved.headers,
							body: resolved.body,
							auth: input.auth || { type: "inherit" },
							ok: false,
							response: null,
							error: { message: error.message },
							timeMs,
						});

			return {
				ok: false,
				timeMs,
				resolvedUrl: resolved.resolvedUrl,
				sizeBytes: 0,
				historyId: historyEntry ? String(historyEntry._id) : null,
				error: { message: error.message },
			};
		}
	},
};
