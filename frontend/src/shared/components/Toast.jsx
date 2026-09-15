import { MaterialIcon } from "./MaterialIcon.jsx";

export function Toast({ onDismiss, toast }) {
	return (
		<div className={`toast toast-${toast.variant || "info"}`} role="status">
			<div className="toast-icon">
				<MaterialIcon
					name={toast.variant === "error" ? "error" : toast.variant === "success" ? "check_circle" : "warning"}
					size={18}
				/>
			</div>
			<div className="toast-content">
				<strong>{toast.title}</strong>
				{toast.message ? <p>{toast.message}</p> : null}
			</div>
			<button aria-label="Dismiss notification" className="icon-button" onClick={() => onDismiss(toast.id)} type="button">
				<MaterialIcon name="close" size={18} />
			</button>
		</div>
	);
}

export function ToastViewport({ onDismiss, toasts }) {
	return (
		<div aria-atomic="true" aria-live="polite" className="toast-viewport">
			{toasts.map((toast) => (
				<Toast key={toast.id} onDismiss={onDismiss} toast={toast} />
			))}
		</div>
	);
}
