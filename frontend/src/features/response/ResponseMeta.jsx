import { formatBytes, formatDuration } from "../../shared/utils/format.js";

function statusBucket(status) {
	if (!Number.isFinite(status)) {
		return "network";
	}

	const leadingDigit = Math.floor(status / 100);
	if (leadingDigit === 2) {
		return "success";
	}
	if (leadingDigit === 3) {
		return "neutral";
	}
	if (leadingDigit === 4) {
		return "warning";
	}
	if (leadingDigit === 5) {
		return "danger";
	}
	return "neutral";
}

export function ResponseMeta({ response }) {
	if (!response) {
		return null;
	}

	const summary = response.ok
		? `Response ${response.status} ${response.statusText}. Completed in ${formatDuration(response.timeMs)}. Size ${formatBytes(response.sizeBytes)}.`
		: `Network failure. Completed in ${formatDuration(response.timeMs)}.`;

	return (
		<div aria-atomic="true" aria-live="polite" className="response-meta" role="status">
			<span className="sr-only">{summary}</span>
			{response.ok ? (
				<span className={`status-pill status-${statusBucket(response.status)}`.trim()}>
					{response.status} {response.statusText}
				</span>
			) : (
				<span className="status-pill status-network">Network failure</span>
			)}
			<span>{formatDuration(response.timeMs)}</span>
			<span>{formatBytes(response.sizeBytes)}</span>
			<span className="truncate-text">{response.resolvedUrl}</span>
		</div>
	);
}
