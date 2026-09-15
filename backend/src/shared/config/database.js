import mongoose from "mongoose";

export async function connectDatabase(uri) {
	try {
		await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
	} catch (error) {
		console.error(`Database connection failed: ${error.message}`);
		process.exit(1);
	}
}

export async function disconnectDatabase() {
	await mongoose.disconnect();
}
