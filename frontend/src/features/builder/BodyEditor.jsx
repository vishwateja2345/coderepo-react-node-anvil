import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { createKeyValueRow } from "../../shared/utils/request.js";
import { parseJsonSafely } from "../../shared/utils/json-view.js";

const BODY_MODES = [
	{ value: "none", label: "None" },
	{ value: "json", label: "JSON" },
	{ value: "text", label: "Text" },
	{ value: "form", label: "Form" },
];

export function BodyEditor({ body, onChange }) {
	const jsonValidation = body.mode === "json" ? parseJsonSafely(body.raw) : { error: "" };

	const updateFormRow = (index, patch) => {
		onChange({
			...body,
			formItems: body.formItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
		});
	};

	return (
		<section className="editor-section table-card">
			<div className="table-card-header body-header">
				<h3>Body</h3>
				<div aria-label="Body mode" className="segmented-control" role="tablist">
					{BODY_MODES.map((mode) => (
						<button
							aria-selected={body.mode === mode.value}
							className={body.mode === mode.value ? "active" : ""}
							key={mode.value}
							onClick={() => onChange({ ...body, mode: mode.value })}
							role="tab"
							type="button"
						>
							{mode.label}
						</button>
					))}
				</div>
			</div>
			{body.mode === "none" ? <div className="subtle-empty">No body will be sent with this request.</div> : null}
			{body.mode === "json" ? (
				<div className="body-editor-panel">
					<textarea
						aria-label="JSON request body"
						className={`code-area ${jsonValidation.error ? "invalid" : ""}`.trim()}
						onChange={(event) => onChange({ ...body, raw: event.target.value })}
						placeholder='{"hello":"world"}'
						rows={12}
						value={body.raw}
					/>
					{jsonValidation.error ? (
						<div className="banner banner-warning" role="status">
							<MaterialIcon name="warning" size={16} /> JSON is invalid and will be sent as raw text until corrected:{" "}
							{jsonValidation.error}
						</div>
					) : null}
				</div>
			) : null}
			{body.mode === "text" ? (
				<textarea
					aria-label="Text request body"
					className="code-area"
					onChange={(event) => onChange({ ...body, raw: event.target.value })}
					placeholder="Paste plain text"
					rows={12}
					value={body.raw}
				/>
			) : null}
			{body.mode === "form" ? (
				<div className="key-value-table">
					<div className="table-card-header nested-header">
						<h4>Form fields</h4>
						<button
							className="button button-secondary"
							onClick={() => onChange({ ...body, formItems: [...body.formItems, createKeyValueRow()] })}
							type="button"
						>
							Add field
						</button>
					</div>
					<div className="key-value-header">
						<span>On</span>
						<span>Key</span>
						<span>Value</span>
						<span className="sr-only">Actions</span>
					</div>
					{body.formItems.map((item, index) => (
						<div className="key-value-row" key={item.id}>
							<label className="checkbox-cell">
								<input
									checked={item.enabled !== false}
									onChange={(event) => updateFormRow(index, { enabled: event.target.checked })}
									type="checkbox"
								/>
								<span className="sr-only">Toggle form item</span>
							</label>
							<input
								aria-label={`Form key ${index + 1}`}
								onChange={(event) => updateFormRow(index, { key: event.target.value })}
								placeholder="name"
								type="text"
								value={item.key}
							/>
							<input
								aria-label={`Form value ${index + 1}`}
								onChange={(event) => updateFormRow(index, { value: event.target.value })}
								placeholder="value"
								type="text"
								value={item.value}
							/>
							<button
								aria-label="Remove form item"
								className="icon-button"
								onClick={() =>
									onChange({
										...body,
										formItems:
											body.formItems.length === 1
												? [createKeyValueRow()]
												: body.formItems.filter((_, itemIndex) => itemIndex !== index),
									})
								}
								type="button"
							>
								<MaterialIcon name="delete" size={18} />
							</button>
						</div>
					))}
				</div>
			) : null}
		</section>
	);
}
