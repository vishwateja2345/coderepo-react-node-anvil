import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../shared/components/EmptyState.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { escapeRegExp, isJsonContent, nodeContainsQuery, parseJsonSafely, primitiveToString } from "../../shared/utils/json-view.js";

function countOccurrences(text, query) {
	if (!query) {
		return 0;
	}

	const matches = String(text).match(new RegExp(escapeRegExp(query), "ig"));
	return matches?.length || 0;
}

function countJsonMatches(value, query, label = "") {
	if (!query) {
		return 0;
	}

	let total = countOccurrences(label, query);
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			total += countJsonMatches(item, query, String(index));
		});
		return total;
	}

	if (value && typeof value === "object") {
		Object.entries(value).forEach(([key, nestedValue]) => {
			total += countJsonMatches(nestedValue, query, key);
		});
		return total;
	}

	return total + countOccurrences(primitiveToString(value), query);
}

function collectCollapsiblePaths(value, path = "root") {
	if (!value || typeof value !== "object") {
		return [];
	}

	const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
	let paths = [];
	entries.forEach(([key, nestedValue]) => {
		if (nestedValue && typeof nestedValue === "object") {
			const nestedPath = `${path}.${key}`;
			paths.push(nestedPath);
			paths = paths.concat(collectCollapsiblePaths(nestedValue, nestedPath));
		}
	});
	return paths;
}

function defaultCollapsedPaths(value, depth = 0, path = "root") {
	if (!value || typeof value !== "object") {
		return [];
	}

	const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
	let paths = [];
	entries.forEach(([key, nestedValue]) => {
		if (nestedValue && typeof nestedValue === "object") {
			const nestedPath = `${path}.${key}`;
			if (depth >= 0) {
				paths.push(nestedPath);
			}
			paths = paths.concat(defaultCollapsedPaths(nestedValue, depth + 1, nestedPath));
		}
	});
	return paths;
}

function HighlightedText({ query, text, tracker }) {
	if (!query) {
		return <>{text}</>;
	}

	const input = String(text);
	const regex = new RegExp(escapeRegExp(query), "ig");
	const parts = [];
	let lastIndex = 0;
	let match = regex.exec(input);

	while (match) {
		if (match.index > lastIndex) {
			parts.push(<span key={`text-${lastIndex}`}>{input.slice(lastIndex, match.index)}</span>);
		}
		const matchIndex = tracker.nextIndex;
		tracker.nextIndex += 1;
		parts.push(
			<mark
				className={matchIndex === tracker.activeIndex ? "match-active" : "match-passive"}
				key={`match-${match.index}-${matchIndex}`}
			>
				{match[0]}
			</mark>,
		);
		lastIndex = match.index + match[0].length;
		match = regex.exec(input);
	}

	if (lastIndex < input.length) {
		parts.push(<span key={`tail-${lastIndex}`}>{input.slice(lastIndex)}</span>);
	}

	return <>{parts}</>;
}

function JsonNode({ collapsedPaths, name, onToggle, path, query, tracker, value }) {
	const isObject = value && typeof value === "object";
	const matches = nodeContainsQuery(value, query, name);
	if (!matches) {
		return null;
	}

	if (!isObject) {
		return (
			<div className="json-node json-leaf">
				<span className="json-key">
					<HighlightedText query={query} text={name} tracker={tracker} />
				</span>
				<span className="json-colon">: </span>
				<span className="json-value">
					<HighlightedText query={query} text={primitiveToString(value)} tracker={tracker} />
				</span>
			</div>
		);
	}

	const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
	const collapsed = query ? false : collapsedPaths.has(path);
	return (
		<div className="json-node">
			<button className="json-toggle" onClick={() => onToggle(path)} type="button">
				<span className="json-toggle-main">
					<MaterialIcon name={collapsed ? "chevron_right" : "chevron_down"} size={16} />
					<span className="json-key">
						<HighlightedText query={query} text={name} tracker={tracker} />
					</span>
					<span className="json-colon">: </span>
					<span className="json-bracket">{Array.isArray(value) ? "[" : "{"}</span>
				</span>
				<span className="json-toggle-meta">
					<span className="json-size-badge">{entries.length}</span>
					{collapsed ? <span className="json-preview">{Array.isArray(value) ? "]" : "}"}</span> : null}
				</span>
			</button>
			{collapsed ? null : (
				<div className="json-children">
					{entries.map(([key, nestedValue]) => (
						<JsonNode
							collapsedPaths={collapsedPaths}
							key={`${path}.${key}`}
							name={key}
							onToggle={onToggle}
							path={`${path}.${key}`}
							query={query}
							tracker={tracker}
							value={nestedValue}
						/>
					))}
					<div className="json-closing">{Array.isArray(value) ? "]" : "}"}</div>
				</div>
			)}
		</div>
	);
}

