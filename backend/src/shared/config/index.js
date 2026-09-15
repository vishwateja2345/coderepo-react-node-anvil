function getRequiredEnv(key) {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}

function getOptionalEnv(key, defaultValue) {
	return process.env[key] || defaultValue;
}

let configInstance = null;

export function loadConfig() {
	configInstance = {
		mongodbUri: getRequiredEnv("MONGODB_URI"),
		jwtSecret: getRequiredEnv("JWT_SECRET"),
		jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "24h"),
		nodeEnv: getOptionalEnv("NODE_ENV", "development"),
		port: Number.parseInt(getOptionalEnv("PORT", "8000"), 10),
	};
	return configInstance;
}

export function initConfig() {
	return loadConfig();
}

export function getConfig() {
	if (!configInstance) {
		throw new Error("Configuration not loaded. Call initConfig() after dotenv.config().");
	}
	return configInstance;
}

export { getOptionalEnv, getRequiredEnv };
