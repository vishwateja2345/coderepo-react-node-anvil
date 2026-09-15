import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { createKeyValueRow } from "../../shared/utils/request.js";

export function ParamsEditor({ label = "Query parameters", rows, onChange }) {
	const updateRow = (index, patch) => {
		onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
	};

	const removeRow = (index) => {
		onChange(rows.length === 1 ? [createKeyValueRow()] : rows.filter((_, rowIndex) => rowIndex !== index));
	};

	return (
		<section className="editor-section table-card">
			<div className="table-card-header">
				<h3>{label}</h3>
				<button className="button button-secondary" onClick={() => onChange([...rows, createKeyValueRow()])} type="button">
					Add row
				</button>
			</div>
			<div className="key-value-table">
				<div className="key-value-header">
					<span>On</span>
					<span>Key</span>
					<span>Value</span>
					<span className="sr-only">Actions</span>
				</div>
				{rows.map((row, index) => (
					<div className="key-value-row" key={row.id}>
						<label className="checkbox-cell">
							<input
								checked={row.enabled !== false}
								onChange={(event) => updateRow(index, { enabled: event.target.checked })}
								type="checkbox"
							/>
							<span className="sr-only">Toggle row</span>
						</label>
						<input
							aria-label={`${label} key ${index + 1}`}
							onChange={(event) => updateRow(index, { key: event.target.value })}
							placeholder="Accept"
							type="text"
							value={row.key}
						/>
						<input
							aria-label={`${label} value ${index + 1}`}
							onChange={(event) => updateRow(index, { value: event.target.value })}
							placeholder="application/json"
							type="text"
							value={row.value}
						/>
						<button aria-label="Remove row" className="icon-button" onClick={() => removeRow(index)} type="button">
							<MaterialIcon name="delete" size={18} />
						</button>
					</div>
				))}
			</div>
		</section>
	);
}
