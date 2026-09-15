import { useEffect, useId, useRef } from "react";

export function Modal({ children, className = "", description, onClose, open, title }) {
	const dialogRef = useRef(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return undefined;
		}

		if (open && !dialog.open) {
			dialog.showModal();
			const focusTarget = dialog.querySelector("[autofocus]");
			focusTarget?.focus();
		}

		if (!open && dialog.open) {
			dialog.close();
		}
	}, [open]);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return undefined;
		}

		const handleCancel = (event) => {
			event.preventDefault();
			onClose?.();
		};

		dialog.addEventListener("cancel", handleCancel);
		return () => dialog.removeEventListener("cancel", handleCancel);
	}, [onClose]);

	const handleBackdropClick = (event) => {
		if (event.target === dialogRef.current) {
			onClose?.();
		}
	};

	return (
		<dialog
			aria-describedby={description ? descriptionId : undefined}
			aria-labelledby={title ? titleId : undefined}
			className={`modal ${className}`.trim()}
			onClick={handleBackdropClick}
			ref={dialogRef}
		>
			<div className="modal-surface">
				{title ? (
					<header className="modal-header">
						<div>
							<h2 id={titleId}>{title}</h2>
							{description ? <p id={descriptionId}>{description}</p> : null}
						</div>
						<button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
							×
						</button>
					</header>
				) : null}
				<div className="modal-body">{children}</div>
			</div>
		</dialog>
	);
}
