import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./shared/context/AuthContext.jsx";
import { ToastProvider } from "./shared/context/ToastContext.jsx";
import { applyTheme, readTheme } from "./shared/utils/theme.js";
import "./styles.css";

applyTheme(readTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ToastProvider>
			<AuthProvider>
				<App />
			</AuthProvider>
		</ToastProvider>
	</React.StrictMode>,
);
