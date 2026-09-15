import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { RequestBuilder } from "./features/builder/RequestBuilder.jsx";
import { builderApi } from "./features/builder/builder.api.js";
import { CollectionsPanel } from "./features/collections/CollectionsPanel.jsx";
import { collectionsApi } from "./features/collections/collections.api.js";
import { EnvironmentManager } from "./features/environments/EnvironmentManager.jsx";
import { EnvironmentSelector } from "./features/environments/EnvironmentSelector.jsx";
import { environmentApi } from "./features/environments/environment.api.js";
import { HistoryPanel } from "./features/history/HistoryPanel.jsx";
import { ResponseBody } from "./features/response/ResponseBody.jsx";
import { ResponseHeaders } from "./features/response/ResponseHeaders.jsx";
import { ResponseMeta } from "./features/response/ResponseMeta.jsx";
import { SnippetDialog } from "./features/snippets/SnippetDialog.jsx";
import { MaterialIcon } from "./shared/components/MaterialIcon.jsx";
import { Modal } from "./shared/components/Modal.jsx";
import { useAuth } from "./shared/context/AuthContext.jsx";
import { useToast } from "./shared/context/ToastContext.jsx";
import { getInitials } from "./shared/utils/format.js";
import {
	createBlankRequest,
	defaultAuth,
	hydrateSavedRequest,
	sanitizeAuth,
	sanitizeBody,
	sanitizeKeyValueList,
	serializeRequest,
} from "./shared/utils/request.js";
import { applyTheme, readTheme } from "./shared/utils/theme.js";

function AppBootScreen() {
	return (
		<main aria-label="Opening Anvil" className="app-boot" role="status">
			<div className="app-boot-brand">
				<div aria-hidden="true" className="brand-badge brand-badge-large">
					A
				</div>
				<div>
					<strong>Anvil</strong>
					<span>API Workbench</span>
				</div>
			</div>
			<div aria-hidden="true" className="app-boot-progress">
				<span />
			</div>
		</main>
	);
}

function authTypeLabel(type) {
	const map = {
		none: "No auth",
		inherit: "Inherit from collection",
		bearer: "Bearer Token",
		basic: "Basic Auth",
		apiKey: "API Key",
	};
	return map[type] || "No auth";
}

function createActiveDraft(overrides = {}) {
	const request = createBlankRequest(overrides);
	return {
		baseline: serializeRequest(request),
		draft: {
			...request,
			collectionAuth: overrides.collectionAuth || null,
			collectionId: overrides.collectionId || null,
			folderId: overrides.folderId || null,
			resolvedCollectionAuthLabel: overrides.resolvedCollectionAuthLabel || "",
			savedRequestId: overrides.savedRequestId || null,
		},
	};
}

function savedRequestToDraft(collection, request) {
	const hydrated = hydrateSavedRequest(request);
	return {
		baseline: serializeRequest(hydrated),
		draft: {
			...hydrated,
			collectionAuth: collection.auth || defaultAuth(),
			collectionId: collection._id,
			folderId: request.folderId || null,
			resolvedCollectionAuthLabel: authTypeLabel(collection.auth?.type || "none"),
			savedRequestId: request._id,
		},
	};
}

function findSavedRequest(collections, requestId) {
	for (const collection of collections) {
		const match = collection.requests.find((request) => request._id === requestId);
		if (match) {
			return { collection, request: match };
		}
	}
	return null;
}

function normalizeExecutionPayload(draft, activeEnvironmentId) {
	return {
		auth: sanitizeAuth(draft.auth),
		body: sanitizeBody(draft.body),
		collectionAuth: draft.auth.type === "inherit" && draft.collectionAuth ? sanitizeAuth(draft.collectionAuth) : undefined,
		environmentId: activeEnvironmentId || undefined,
		headers: sanitizeKeyValueList(draft.headers),
		method: draft.method,
		params: sanitizeKeyValueList(draft.params),
		savedRequestId: draft.savedRequestId || undefined,
		url: draft.url,
	};
}

