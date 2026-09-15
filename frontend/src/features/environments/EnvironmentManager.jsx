import { useEffect, useMemo, useState } from "react";
import { ConfirmationDialog } from "../../shared/components/ConfirmationDialog.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { createKeyValueRow, normalizeKeyValueList, sanitizeKeyValueList } from "../../shared/utils/request.js";

function cloneEnvironment(environment) {
	if (!environment) {
		return null;
	}

	return {
		...environment,
		variables: normalizeKeyValueList(environment.variables, { ensureOne: true }),
	};
}

export function EnvironmentManager({ environments, onActivate, onClose, onCreate, onDelete, onSave, open, saving }) {
	const [selectedId, setSelectedId] = useState("");
	const [draft, setDraft] = useState(null);
	const [newEnvironmentName, setNewEnvironmentName] = useState("");
	const [error, setError] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const nextEnvironment = environments.find((environment) => environment._id === selectedId) || environments[0] || null;
		setSelectedId(nextEnvironment?._id || "");
		setDraft(cloneEnvironment(nextEnvironment));
		setError("");
	}, [environments, open, selectedId]);

	const selectedEnvironment = useMemo(
		() => environments.find((environment) => environment._id === selectedId) || null,
		[environments, selectedId],
	);

	const updateDraft = (updater) => {
		setDraft((current) => (typeof updater === "function" ? updater(current) : updater));
	};

	const handleCreate = async (event) => {
		event.preventDefault();
		if (!newEnvironmentName.trim()) {
			setError("Environment name is required.");
			return;
		}
		const created = await onCreate({ name: newEnvironmentName.trim(), variables: [] });
		setNewEnvironmentName("");
		setSelectedId(created._id);
	};

	const handleSave = async () => {
		if (!draft) {
			return;
		}

		if (!draft.name.trim()) {
			setError("Environment name is required.");
			return;
		}

		const invalidRow = draft.variables.find((variable) => variable.enabled !== false && !variable.key.trim() && variable.value.trim());
		if (invalidRow) {
			setError("Enabled variables with a value must have a key.");
			return;
		}

		setError("");
		await onSave(draft._id, {
			name: draft.name.trim(),
			variables: sanitizeKeyValueList(draft.variables),
		});
	};

	return (
		<Modal
			className="environment-modal"
			description="Create and manage reusable environment variables."
			onClose={onClose}
			open={open}
			title="Manage environments"
		>
			<div className="environment-manager">
				<div className="environment-sidebar">
					<form className="inline-form" onSubmit={handleCreate}>
						<input
							aria-label="New environment name"
							onChange={(event) => setNewEnvironmentName(event.target.value)}
							placeholder="Create environment"
							type="text"
							value={newEnvironmentName}
						/>
						<button className="button button-primary" type="submit">
							Add
						</button>
					</form>
					<div className="environment-list" role="list">
						{environments.map((environment) => (
							<button
								className={`environment-list-item ${environment._id === selectedId ? "active" : ""}`.trim()}
								key={environment._id}
								onClick={() => {
									setSelectedId(environment._id);
									setDraft(cloneEnvironment(environment));
								}}
								type="button"
							>
								<div>
									<strong>{environment.name}</strong>
									<small>{environment.variables?.length || 0} variables</small>
								</div>
								{environment.isActive ? <span className="badge badge-active">Active</span> : null}
							</button>
						))}
					</div>
				</div>
				<div className="environment-editor">
					{draft ? (
						<>
							<div className="section-header">
								<label className="field grow-field">
									<span>Name</span>
									<input
										onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
										type="text"
										value={draft.name}
									/>
								</label>
								<div className="row-actions">
									<button className="button button-secondary" onClick={() => onActivate(draft._id)} type="button">
										Set active
									</button>
									<button
										className="button button-danger"
										onClick={() => setConfirmDelete(selectedEnvironment)}
										type="button"
									>
										Delete
									</button>
								</div>
							</div>
							<div className="table-card">
								<div className="table-card-header">
									<h3>Variables</h3>
									<button
										className="button button-secondary"
										onClick={() =>
											updateDraft((current) => ({
												...current,
												variables: [...current.variables, createKeyValueRow()],
											}))
										}
										type="button"
									>
										Add variable
									</button>
								</div>
								<div className="key-value-table">
									<div className="key-value-header">
										<span>On</span>
										<span>Key</span>
										<span>Value</span>
										<span className="sr-only">Actions</span>
									</div>
									{draft.variables.map((variable, index) => (
										<div className="key-value-row" key={variable.id}>
											<label className="checkbox-cell">
												<input
													checked={variable.enabled !== false}
													onChange={(event) =>
														updateDraft((current) => ({
															...current,
															variables: current.variables.map((item, itemIndex) =>
																itemIndex === index ? { ...item, enabled: event.target.checked } : item,
															),
														}))
													}
													type="checkbox"
												/>
												<span className="sr-only">Toggle variable</span>
											</label>
											<input
												aria-label={`Variable key ${index + 1}`}
												onChange={(event) =>
													updateDraft((current) => ({
														...current,
														variables: current.variables.map((item, itemIndex) =>
															itemIndex === index ? { ...item, key: event.target.value } : item,
														),
													}))
												}
												placeholder="base_url"
												type="text"
												value={variable.key}
											/>
											<input
												aria-label={`Variable value ${index + 1}`}
												onChange={(event) =>
													updateDraft((current) => ({
														...current,
														variables: current.variables.map((item, itemIndex) =>
															itemIndex === index ? { ...item, value: event.target.value } : item,
														),
													}))
												}
												placeholder="https://api.example.com"
												type="text"
												value={variable.value}
											/>
											<button
												aria-label="Remove variable"
												className="icon-button"
												onClick={() =>
													updateDraft((current) => ({
														...current,
														variables:
															current.variables.length === 1
																? [createKeyValueRow()]
																: current.variables.filter((item, itemIndex) => itemIndex !== index),
													}))
												}
												type="button"
											>
												<MaterialIcon name="delete" size={18} />
											</button>
										</div>
									))}
								</div>
							</div>
							{error ? (
								<div className="banner banner-error" role="alert">
									{error}
								</div>
							) : null}
							<div className="modal-actions">
								<button className="button button-secondary" onClick={onClose} type="button">
									Close
								</button>
								<button className="button button-primary" disabled={saving} onClick={handleSave} type="button">
									{saving ? "Saving..." : "Save changes"}
								</button>
							</div>
						</>
					) : (
						<div className="empty-state compact-empty">
							<div className="empty-state-icon">
								<MaterialIcon name="globe" size={24} />
							</div>
							<h2>No environments yet</h2>
							<p>
								Create an environment to reuse variables like <code>{"{{base_url}}"}</code>.
							</p>
						</div>
					)}
				</div>
			</div>
			<ConfirmationDialog
				confirmLabel="Delete environment"
				danger
				description={`This permanently deletes "${confirmDelete?.name || ""}" and its variables. This cannot be undone.`}
				onClose={() => setConfirmDelete(null)}
				onConfirm={async () => {
					const target = confirmDelete;
					setConfirmDelete(null);
					await onDelete(target);
				}}
				open={Boolean(confirmDelete)}
				title="Delete environment?"
			/>
		</Modal>
	);
}
