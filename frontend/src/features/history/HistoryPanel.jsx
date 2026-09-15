import { useEffect, useRef, useState } from "react";
import { historyApi } from "./history.api.js";
import { EmptyState } from "../../shared/components/EmptyState.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { methodToClass, formatDateTime, formatDuration } from "../../shared/utils/format.js";

const METHOD_OPTIONS = ["", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function HistoryPanel({ collections, onOpenEntry, onRefreshCollections, onResendEntry, refreshKey, toast }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [method, setMethod] = useState("");
	const [confirmClear, setConfirmClear] = useState(false);
	const [saveTarget, setSaveTarget] = useState(null);
	const [saveValues, setSaveValues] = useState({ collectionId: "", folderId: "", name: "" });
	const isFirstFilterRender = useRef(true);

	const loadHistory = async () => {
		try {
			setLoading(true);
			setError("");
			const data = await historyApi.list({ limit: 50, method, q: query.trim() });
			setItems(data);
		} catch (requestError) {
			setError(requestError.message || "Unable to load history.");
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadHistory();
	}, [refreshKey]);

	useEffect(() => {
		if (isFirstFilterRender.current) {
			isFirstFilterRender.current = false;
			return undefined;
		}
		const handle = window.setTimeout(() => {
			loadHistory();
		}, 240);
		return () => window.clearTimeout(handle);
	}, [method, query]);

	const handleSave = async () => {
		if (!saveTarget) {
			return;
		}
		await historyApi.save(saveTarget._id, {
			collectionId: saveValues.collectionId,
			folderId: saveValues.folderId || null,
			name: saveValues.name.trim(),
		});
		toast.success("History saved", "Saved the request snapshot to a collection.");
		setSaveTarget(null);
		await onRefreshCollections();
	};

	const selectedCollection = collections.find((collection) => collection._id === saveValues.collectionId) || collections[0] || null;
	const folders = selectedCollection?.folders || [];

	return (
		<div className="sidebar-panel history-panel">
			<div className="sidebar-panel-header compact-panel-header">
				<h2>History</h2>
				<button className="button button-secondary" disabled={!items.length} onClick={() => setConfirmClear(true)} type="button">
					Clear all
				</button>
			</div>
			<div className="sidebar-filters">
				<label className="search-input">
					<MaterialIcon name="search" size={18} />
					<input
						aria-label="Search history"
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search URL or status"
						type="search"
						value={query}
					/>
				</label>
				<select aria-label="Filter history by method" onChange={(event) => setMethod(event.target.value)} value={method}>
					{METHOD_OPTIONS.map((option) => (
						<option key={option || "all"} value={option}>
							{option || "All methods"}
						</option>
					))}
				</select>
			</div>
			{loading ? (
				<div className="loading-panel compact-loading" role="status">
					Loading history…
				</div>
			) : null}
			{error ? (
				<div className="banner banner-error" role="alert">
					{error}
				</div>
			) : null}
			{!loading && !error && !items.length ? (
				<EmptyState
					icon="history"
					message="Executed requests will appear here so you can replay or save them later."
					title="No history yet"
				/>
			) : null}
			<div className="history-list" role="list">
				{items.map((item) => (
					<article className="history-item" key={item._id} role="listitem">
						<button className="history-item-main" onClick={() => onOpenEntry(item)} type="button">
							<div className="history-item-headline">
								<span className={`method-badge method-${methodToClass(item.method)}`.trim()}>{item.method}</span>
								<strong>{item.url}</strong>
							</div>
							<div className="history-item-meta">
								<span>
									{item.ok
										? `${item.response?.status} ${item.response?.statusText}`
										: item.error?.message || "Network error"}
								</span>
								<span>{formatDuration(item.timeMs)}</span>
								<span>{formatDateTime(item.createdAt)}</span>
							</div>
						</button>
						<div className="list-inline-actions">
							<button aria-label="Resend request" className="icon-button" onClick={() => onResendEntry(item)} type="button">
								<MaterialIcon name="send" size={18} title="Resend" />
							</button>
							<button
								aria-label="Save request to collection"
								className="icon-button"
								onClick={() => {
									setSaveTarget(item);
									setSaveValues({
										collectionId: collections[0]?._id || "",
										folderId: "",
										name: `${item.method} ${new URL(item.url, "http://localhost").pathname || "/"}`,
									});
								}}
								type="button"
							>
								<MaterialIcon name="save" size={18} title="Save to collection" />
							</button>
							<button
								aria-label="Delete history entry"
								className="icon-button"
								onClick={async () => {
									await historyApi.remove(item._id);
									toast.success("History entry deleted");
									await loadHistory();
								}}
								type="button"
							>
								<MaterialIcon name="delete" size={18} title="Delete" />
							</button>
						</div>
					</article>
				))}
			</div>
			<Modal
				description="Save the selected history snapshot as a request in a collection."
				onClose={() => setSaveTarget(null)}
				open={Boolean(saveTarget)}
				title="Save history to collection"
			>
				<div className="form-grid">
					<label className="field">
						<span>Name</span>
						<input
							autoFocus
							onChange={(event) => setSaveValues((current) => ({ ...current, name: event.target.value }))}
							type="text"
							value={saveValues.name}
						/>
					</label>
					<label className="field">
						<span>Collection</span>
						<select
							onChange={(event) =>
								setSaveValues((current) => ({ ...current, collectionId: event.target.value, folderId: "" }))
							}
							value={saveValues.collectionId}
						>
							{collections.map((collection) => (
								<option key={collection._id} value={collection._id}>
									{collection.name}
								</option>
							))}
						</select>
					</label>
					<label className="field">
						<span>Folder</span>
						<select
							onChange={(event) => setSaveValues((current) => ({ ...current, folderId: event.target.value }))}
							value={saveValues.folderId}
						>
							<option value="">Collection root</option>
							{folders.map((folder) => (
								<option key={folder._id} value={folder._id}>
									{folder.name}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="modal-actions">
					<button className="button button-secondary" onClick={() => setSaveTarget(null)} type="button">
						Cancel
					</button>
					<button
						className="button button-primary"
						disabled={!saveValues.collectionId || !saveValues.name.trim()}
						onClick={handleSave}
						type="button"
					>
						Save request
					</button>
				</div>
			</Modal>
			<Modal
				description="This removes every request from history."
				onClose={() => setConfirmClear(false)}
				open={confirmClear}
				title="Clear history?"
			>
				<div className="modal-actions">
					<button className="button button-secondary" onClick={() => setConfirmClear(false)} type="button">
						Cancel
					</button>
					<button
						className="button button-danger"
						onClick={async () => {
							await historyApi.clear();
							toast.success("History cleared");
							setConfirmClear(false);
							await loadHistory();
						}}
						type="button"
					>
						Clear all
					</button>
				</div>
			</Modal>
		</div>
	);
}
