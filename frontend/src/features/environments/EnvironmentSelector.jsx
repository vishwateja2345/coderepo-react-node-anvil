import { SelectMenu } from "../../shared/components/SelectMenu.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";

export function EnvironmentSelector({ activeEnvironment, environments, loading, onActivate, onManage }) {
	const options = environments.map((environment) => ({
		label: environment.name,
		value: environment._id,
	}));

	const placeholder = activeEnvironment
		? activeEnvironment.name
		: loading
			? "Loading environments…"
			: environments.length
				? "Select environment"
				: "No environments";

	return (
		<div className="toolbar-group environment-selector-group">
			<span className="toolbar-label">Environment</span>
			<SelectMenu
				className="environment-selector"
				disabled={loading}
				onChange={(value) => onActivate(value)}
				options={options}
				placeholder={placeholder}
				value={activeEnvironment?._id || ""}
			/>
			<button
				aria-label="Manage environments"
				className="icon-button header-utility-button"
				onClick={onManage}
				title="Manage environments"
				type="button"
			>
				<MaterialIcon name="edit" size={18} />
			</button>
		</div>
	);
}
