import { AppError } from "../../shared/errors/app-error.js";
import { assertObjectId } from "../../shared/utils/object-id.js";
import { environmentRepository } from "./environment.repository.js";

export function environmentToVariables(environment) {
	return (environment?.variables || []).reduce((accumulator, variable) => {
		if (variable.enabled !== false && variable.key) {
			accumulator[String(variable.key)] = String(variable.value ?? "");
		}
		return accumulator;
	}, {});
}

export const environmentService = {
	list(ownerId) {
		return environmentRepository.listByOwner(ownerId);
	},
	async getById(id, ownerId) {
		assertObjectId(id, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		const environment = await environmentRepository.findById(id, ownerId);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		return environment;
	},
	findActiveForOwner(ownerId) {
		return environmentRepository.findActive(ownerId);
	},
	async create(input, ownerId) {
		const count = await environmentRepository.countByOwner(ownerId);
		if (input.isDefault) {
			await environmentRepository.clearDefault(ownerId);
		}
		if (input.isActive || count === 0) {
			await environmentRepository.clearActive(ownerId);
		}
		const environment = await environmentRepository.create({
			...input,
			ownerId,
			isActive: input.isActive || count === 0,
		});
		return environment.toObject();
	},
	async update(id, input, ownerId) {
		assertObjectId(id, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		if (input.isDefault) {
			await environmentRepository.clearDefault(ownerId, id);
		}
		if (input.isActive) {
			await environmentRepository.clearActive(ownerId, id);
		}
		const environment = await environmentRepository.update(id, ownerId, input);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		return environment;
	},
	async activate(id, ownerId) {
		assertObjectId(id, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		await environmentRepository.clearActive(ownerId, id);
		const environment = await environmentRepository.update(id, ownerId, { isActive: true });
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		return environment;
	},
	async remove(id, ownerId) {
		assertObjectId(id, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
		const environment = await environmentRepository.remove(id, ownerId);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "The requested environment does not exist.");
	},
	async resolveVariables(environmentId, ownerId) {
		if (!environmentId) return {};
		const environment = await this.getById(environmentId, ownerId);
		return environmentToVariables(environment);
	},
};