export function ResponseBody({ elapsedMs = 0, loading, response }) {
	const [queryInput, setQueryInput] = useState("");
	const [query, setQuery] = useState("");
	const [rawMode, setRawMode] = useState(false);
	const [collapsedPaths, setCollapsedPaths] = useState(() => new Set());
	const [activeMatchIndex, setActiveMatchIndex] = useState(0);

	const parsed = useMemo(() => {
		if (!response?.body) {
			return { value: null, error: "" };
		}
		return parseJsonSafely(response.body);
	}, [response?.body]);

	const showJson = Boolean(response?.ok && !rawMode && (isJsonContent(response.headers) || parsed.value !== null));
	const allCollapsiblePaths = useMemo(() => (parsed.value ? collectCollapsiblePaths(parsed.value) : []), [parsed.value]);
	const defaultCollapsed = useMemo(() => (parsed.value ? defaultCollapsedPaths(parsed.value) : []), [parsed.value]);
	const totalMatches = useMemo(() => {
		if (!query) {
			return 0;
		}
		if (showJson && parsed.value !== null) {
			return countJsonMatches(parsed.value, query, "root");
		}
		return countOccurrences(response?.body || "", query);
	}, [parsed.value, query, response?.body, showJson]);
	const tracker = { activeIndex: activeMatchIndex, nextIndex: 0 };

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setQuery(queryInput.trim());
		}, 250);
		return () => window.clearTimeout(timeoutId);
	}, [queryInput]);

	useEffect(() => {
		setCollapsedPaths(new Set(defaultCollapsed));
		setQueryInput("");
		setQuery("");
		setRawMode(false);
		setActiveMatchIndex(0);
	}, [defaultCollapsed, response?.body, response?.resolvedUrl]);

	useEffect(() => {
		if (!totalMatches) {
			setActiveMatchIndex(0);
			return;
		}
		setActiveMatchIndex((current) => (current >= totalMatches ? 0 : current));
	}, [totalMatches]);

	const stepMatch = (direction) => {
		if (!totalMatches) {
			return;
		}
		setActiveMatchIndex((current) => (current + direction + totalMatches) % totalMatches);
	};

	if (loading) {
		return (
			<div className="response-panel loading-panel loading-response-panel" role="status">
				<div className="send-progress-indicator">
					<div className="send-progress-spinner" aria-hidden="true" />
					<div>
						<strong>Sending request…</strong>
						<p>{(elapsedMs / 1000).toFixed(1)} s elapsed</p>
					</div>
				</div>
			</div>
		);
	}

	if (!response) {
		return (
			<EmptyState
				actionLabel="Send a request"
				icon="send"
				message="Compose a request in the builder, then inspect the response body and headers here."
				title="No response yet"
			/>
		);
	}

	if (!response.ok) {
		return (
			<div className="response-panel error-state network-failure-panel" role="alert">
				<div className="status-pill status-network">Network failure</div>
				<h3>Request failed before a response was received</h3>
				<p>{response.error?.message || "The network request did not complete."}</p>
			</div>
		);
	}

	return (
		<div className="response-panel">
			<div className="response-toolbar">
				<label className="search-input slim-search">
					<MaterialIcon name="search" size={18} />
					<input
						aria-label="Search response body"
						onChange={(event) => setQueryInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								if (queryInput.trim() !== query) {
									setQuery(queryInput.trim());
									setActiveMatchIndex(0);
									return;
								}
								stepMatch(event.shiftKey ? -1 : 1);
							}
						}}
						placeholder="Search body"
						type="search"
						value={queryInput}
					/>
				</label>
				<div className="response-toolbar-actions">
					<span className="match-counter" role="status">
						{query ? (totalMatches ? `${activeMatchIndex + 1} / ${totalMatches}` : "0 results") : ""}
					</span>
					{showJson ? (
						<>
							<button
								className="button button-secondary button-small"
								onClick={() => setCollapsedPaths(new Set())}
								type="button"
							>
								Expand all
							</button>
							<button
								className="button button-secondary button-small"
								onClick={() => setCollapsedPaths(new Set(allCollapsiblePaths))}
								type="button"
							>
								Collapse all
							</button>
						</>
					) : null}
					<label className="toggle-row">
						<input checked={rawMode} onChange={(event) => setRawMode(event.target.checked)} type="checkbox" /> Raw
					</label>
				</div>
			</div>
			{showJson && parsed.value !== null ? (
				<div className="json-viewer">
					<JsonNode
						collapsedPaths={collapsedPaths}
						name="root"
						onToggle={(path) =>
							setCollapsedPaths((current) => {
								const next = new Set(current);
								if (next.has(path)) {
									next.delete(path);
								} else {
									next.add(path);
								}
								return next;
							})
						}
						path="root"
						query={query}
						tracker={tracker}
						value={parsed.value}
					/>
				</div>
			) : (
				<pre className="response-text">
					<HighlightedText query={query} text={response.body || ""} tracker={tracker} />
				</pre>
			)}
			{response.bodyTruncated ? (
				<div className="banner banner-warning" role="status">
					The response body was truncated by the backend.
				</div>
			) : null}
		</div>
	);
}
