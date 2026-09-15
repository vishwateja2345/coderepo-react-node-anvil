import { useEffect, useState } from "react";
import { Modal } from "../../shared/components/Modal.jsx";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";
import { SNIPPET_LANGUAGES } from "../../shared/utils/request.js";

export function SnippetDialog({ loading, onClose, onCopy, onLanguageChange, open, snippet }) {
	const [activeLanguage, setActiveLanguage] = useState(SNIPPET_LANGUAGES[0].value);

	useEffect(() => {
		if (open) {
			onLanguageChange(activeLanguage);
		}
	}, [activeLanguage, onLanguageChange, open]);

	return (
		<Modal description="Generate code snippets without executing the request." onClose={onClose} open={open} title="Code snippets">
			<div className="snippet-dialog">
				<div className="segmented-control" role="tablist" aria-label="Snippet language">
					{SNIPPET_LANGUAGES.map((language) => (
						<button
							aria-selected={activeLanguage === language.value}
							className={activeLanguage === language.value ? "active" : ""}
							key={language.value}
							onClick={() => setActiveLanguage(language.value)}
							role="tab"
							type="button"
						>
							{language.label}
						</button>
					))}
				</div>
				<div className="snippet-panel">
					{loading ? (
						<div className="loading-panel" role="status">
							Generating snippet…
						</div>
					) : snippet ? (
						<pre>{snippet}</pre>
					) : (
						<div className="loading-panel" role="status">
							Enter a request URL, then reopen this dialog to generate a snippet.
						</div>
					)}
				</div>
				<div className="modal-actions">
					<button className="button button-secondary" onClick={onClose} type="button">
						Close
					</button>
					<button className="button button-primary" disabled={!snippet} onClick={() => onCopy(snippet)} type="button">
						<MaterialIcon name="copy" size={18} /> Copy
					</button>
				</div>
			</div>
		</Modal>
	);
}
