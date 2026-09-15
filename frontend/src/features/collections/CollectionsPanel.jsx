import { useEffect, useMemo, useState } from "react";
import { ConfirmationDialog } from "../../shared/components/ConfirmationDialog.jsx";
import { EmptyState } from "../../shared/components/EmptyState.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { methodToClass } from "../../shared/utils/format.js";

function insertAt(items, fromId, targetId, zone) {
	const orderedIds = items.map((item) => item._id).filter((id) => id !== fromId);
	const targetIndex = orderedIds.indexOf(targetId);
	if (targetIndex === -1) {
		return orderedIds;
	}
	const insertionIndex = zone === "below" ? targetIndex + 1 : targetIndex;
	orderedIds.splice(insertionIndex, 0, fromId);
	return orderedIds;
}

function getDropZone(event, allowInside) {
	const rect = event.currentTarget.getBoundingClientRect();
	const offsetY = event.clientY - rect.top;
	const topThreshold = rect.height * 0.28;
	const bottomThreshold = rect.height * 0.72;
	if (offsetY < topThreshold) {
		return "above";
	}
	if (allowInside && offsetY <= bottomThreshold) {
		return "inside";
	}
	return "below";
}

function menuId(type, id) {
	return `${type}:${id}`;
}

function ActionMenu({ items, label, open, onToggle }) {
	return (
		<div className="menu-anchor" data-tree-menu-root>
			<button
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={label}
				className="icon-button"
				onClick={(event) => {
					event.stopPropagation();
					onToggle();
				}}
				type="button"
			>
				<MaterialIcon name={label === "Add item" ? "plus" : "more_vert"} size={16} />
			</button>
			{open ? (
				<div className="floating-menu tree-overflow-menu" role="menu">
					{items.map((item) => (
						<button
							className="menu-item"
							key={item.label}
							onClick={(event) => {
								event.stopPropagation();
								item.onSelect();
							}}
							role="menuitem"
							type="button"
						>
							{item.icon ? <MaterialIcon name={item.icon} size={16} /> : null}
							<span>{item.label}</span>
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}

function RequestItem({ isMenuOpen, onAction, onDrag, onDrop, onOpenRequest, onToggleMenu, request, selected, dropState }) {
	const requestMenuId = menuId("request", request._id);
	return (
		<div
			className={`drop-wrapper ${dropState?.zone === "above" ? "drop-above" : ""} ${dropState?.zone === "below" ? "drop-below" : ""}`.trim()}
			draggable
			onDragEnd={onDrag.onEnd}
			onDragOver={(event) => onDrop(event, "over")}
			onDragStart={onDrag.onStart}
			onDrop={(event) => onDrop(event, "drop")}
		>
			<div className={`tree-item request-item ${selected ? "selected" : ""} ${isMenuOpen ? "menu-open" : ""}`.trim()}>
				<button className="tree-item-main" onClick={() => onOpenRequest(request._id)} type="button">
					<span className={`method-badge method-${methodToClass(request.method)}`.trim()}>{request.method}</span>
					<span className="truncate-text">{request.name}</span>
				</button>
				<div className="tree-row-actions">
					<ActionMenu
						items={[
							{ icon: "edit", label: "Rename", onSelect: () => onAction("renameRequest", request) },
							{ icon: "copy", label: "Duplicate", onSelect: () => onAction("duplicateRequest", request) },
							{ icon: "delete", label: "Delete", onSelect: () => onAction("deleteRequest", request) },
						]}
						label="Request actions"
						open={isMenuOpen}
						onToggle={() => onToggleMenu(isMenuOpen ? null : requestMenuId)}
					/>
				</div>
			</div>
		</div>
	);
}

export function CollectionsPanel({ actions, collections, loading, onOpenRequest, selectedRequestId }) {
	const [expandedCollections, setExpandedCollections] = useState(() => new Set());
	const [expandedFolders, setExpandedFolders] = useState(() => new Set());
	const [dialog, setDialog] = useState(null);
	const [formValues, setFormValues] = useState({ name: "", description: "", collectionId: "", folderId: "", method: "GET", url: "" });
	const [confirmDelete, setConfirmDelete] = useState(null);
	const [dragging, setDragging] = useState(null);
	const [dropTarget, setDropTarget] = useState(null);
	const [openMenu, setOpenMenu] = useState(null);

	const collectionOptions = useMemo(
		() => collections.map((collection) => ({ label: collection.name, value: collection._id })),
		[collections],
	);

	useEffect(() => {
		if (!openMenu) {
			return undefined;
		}

		const handleClickOutside = (event) => {
			if (!event.target.closest("[data-tree-menu-root]")) {
				setOpenMenu(null);
			}
		};
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				setOpenMenu(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [openMenu]);

	const toggleCollection = (id) => {
		setExpandedCollections((current) => {
			const next = new Set(current);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const toggleFolder = (id) => {
		setExpandedFolders((current) => {
			const next = new Set(current);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const openDialog = (type, context = null) => {
		setOpenMenu(null);
		setDialog({ type, context });
		if (type === "newCollection") {
			setFormValues({ name: "", description: "", collectionId: "", folderId: "", method: "GET", url: "" });
		}
		if (type === "newFolder") {
			setFormValues({ name: "", collectionId: context._id });
		}
		if (type === "newRequest") {
			setFormValues({ name: "", collectionId: context.collectionId, folderId: context.folderId || "", method: "GET", url: "" });
		}
		if (type === "renameCollection" || type === "renameFolder") {
			setFormValues({ name: context.name, description: context.description || "" });
		}
		if (type === "renameRequest") {
			setFormValues({ name: context.name, method: context.method, url: context.url || "" });
		}
	};

	const submitDialog = async (event) => {
		event.preventDefault();
		if (!dialog) {
			return;
		}

		if (dialog.type === "newCollection") {
			await actions.createCollection({ name: formValues.name.trim(), description: formValues.description.trim() });
		}
		if (dialog.type === "renameCollection") {
			await actions.updateCollection(dialog.context._id, {
				name: formValues.name.trim(),
				description: formValues.description.trim(),
			});
		}
		if (dialog.type === "newFolder") {
			await actions.createFolder(formValues.collectionId, { name: formValues.name.trim() });
		}
		if (dialog.type === "renameFolder") {
			await actions.updateFolder(dialog.context._id, { name: formValues.name.trim() });
		}
		if (dialog.type === "newRequest") {
			const created = await actions.createRequest(formValues.collectionId, {
				folderId: formValues.folderId || null,
				method: formValues.method,
				name: formValues.name.trim(),
				url: formValues.url.trim(),
			});
			onOpenRequest(created._id);
		}
		if (dialog.type === "renameRequest") {
			await actions.updateRequest(dialog.context._id, {
				name: formValues.name.trim(),
				method: formValues.method,
				url: formValues.url.trim(),
			});
		}
		setDialog(null);
	};

	const updateDropTarget = (event, target, allowInside) => {
		event.preventDefault();
		const zone = getDropZone(event, allowInside);
		setDropTarget({ ...target, zone });
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	};

	const clearDnD = () => {
		setDragging(null);
		setDropTarget(null);
	};

	const moveRequestToContainer = async ({ collectionId, destinationFolderId, insertIndex, sourceRequestId }) => {
		const collection = collections.find((item) => item._id === collectionId);
		if (!collection) {
			return;
		}
		const destinationRequests = collection.requests
			.filter((request) => (request.folderId || null) === (destinationFolderId || null) && request._id !== sourceRequestId)
			.sort((left, right) => (left.order || 0) - (right.order || 0));
		const orderedIds = destinationRequests.map((request) => request._id);
		const boundedIndex = Math.max(0, Math.min(insertIndex, orderedIds.length));
		orderedIds.splice(boundedIndex, 0, sourceRequestId);
		if (dragging.folderId !== destinationFolderId) {
			await actions.updateRequest(sourceRequestId, { folderId: destinationFolderId ?? null });
		}
		await actions.reorderRequests(collectionId, destinationFolderId ?? null, orderedIds);
	};

	const handleDropOnCollection = async (collection, zone) => {
		if (!dragging) {
			return;
		}
		if (dragging.kind === "collection" && zone !== "inside" && dragging.id !== collection._id) {
			const orderedIds = insertAt(collections, dragging.id, collection._id, zone);
			await actions.reorderCollections(orderedIds);
		}
		if (dragging.kind === "request" && zone === "inside" && dragging.collectionId === collection._id) {
			const destinationRequests = collection.requests.filter((request) => !request.folderId && request._id !== dragging.id);
			await moveRequestToContainer({
				collectionId: collection._id,
				destinationFolderId: null,
				insertIndex: destinationRequests.length,
				sourceRequestId: dragging.id,
			});
		}
		clearDnD();
	};

	const handleDropOnFolder = async (collection, folder, zone) => {
		if (!dragging) {
			return;
		}
		if (dragging.kind === "folder" && dragging.collectionId === collection._id && zone !== "inside" && dragging.id !== folder._id) {
			const orderedIds = insertAt(collection.folders, dragging.id, folder._id, zone);
			await actions.reorderFolders(collection._id, orderedIds);
		}
		if (dragging.kind === "request" && dragging.collectionId === collection._id && zone === "inside") {
			const destinationRequests = collection.requests.filter(
				(request) => request.folderId === folder._id && request._id !== dragging.id,
			);
			await moveRequestToContainer({
				collectionId: collection._id,
				destinationFolderId: folder._id,
				insertIndex: destinationRequests.length,
				sourceRequestId: dragging.id,
			});
		}
		clearDnD();
	};

	const handleDropOnRequest = async (collection, request, zone) => {
		if (!dragging || dragging.kind !== "request" || dragging.collectionId !== collection._id || dragging.id === request._id) {
			clearDnD();
			return;
		}
		const destinationFolderId = request.folderId || null;
		const siblingRequests = collection.requests
			.filter((item) => (item.folderId || null) === destinationFolderId && item._id !== dragging.id)
			.sort((left, right) => (left.order || 0) - (right.order || 0));
		const targetIndex = siblingRequests.findIndex((item) => item._id === request._id);
		const insertIndex = zone === "below" ? targetIndex + 1 : targetIndex;
		await moveRequestToContainer({ collectionId: collection._id, destinationFolderId, insertIndex, sourceRequestId: dragging.id });
		clearDnD();
	};

	return (
		<div className="sidebar-panel collections-panel">
			<div className="sidebar-panel-header compact-panel-header">
				<h2>Collections</h2>
				<button className="button button-primary" onClick={() => openDialog("newCollection")} type="button">
					<MaterialIcon name="plus" size={18} /> New
				</button>
			</div>
			{loading ? (
				<div className="loading-panel compact-loading" role="status">
					Loading collections…
				</div>
			) : null}
			{!loading && !collections.length ? (
				<EmptyState
					action={() => openDialog("newCollection")}
					actionLabel="Create collection"
					icon="layers"
					message="Save reusable requests into a collection."
					title="No collections yet"
				/>
			) : null}
			<div className="collection-tree" role="tree">
				{collections.map((collection) => {
					const rootRequests = collection.requests
						.filter((request) => !request.folderId)
						.sort((left, right) => (left.order || 0) - (right.order || 0));
					const expanded =
						expandedCollections.has(collection._id) ||
						Boolean(selectedRequestId && collection.requests.some((request) => request._id === selectedRequestId));
					const collectionDropState = dropTarget?.kind === "collection" && dropTarget?.id === collection._id ? dropTarget : null;
					const collectionAddMenu = menuId("collection-add", collection._id);
					const collectionMoreMenu = menuId("collection-more", collection._id);
					return (
						<section className="collection-card" key={collection._id}>
							<div
								className={`drop-wrapper ${collectionDropState?.zone === "above" ? "drop-above" : ""} ${collectionDropState?.zone === "below" ? "drop-below" : ""} ${collectionDropState?.zone === "inside" ? "drop-inside" : ""}`.trim()}
								onDragLeave={(event) => {
									if (!event.currentTarget.contains(event.relatedTarget)) {
										setDropTarget(null);
									}
								}}
								onDragOver={(event) =>
									updateDropTarget(event, { id: collection._id, kind: "collection" }, dragging?.kind === "request")
								}
								onDrop={() => handleDropOnCollection(collection, dropTarget?.zone)}
							>
								<div
									className={`tree-item collection-item ${openMenu === collectionAddMenu || openMenu === collectionMoreMenu ? "menu-open" : ""}`.trim()}
									draggable
									onDragEnd={clearDnD}
									onDragStart={() => setDragging({ id: collection._id, kind: "collection" })}
								>
									<button
										aria-expanded={expanded}
										className="tree-item-main"
										onClick={() => toggleCollection(collection._id)}
										type="button"
									>
										<MaterialIcon name={expanded ? "chevron_down" : "chevron_right"} size={18} />
										<MaterialIcon name="layers" size={18} />
										<span className="truncate-text">{collection.name}</span>
									</button>
									<div className="tree-row-actions">
										<ActionMenu
											items={[
												{
													icon: "folder",
													label: "New folder",
													onSelect: () => openDialog("newFolder", collection),
												},
												{
													icon: "plus",
													label: "New request",
													onSelect: () =>
														openDialog("newRequest", { collectionId: collection._id, folderId: null }),
												},
											]}
											label="Add item"
											open={openMenu === collectionAddMenu}
											onToggle={() => setOpenMenu(openMenu === collectionAddMenu ? null : collectionAddMenu)}
										/>
										<ActionMenu
											items={[
												{
													icon: "edit",
													label: "Rename",
													onSelect: () => openDialog("renameCollection", collection),
												},
												{
													icon: "copy",
													label: "Duplicate",
													onSelect: async () => {
														setOpenMenu(null);
														await actions.duplicateCollection(collection._id);
													},
												},
												{
													icon: "delete",
													label: "Delete",
													onSelect: () => setConfirmDelete({ entity: collection, type: "collection" }),
												},
											]}
											label="Collection actions"
											open={openMenu === collectionMoreMenu}
											onToggle={() => setOpenMenu(openMenu === collectionMoreMenu ? null : collectionMoreMenu)}
										/>
									</div>
								</div>
							</div>
							{expanded ? (
								<div className="tree-children">
									{rootRequests.map((request) => (
										<RequestItem
											dropState={dropTarget?.kind === "request" && dropTarget?.id === request._id ? dropTarget : null}
											isMenuOpen={openMenu === menuId("request", request._id)}
											key={request._id}
											onAction={(type, payload) => {
												setOpenMenu(null);
												if (type === "renameRequest") {
													openDialog(type, payload);
												}
												if (type === "duplicateRequest") {
													actions.duplicateRequest(payload._id);
												}
												if (type === "deleteRequest") {
													setConfirmDelete({ entity: payload, type: "request" });
												}
											}}
											onDrag={{
												onEnd: clearDnD,
												onStart: () =>
													setDragging({
														id: request._id,
														kind: "request",
														collectionId: collection._id,
														folderId: null,
													}),
											}}
											onDrop={(event, phase) => {
												if (phase === "over") {
													updateDropTarget(event, { id: request._id, kind: "request" }, false);
													return;
												}
												handleDropOnRequest(collection, request, getDropZone(event, false));
											}}
											onOpenRequest={onOpenRequest}
											onToggleMenu={setOpenMenu}
											request={request}
											selected={selectedRequestId === request._id}
										/>
									))}
									{collection.folders
										.sort((left, right) => (left.order || 0) - (right.order || 0))
										.map((folder) => {
											const folderExpanded =
												expandedFolders.has(folder._id) ||
												Boolean(
													selectedRequestId &&
													collection.requests.some(
														(request) => request.folderId === folder._id && request._id === selectedRequestId,
													),
												);
											const folderRequests = collection.requests
												.filter((request) => request.folderId === folder._id)
												.sort((left, right) => (left.order || 0) - (right.order || 0));
											const folderDropState =
												dropTarget?.kind === "folder" && dropTarget?.id === folder._id ? dropTarget : null;
											const folderAddMenu = menuId("folder-add", folder._id);
											const folderMoreMenu = menuId("folder-more", folder._id);
											return (
												<div className="folder-group" key={folder._id}>
													<div
														className={`drop-wrapper ${folderDropState?.zone === "above" ? "drop-above" : ""} ${folderDropState?.zone === "below" ? "drop-below" : ""} ${folderDropState?.zone === "inside" ? "drop-inside" : ""}`.trim()}
														onDragLeave={(event) => {
															if (!event.currentTarget.contains(event.relatedTarget)) {
																setDropTarget(null);
															}
														}}
														onDragOver={(event) =>
															updateDropTarget(
																event,
																{ id: folder._id, kind: "folder" },
																dragging?.kind === "request",
															)
														}
														onDrop={() => handleDropOnFolder(collection, folder, dropTarget?.zone)}
													>
														<div
															className={`tree-item folder-item ${openMenu === folderAddMenu || openMenu === folderMoreMenu ? "menu-open" : ""}`.trim()}
															draggable
															onDragEnd={clearDnD}
															onDragStart={() =>
																setDragging({
																	id: folder._id,
																	kind: "folder",
																	collectionId: collection._id,
																})
															}
														>
															<button
																aria-expanded={folderExpanded}
																className="tree-item-main"
																onClick={() => toggleFolder(folder._id)}
																type="button"
															>
																<MaterialIcon
																	name={folderExpanded ? "chevron_down" : "chevron_right"}
																	size={18}
																/>
																<MaterialIcon name="folder" size={18} />
																<span className="truncate-text">{folder.name}</span>
															</button>
															<div className="tree-row-actions">
																<ActionMenu
																	items={[
																		{
																			icon: "plus",
																			label: "New request",
																			onSelect: () =>
																				openDialog("newRequest", {
																					collectionId: collection._id,
																					folderId: folder._id,
																				}),
																		},
																	]}
																	label="Add item"
																	open={openMenu === folderAddMenu}
																	onToggle={() =>
																		setOpenMenu(openMenu === folderAddMenu ? null : folderAddMenu)
																	}
																/>
																<ActionMenu
																	items={[
																		{
																			icon: "edit",
																			label: "Rename",
																			onSelect: () => openDialog("renameFolder", folder),
																		},
																		{
																			icon: "copy",
																			label: "Duplicate",
																			onSelect: async () => {
																				setOpenMenu(null);
																				await actions.duplicateFolder(folder._id);
																			},
																		},
																		{
																			icon: "delete",
																			label: "Delete",
																			onSelect: () =>
																				setConfirmDelete({ entity: folder, type: "folder" }),
																		},
																	]}
																	label="Folder actions"
																	open={openMenu === folderMoreMenu}
																	onToggle={() =>
																		setOpenMenu(openMenu === folderMoreMenu ? null : folderMoreMenu)
																	}
																/>
															</div>
														</div>
													</div>
													{folderExpanded ? (
														<div className="tree-children nested-children">
															{folderRequests.map((request) => (
																<RequestItem
																	dropState={
																		dropTarget?.kind === "request" && dropTarget?.id === request._id
																			? dropTarget
																			: null
																	}
																	isMenuOpen={openMenu === menuId("request", request._id)}
																	key={request._id}
																	onAction={(type, payload) => {
																		setOpenMenu(null);
																		if (type === "renameRequest") {
																			openDialog(type, payload);
																		}
																		if (type === "duplicateRequest") {
																			actions.duplicateRequest(payload._id);
																		}
																		if (type === "deleteRequest") {
																			setConfirmDelete({ entity: payload, type: "request" });
																		}
																	}}
																	onDrag={{
																		onEnd: clearDnD,
																		onStart: () =>
																			setDragging({
																				id: request._id,
																				kind: "request",
																				collectionId: collection._id,
																				folderId: folder._id,
																			}),
																	}}
																	onDrop={(event, phase) => {
																		if (phase === "over") {
																			updateDropTarget(
																				event,
																				{ id: request._id, kind: "request" },
																				false,
																			);
																			return;
																		}
																		handleDropOnRequest(collection, request, getDropZone(event, false));
																	}}
																	onOpenRequest={onOpenRequest}
																	onToggleMenu={setOpenMenu}
																	request={request}
																	selected={selectedRequestId === request._id}
																/>
															))}
														</div>
													) : null}
												</div>
											);
										})}
								</div>
							) : null}
						</section>
					);
				})}
			</div>
			<Modal
				description="Create or edit a collection, folder, or request."
				onClose={() => setDialog(null)}
				open={Boolean(dialog)}
				title={
					dialog?.type === "newCollection"
						? "New collection"
						: dialog?.type === "newFolder"
							? "New folder"
							: dialog?.type === "newRequest"
								? "New request"
								: dialog?.type === "renameCollection"
									? "Edit collection"
									: dialog?.type === "renameFolder"
										? "Rename folder"
										: "Edit request"
				}
			>
				<form className="form-grid" onSubmit={submitDialog}>
					<label className="field">
						<span>Name</span>
						<input
							autoFocus
							onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
							required
							type="text"
							value={formValues.name || ""}
						/>
					</label>
					{dialog?.type === "newCollection" || dialog?.type === "renameCollection" ? (
						<label className="field">
							<span>Description</span>
							<textarea
								onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
								rows={4}
								value={formValues.description || ""}
							/>
						</label>
					) : null}
					{dialog?.type === "newRequest" || dialog?.type === "renameRequest" ? (
						<>
							{dialog?.type === "newRequest" ? (
								<label className="field">
									<span>Collection</span>
									<select
										onChange={(event) =>
											setFormValues((current) => ({ ...current, collectionId: event.target.value, folderId: "" }))
										}
										value={formValues.collectionId}
									>
										{collectionOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
							) : null}
							{dialog?.type === "newRequest" ? (
								<label className="field">
									<span>Folder</span>
									<select
										onChange={(event) => setFormValues((current) => ({ ...current, folderId: event.target.value }))}
										value={formValues.folderId || ""}
									>
										<option value="">Collection root</option>
										{(collections.find((collection) => collection._id === formValues.collectionId)?.folders || []).map(
											(folder) => (
												<option key={folder._id} value={folder._id}>
													{folder.name}
												</option>
											),
										)}
									</select>
								</label>
							) : null}
							<label className="field">
								<span>Method</span>
								<select
									onChange={(event) => setFormValues((current) => ({ ...current, method: event.target.value }))}
									value={formValues.method || "GET"}
								>
									{["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => (
										<option key={method} value={method}>
											{method}
										</option>
									))}
								</select>
							</label>
							<label className="field">
								<span>URL</span>
								<input
									onChange={(event) => setFormValues((current) => ({ ...current, url: event.target.value }))}
									placeholder="https://api.example.com"
									type="text"
									value={formValues.url || ""}
								/>
							</label>
						</>
					) : null}
					<div className="modal-actions">
						<button className="button button-secondary" onClick={() => setDialog(null)} type="button">
							Cancel
						</button>
						<button className="button button-primary" type="submit">
							Save
						</button>
					</div>
				</form>
			</Modal>
			<ConfirmationDialog
				confirmLabel="Delete"
				danger
				description={confirmDelete ? `Delete ${confirmDelete.entity.name}? This action cannot be undone.` : ""}
				onClose={() => setConfirmDelete(null)}
				onConfirm={async () => {
					if (!confirmDelete) {
						return;
					}
					if (confirmDelete.type === "collection") {
						await actions.deleteCollection(confirmDelete.entity._id);
					}
					if (confirmDelete.type === "folder") {
						await actions.deleteFolder(confirmDelete.entity._id);
					}
					if (confirmDelete.type === "request") {
						await actions.deleteRequest(confirmDelete.entity._id);
					}
					setConfirmDelete(null);
				}}
				open={Boolean(confirmDelete)}
				title={`Delete ${confirmDelete?.type || "item"}?`}
			/>
		</div>
	);
}
