import { resolveRequestDefinition, generateSnippet } from "../../shared/utils/request-runtime.js";
import { environmentService, environmentToVariables } from "../environments/environment.service.js";

export const snippetService = {
	async generate(input, account) {
		const environment = input.environmentId
			? await environmentService.getById(input.environmentId, account._id)
			: await environmentService.findActiveForOwner(account._id);
		const variables = environmentToVariables(environment);
		const resolved = resolveRequestDefinition(input, variables);
		return { snippet: generateSnippet(input.language, resolved), missingVariables: resolved.missingVariables };
	},
};
