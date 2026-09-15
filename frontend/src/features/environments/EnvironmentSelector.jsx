import { SelectMenu } from "../../shared/components/SelectMenu.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";

export function EnvironmentSelector({ activeEnvironment, environments, onActivate, onManage }) {
	const options = environments.map((environment) => ({
		label: environment.name,
		value: environment._id,
	}));

	return (
		<div className="toolbar-group environment-selector-group">
			<span className="toolbar-label">Environment</span>
			<SelectMenu
				className="environment-selector"
				onChange={(value) => onActivate(value)}
				options={options}
				placeholder={activeEnvironment ? activeEnvironment.name : environments.length ? "Select environment" : "No environments"}
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
