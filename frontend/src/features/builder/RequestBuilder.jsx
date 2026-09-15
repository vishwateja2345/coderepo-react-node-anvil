import { useMemo, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { methodToClass } from "../../shared/utils/format.js";
import { HTTP_METHODS } from "../../shared/utils/request.js";
import { AuthEditor } from "./AuthEditor.jsx";
import { BodyEditor } from "./BodyEditor.jsx";
import { HeadersEditor } from "./HeadersEditor.jsx";
import { ParamsEditor } from "./ParamsEditor.jsx";

const TABS = [
	{ value: "params", label: "Params" },
	{ value: "headers", label: "Headers" },
	{ value: "body", label: "Body" },
	{ value: "auth", label: "Auth" },
];

function HighlightedUrl({ value }) {
	const content = useMemo(() => {
		const pieces = String(value || "").split(/(\{\{[^}]+\}\})/g);
		return pieces.map((piece, index) =>
			piece.startsWith("{{") && piece.endsWith("}}") ? (
				<mark key={`${piece}-${index}`}>{piece}</mark>
			) : (
				<span key={`${piece}-${index}`}>{piece}</span>
			),
		);
	}, [value]);

	return (
		<div aria-hidden="true" className="url-highlight">
			{content.length ? content : <span className="placeholder">{"https://api.example.com/users/{{user_id}}"}</span>}
		</div>
	);
}

export function RequestBuilder({ draft, hasUnsavedChanges, onChange, onOpenSnippets, onSave, onSend, sending }) {
	const [activeTab, setActiveTab] = useState("params");

	const renderTab = () => {
		if (activeTab === "params") {
			return <ParamsEditor onChange={(params) => onChange({ ...draft, params })} rows={draft.params} />;
		}
		if (activeTab === "headers") {
			return <HeadersEditor onChange={(headers) => onChange({ ...draft, headers })} rows={draft.headers} />;
		}
		if (activeTab === "body") {
			return <BodyEditor body={draft.body} onChange={(body) => onChange({ ...draft, body })} />;
		}
		return (
			<AuthEditor
				auth={draft.auth}
				onChange={(auth) => onChange({ ...draft, auth })}
				resolvedCollectionAuthLabel={draft.resolvedCollectionAuthLabel}
			/>
		);
	};

	return (
		<section className="builder-panel">
			<header className="builder-topbar">
				<div className="builder-title-block">
					<div>
						<h2>{draft.name || "Untitled request"}</h2>
						<p>{hasUnsavedChanges ? "Unsaved changes" : draft.savedRequestId ? "Saved request" : "Draft request"}</p>
					</div>
					{hasUnsavedChanges ? <span className="dirty-dot" aria-label="Unsaved changes" /> : null}
				</div>
				<div className="builder-actions">
					<button className="button button-secondary" onClick={onOpenSnippets} type="button">
						<MaterialIcon name="code" size={18} /> Snippets
					</button>
					<button className="button button-secondary" onClick={onSave} title="Save (Ctrl/Cmd+S)" type="button">
						<MaterialIcon name="save" size={18} /> Save
					</button>
					<button
						className="button button-primary"
						disabled={sending}
						onClick={onSend}
						title="Send (Ctrl/Cmd+Enter)"
						type="button"
					>
						<MaterialIcon name="send" size={18} /> {sending ? "Sending..." : "Send"}
					</button>
				</div>
			</header>
			<div className="request-url-row">
				<label className={`method-select method-${methodToClass(draft.method)}`.trim()}>
					<span className="sr-only">HTTP method</span>
					<select onChange={(event) => onChange({ ...draft, method: event.target.value })} value={draft.method}>
						{HTTP_METHODS.map((method) => (
							<option key={method} value={method}>
								{method}
							</option>
						))}
					</select>
				</label>
				<label className="url-field">
					<span className="sr-only">Request URL</span>
					<HighlightedUrl value={draft.url} />
					<input
						onChange={(event) => onChange({ ...draft, url: event.target.value })}
						placeholder="https://api.example.com/users/{{user_id}}"
						spellCheck="false"
						type="text"
						value={draft.url}
					/>
				</label>
			</div>
			<nav className="builder-tabs" aria-label="Request sections">
				{TABS.map((tab) => (
					<button
						aria-current={activeTab === tab.value ? "page" : undefined}
						className={activeTab === tab.value ? "active" : ""}
						key={tab.value}
						onClick={() => setActiveTab(tab.value)}
						type="button"
					>
						{tab.label}
					</button>
				))}
			</nav>
			<div className="builder-content">{renderTab()}</div>
		</section>
	);
}
