import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ToastViewport } from "../components/Toast.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const dismissToast = useCallback((id) => {
		setToasts((items) => items.filter((item) => item.id !== id));
	}, []);

	const pushToast = useCallback((toast) => {
		const id = crypto.randomUUID();
		setToasts((items) => [...items, { ...toast, id }]);
		window.setTimeout(() => {
			setToasts((items) => items.filter((item) => item.id !== id));
		}, toast.duration ?? 3600);
	}, []);

	const value = useMemo(
		() => ({
			dismissToast,
			error: (title, message) => pushToast({ title, message, variant: "error" }),
			info: (title, message) => pushToast({ title, message, variant: "info" }),
			success: (title, message) => pushToast({ title, message, variant: "success" }),
		}),
		[dismissToast, pushToast],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastViewport onDismiss={dismissToast} toasts={toasts} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
