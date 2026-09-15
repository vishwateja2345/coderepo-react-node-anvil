import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// VITE_BACKEND_TARGET lets local development point the dev-server proxy at an
// alternate backend port without editing this file; it always defaults to the
// declared port 8000 required by hackerrank.yml when unset.
const backendTarget = process.env.VITE_BACKEND_TARGET || "http://localhost:8000";

export default defineConfig({
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: 3000,
		allowedHosts: [".internal", "localhost"],
		proxy: {
			"/api": {
				target: backendTarget,
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
});
