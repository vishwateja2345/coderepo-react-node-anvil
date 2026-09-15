import { Modal } from "./Modal.jsx";

export function ConfirmationDialog({ confirmLabel = "Confirm", danger = false, description, onClose, onConfirm, open, title }) {
	return (
		<Modal description={description} onClose={onClose} open={open} title={title}>
			<div className="confirmation-dialog">
				<div className="modal-actions">
					<button className="button button-secondary" onClick={onClose} type="button">
						Cancel
					</button>
					<button className={`button ${danger ? "button-danger" : "button-primary"}`} onClick={onConfirm} type="button">
						{confirmLabel}
					</button>
				</div>
			</div>
		</Modal>
	);
}