function saveDialogState(collections, draft) {
	const preferredCollection = collections.find((collection) => collection._id === draft.collectionId) || collections[0] || null;
	return {
		collectionId: preferredCollection?._id || "",
		folderId: draft.folderId || "",
		name: draft.name || "Untitled request",
	};
}

function WorkspaceShell({ user }) {
	const { logout } = useAuth();
	const toast = useToast();
	const [theme, setTheme] = useState(() => readTheme());
	const [sidebarTab, setSidebarTab] = useState("collections");
	const [sidebarOpen, setSidebarOpen] = useState(() => !(window.matchMedia?.("(max-width: 900px)").matches ?? false));
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [collections, setCollections] = useState([]);
	const [collectionsLoading, setCollectionsLoading] = useState(true);
	const [environments, setEnvironments] = useState([]);
	const [environmentManagerOpen, setEnvironmentManagerOpen] = useState(false);
	const [environmentSaving, setEnvironmentSaving] = useState(false);
	const [activeRequest, setActiveRequest] = useState(() => createActiveDraft());
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveValues, setSaveValues] = useState({ collectionId: "", folderId: "", name: "Untitled request" });
	const [snippetOpen, setSnippetOpen] = useState(false);
	const [snippetLoading, setSnippetLoading] = useState(false);
	const [snippetText, setSnippetText] = useState("");
	const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
	const [responseState, setResponseState] = useState({ elapsedMs: 0, loading: false, response: null, startedAt: 0, tab: "body" });

	const activeEnvironment = useMemo(() => environments.find((environment) => environment.isActive) || null, [environments]);
	const hasUnsavedChanges = useMemo(() => serializeRequest(activeRequest.draft) !== activeRequest.baseline, [activeRequest]);
	const selectedCollection = collections.find((collection) => collection._id === saveValues.collectionId) || collections[0] || null;
	const isMobileSidebar = window.matchMedia?.("(max-width: 900px)").matches ?? false;

	const closeSidebarIfMobile = () => {
		if (isMobileSidebar) {
			setSidebarOpen(false);
		}
	};

	const refreshCollections = async (requestIdToReopen = activeRequest.draft.savedRequestId) => {
		try {
			setCollectionsLoading(true);
			const data = await collectionsApi.list();
			setCollections(data);
			if (requestIdToReopen) {
				const located = findSavedRequest(data, requestIdToReopen);
				if (located) {
					setActiveRequest(savedRequestToDraft(located.collection, located.request));
				}
			}
		} catch (requestError) {
			toast.error("Collections unavailable", requestError.message || "Unable to load collections.");
		} finally {
			setCollectionsLoading(false);
		}
	};

	const refreshEnvironments = async () => {
		try {
			setEnvironments(await environmentApi.list());
		} catch (requestError) {
			toast.error("Environments unavailable", requestError.message || "Unable to load environments.");
		}
	};

	useEffect(() => {
		refreshCollections();
		refreshEnvironments();
	}, []);

	useEffect(() => {
		setSaveValues(saveDialogState(collections, activeRequest.draft));
	}, [activeRequest.draft, collections]);

	useEffect(() => {
		if (!responseState.loading) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			setResponseState((current) => (current.loading ? { ...current, elapsedMs: Date.now() - current.startedAt } : current));
		}, 100);
		return () => window.clearInterval(intervalId);
	}, [responseState.loading, responseState.startedAt]);

	useEffect(() => {
		if (!accountMenuOpen) {
			return undefined;
		}

		const handleClickOutside = (event) => {
			if (!event.target.closest("[data-account-menu]")) {
				setAccountMenuOpen(false);
			}
		};
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				setAccountMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [accountMenuOpen]);

	const openSavedRequest = (requestId) => {
		const located = findSavedRequest(collections, requestId);
		if (!located) {
			return;
		}
		setActiveRequest(savedRequestToDraft(located.collection, located.request));
	};

	const runCollectionMutation = async (work, successTitle, requestIdToReopen = activeRequest.draft.savedRequestId) => {
		await work();
		toast.success(successTitle);
		await refreshCollections(requestIdToReopen);
	};

	const handleSend = async (draftOverride = activeRequest.draft) => {
		if (!draftOverride.url.trim()) {
			toast.error("Request URL required", "Enter a URL before sending the request.");
			return;
		}

		try {
			const startedAt = Date.now();
			setResponseState((current) => ({ ...current, elapsedMs: 0, loading: true, startedAt }));
			const response = await builderApi.execute(normalizeExecutionPayload(draftOverride, activeEnvironment?._id));
			setResponseState({ elapsedMs: Date.now() - startedAt, loading: false, response, startedAt: 0, tab: "body" });
			setHistoryRefreshKey((value) => value + 1);
			if (response.missingVariables?.length) {
				toast.info(
					"Unresolved variables",
					`${response.missingVariables.map((name) => `{{${name}}}`).join(", ")} not found in the active environment.`,
				);
			} else if (response.ok) {
				toast.success("Request complete", `${draftOverride.method} returned ${response.status} ${response.statusText}`);
			} else {
				toast.error("Network failure", response.error?.message || "The request did not receive a response.");
			}
		} catch (requestError) {
			setResponseState({ elapsedMs: 0, loading: false, response: null, startedAt: 0, tab: "body" });
			toast.error("Request failed", requestError.message || "Unable to execute request.");
		}
	};

	const handleLanguageChange = useCallback(
		async (language) => {
			if (!activeRequest.draft.url.trim()) {
				setSnippetText("");
				toast.error("Request URL required", "Enter a URL before generating a snippet.");
				return;
			}
			setSnippetLoading(true);
			try {
				const result = await builderApi.snippet({
					...normalizeExecutionPayload(activeRequest.draft, activeEnvironment?._id),
					language,
				});
				setSnippetText(result.snippet);
				if (result.missingVariables?.length) {
					toast.info(
						"Unresolved variables",
						`${result.missingVariables.map((name) => `{{${name}}}`).join(", ")} not found in the active environment.`,
					);
				}
			} catch (requestError) {
				setSnippetText("");
				toast.error("Snippet unavailable", requestError.message || "Unable to generate snippet.");
			} finally {
				setSnippetLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `toast` is stable from context; excluding it (and setState setters) keeps this from re-creating on unrelated renders.
		[activeRequest.draft, activeEnvironment],
	);

	const handleSaveCurrent = async () => {
		if (!collections.length && !activeRequest.draft.savedRequestId) {
			toast.info("Create a collection first", "Collections are required before you can save a request.");
			return;
		}

		if (activeRequest.draft.savedRequestId) {
			await runCollectionMutation(
				() =>
					collectionsApi.updateRequest(activeRequest.draft.savedRequestId, {
						auth: sanitizeAuth(activeRequest.draft.auth),
						body: sanitizeBody(activeRequest.draft.body),
						headers: sanitizeKeyValueList(activeRequest.draft.headers),
						method: activeRequest.draft.method,
						name: activeRequest.draft.name,
						params: sanitizeKeyValueList(activeRequest.draft.params),
						url: activeRequest.draft.url,
					}),
				"Request saved",
				activeRequest.draft.savedRequestId,
			);
			return;
		}

		setSaveDialogOpen(true);
	};

	useEffect(() => {
		const handleShortcut = (event) => {
			if (!(event.metaKey || event.ctrlKey)) {
				return;
			}

			if (event.key === "Enter") {
				event.preventDefault();
				handleSend();
			}

			if (event.key.toLowerCase() === "s") {
				event.preventDefault();
				handleSaveCurrent();
			}
		};

		window.addEventListener("keydown", handleShortcut);
		return () => window.removeEventListener("keydown", handleShortcut);
	}, [activeRequest, activeEnvironment?._id, collections.length]);

	const collectionActions = {
		createCollection: async (payload) =>
			runCollectionMutation(() => collectionsApi.createCollection(payload), "Collection created", null),
		updateCollection: async (id, payload) =>
			runCollectionMutation(() => collectionsApi.updateCollection(id, payload), "Collection updated"),
		deleteCollection: async (id) => {
			const reopen = activeRequest.draft.collectionId === id ? null : activeRequest.draft.savedRequestId;
			if (activeRequest.draft.collectionId === id) {
				setActiveRequest(createActiveDraft());
			}
			await runCollectionMutation(() => collectionsApi.deleteCollection(id), "Collection deleted", reopen);
		},
		duplicateCollection: async (id) =>
			runCollectionMutation(() => collectionsApi.duplicateCollection(id), "Collection duplicated", null),
		createFolder: async (collectionId, payload) =>
			runCollectionMutation(() => collectionsApi.createFolder(collectionId, payload), "Folder created"),
		updateFolder: async (id, payload) => runCollectionMutation(() => collectionsApi.updateFolder(id, payload), "Folder updated"),
		deleteFolder: async (id) => runCollectionMutation(() => collectionsApi.deleteFolder(id), "Folder deleted"),
		duplicateFolder: async (id) => runCollectionMutation(() => collectionsApi.duplicateFolder(id), "Folder duplicated"),
		createRequest: async (collectionId, payload) => {
			const created = await collectionsApi.createRequest(collectionId, {
				...payload,
				auth: sanitizeAuth(payload.auth || defaultAuth()),
				body: sanitizeBody(payload.body || { mode: "none", raw: "", formItems: [] }),
				headers: sanitizeKeyValueList(payload.headers || []),
				params: sanitizeKeyValueList(payload.params || []),
			});
			toast.success("Request created");
			await refreshCollections(created._id);
			return created;
		},
		updateRequest: async (id, payload) => runCollectionMutation(() => collectionsApi.updateRequest(id, payload), "Request updated", id),
		deleteRequest: async (id) => {
			const reopen = activeRequest.draft.savedRequestId === id ? null : activeRequest.draft.savedRequestId;
			if (activeRequest.draft.savedRequestId === id) {
				setActiveRequest(createActiveDraft());
			}
			await runCollectionMutation(() => collectionsApi.deleteRequest(id), "Request deleted", reopen);
		},
		duplicateRequest: async (id) => runCollectionMutation(() => collectionsApi.duplicateRequest(id), "Request duplicated"),
		reorderCollections: async (orderedIds) =>
			runCollectionMutation(() => collectionsApi.reorderCollections(orderedIds), "Collections reordered"),
		reorderFolders: async (collectionId, orderedIds) =>
			runCollectionMutation(() => collectionsApi.reorderFolders(collectionId, orderedIds), "Folders reordered"),
		reorderRequests: async (collectionId, folderId, orderedIds) =>
			runCollectionMutation(() => collectionsApi.reorderRequests(collectionId, folderId, orderedIds), "Requests reordered"),
	};

	const nextTheme = theme === "dark" ? "light" : "dark";

	return (
		<div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`.trim()}>
			<header className="app-header">
				<button
					aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
					className="icon-button header-menu-button"
					onClick={() => setSidebarOpen((current) => !current)}
					type="button"
				>
					<MaterialIcon name="menu" size={20} />
				</button>
				<div className="brand">
					<div aria-hidden="true" className="brand-badge">
						A
					</div>
					<strong>Anvil</strong>
				</div>
				<nav aria-label="Sidebar sections" className="workspace-nav">
					<button
						className={sidebarTab === "collections" ? "active" : ""}
						onClick={() => setSidebarTab("collections")}
						type="button"
					>
						Collections
					</button>
					<button className={sidebarTab === "history" ? "active" : ""} onClick={() => setSidebarTab("history")} type="button">
						History
					</button>
				</nav>
				<div className="header-spacer" />
				<EnvironmentSelector
					activeEnvironment={activeEnvironment}
					environments={environments}
					onActivate={async (environmentId) => {
						await environmentApi.activate(environmentId);
						toast.success("Environment activated");
						await refreshEnvironments();
					}}
					onManage={() => setEnvironmentManagerOpen(true)}
				/>
				<button
					aria-label={`Switch to ${nextTheme} theme`}
					className="icon-button header-utility-button"
					onClick={() => setTheme(applyTheme(nextTheme))}
					title={`Switch to ${nextTheme} theme`}
					type="button"
				>
					<MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} size={18} />
				</button>
				<div className="account-menu" data-account-menu>
					<button
						aria-expanded={accountMenuOpen}
						aria-haspopup="menu"
						aria-label="Open account menu"
						className="account-button"
						onClick={() => setAccountMenuOpen((current) => !current)}
						type="button"
					>
						<div className="profile-avatar">
							<span>{getInitials(user.name)}</span>
						</div>
					</button>
					{accountMenuOpen ? (
						<div className="floating-menu account-dropdown" role="menu">
							<div className="account-summary">
								<strong>{user.name}</strong>
								<span>{user.email}</span>
							</div>
							<button
								className="menu-item"
								onClick={async () => {
									setAccountMenuOpen(false);
									await logout();
								}}
								role="menuitem"
								type="button"
							>
								<MaterialIcon name="logout" size={16} /> Log out
							</button>
						</div>
					) : null}
				</div>
			</header>
			<aside className="workspace-sidebar">
				{sidebarTab === "collections" ? (
					<CollectionsPanel
						actions={collectionActions}
						collections={collections}
						loading={collectionsLoading}
						onOpenRequest={(requestId) => {
							openSavedRequest(requestId);
							closeSidebarIfMobile();
						}}
						selectedRequestId={activeRequest.draft.savedRequestId}
					/>
				) : null}
				{sidebarTab === "history" ? (
					<HistoryPanel
						collections={collections}
						onOpenEntry={(entry) => {
							const hydrated = hydrateSavedRequest(entry);
							setActiveRequest(
								createActiveDraft({
									auth: hydrated.auth,
									body: hydrated.body,
									headers: hydrated.headers,
									method: hydrated.method,
									name: hydrated.name,
									params: hydrated.params,
									url: hydrated.url,
								}),
							);
							setResponseState({
								elapsedMs: entry.timeMs || 0,
								loading: false,
								response: entry.ok
									? { ...entry.response, ok: true, resolvedUrl: entry.resolvedUrl, timeMs: entry.timeMs }
									: { error: entry.error, ok: false, resolvedUrl: entry.resolvedUrl, timeMs: entry.timeMs },
								startedAt: 0,
								tab: "body",
							});
							closeSidebarIfMobile();
						}}
						onRefreshCollections={async () => refreshCollections(activeRequest.draft.savedRequestId)}
						onResendEntry={(entry) => {
							const hydrated = hydrateSavedRequest(entry);
							handleSend(
								createBlankRequest({
									auth: hydrated.auth,
									body: hydrated.body,
									headers: hydrated.headers,
									method: hydrated.method,
									name: hydrated.name,
									params: hydrated.params,
									url: hydrated.url,
								}),
							);
						}}
						refreshKey={historyRefreshKey}
						toast={toast}
					/>
				) : null}
			</aside>
			{sidebarOpen && isMobileSidebar ? (
				<button aria-label="Close sidebar" className="sidebar-scrim" onClick={() => setSidebarOpen(false)} type="button" />
			) : null}
			<main className="workspace-main">
				<section className="workspace-pane builder-pane">
					<RequestBuilder
						draft={activeRequest.draft}
						hasUnsavedChanges={hasUnsavedChanges}
						onChange={(draft) => setActiveRequest((current) => ({ ...current, draft }))}
						onOpenSnippets={() => setSnippetOpen(true)}
						onSave={handleSaveCurrent}
						onSend={() => handleSend()}
						sending={responseState.loading}
					/>
				</section>
				<section className="workspace-pane response-pane-shell">
					<header className="response-pane-header">
						<div>
							<h2>Response</h2>
							<p>
								{responseState.loading
									? `Waiting for response… ${(responseState.elapsedMs / 1000).toFixed(1)} s elapsed`
									: responseState.response
										? "Inspect body and headers."
										: "Send a request to inspect the response."}
							</p>
						</div>
						<ResponseMeta response={responseState.response} />
					</header>
					<nav aria-label="Response sections" className="builder-tabs response-tabs">
						<button
							className={responseState.tab === "body" ? "active" : ""}
							onClick={() => setResponseState((current) => ({ ...current, tab: "body" }))}
							type="button"
						>
							Body
						</button>
						<button
							className={responseState.tab === "headers" ? "active" : ""}
							onClick={() => setResponseState((current) => ({ ...current, tab: "headers" }))}
							type="button"
						>
							Headers
						</button>
					</nav>
					{responseState.tab === "body" ? (
						<ResponseBody
							elapsedMs={responseState.elapsedMs}
							loading={responseState.loading}
							response={responseState.response}
						/>
					) : (
						<div className="response-panel">
							<ResponseHeaders headers={responseState.response?.headers || []} />
						</div>
					)}
				</section>
			</main>
			<EnvironmentManager
				environments={environments}
				onActivate={async (id) => {
					await environmentApi.activate(id);
					toast.success("Environment activated");
					await refreshEnvironments();
				}}
				onClose={() => setEnvironmentManagerOpen(false)}
				onCreate={async (payload) => {
					setEnvironmentSaving(true);
					try {
						const created = await environmentApi.create(payload);
						toast.success("Environment created");
						await refreshEnvironments();
						return created;
					} finally {
						setEnvironmentSaving(false);
					}
				}}
				onDelete={async (environment) => {
					if (!environment) {
						return;
					}
					setEnvironmentSaving(true);
					try {
						await environmentApi.remove(environment._id);
						toast.success("Environment deleted");
						await refreshEnvironments();
					} finally {
						setEnvironmentSaving(false);
					}
				}}
				onSave={async (id, payload) => {
					setEnvironmentSaving(true);
					try {
						await environmentApi.update(id, payload);
						toast.success("Environment saved");
						await refreshEnvironments();
					} finally {
						setEnvironmentSaving(false);
					}
				}}
				open={environmentManagerOpen}
				saving={environmentSaving}
			/>
			<Modal
				description="Save the current request to a collection."
				onClose={() => setSaveDialogOpen(false)}
				open={saveDialogOpen}
				title="Save request"
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
							<option value="">Select a collection</option>
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
							{(selectedCollection?.folders || []).map((folder) => (
								<option key={folder._id} value={folder._id}>
									{folder.name}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="modal-actions">
					<button className="button button-secondary" onClick={() => setSaveDialogOpen(false)} type="button">
						Cancel
					</button>
					<button
						className="button button-primary"
						disabled={!saveValues.collectionId || !saveValues.name.trim()}
						onClick={async () => {
							const created = await collectionsApi.createRequest(saveValues.collectionId, {
								auth: sanitizeAuth(activeRequest.draft.auth),
								body: sanitizeBody(activeRequest.draft.body),
								folderId: saveValues.folderId || null,
								headers: sanitizeKeyValueList(activeRequest.draft.headers),
								method: activeRequest.draft.method,
								name: saveValues.name.trim(),
								params: sanitizeKeyValueList(activeRequest.draft.params),
								url: activeRequest.draft.url,
							});
							toast.success("Request saved", "Added the draft to your collection.");
							setSaveDialogOpen(false);
							await refreshCollections(created._id);
						}}
						type="button"
					>
						Save request
					</button>
				</div>
			</Modal>
			<SnippetDialog
				loading={snippetLoading}
				onClose={() => setSnippetOpen(false)}
				onCopy={async (snippet) => {
					try {
						await navigator.clipboard.writeText(snippet);
						toast.success("Snippet copied");
					} catch {
						toast.error("Copy failed", "Clipboard access was not available.");
					}
				}}
				onLanguageChange={handleLanguageChange}
				open={snippetOpen}
				snippet={snippetText}
			/>
		</div>
	);
}

export default function App() {
	const { authenticating, booting, error, login, setError, user } = useAuth();

	if (booting) {
		return <AppBootScreen />;
	}

	if (!user) {
		return (
			<LoginPage
				authError={error}
				loading={authenticating}
				onSubmit={async (values) => {
					await login(values.email, values.password);
					setError("");
				}}
			/>
		);
	}

	return <WorkspaceShell user={user} />;
}
