import { MaterialIcon } from "./MaterialIcon.jsx";

export function EmptyState({ action, actionLabel, icon = "layers", message, title }) {
	return (
		<div className="empty-state">
			<div className="empty-state-icon">
				<MaterialIcon name={icon} size={28} />
			</div>
			<h2>{title}</h2>
			<p>{message}</p>
			{action && actionLabel ? (
				<button className="button button-primary" onClick={action} type="button">
					{actionLabel}
				</button>
			) : null}
		</div>
	);
}
