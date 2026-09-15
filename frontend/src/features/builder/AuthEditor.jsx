import { AUTH_TYPE_OPTIONS } from "../../shared/utils/request.js";

export function AuthEditor({ auth, onChange, resolvedCollectionAuthLabel }) {
	const authEnabled = auth.type !== "none";
	const defaultType =
		auth.metaLastType && auth.metaLastType !== "none" ? auth.metaLastType : resolvedCollectionAuthLabel ? "inherit" : "bearer";
	const options = resolvedCollectionAuthLabel ? AUTH_TYPE_OPTIONS : AUTH_TYPE_OPTIONS.filter((option) => option.value !== "inherit");

	const toggleEnabled = (enabled) => {
		if (!enabled) {
			onChange({
				...auth,
				metaLastType: auth.type !== "none" ? auth.type : defaultType,
				type: "none",
			});
			return;
		}

		onChange({
			...auth,
			metaLastType: defaultType,
			type: defaultType,
		});
	};

	const changeType = (type) => {
		onChange({
			...auth,
			metaLastType: type !== "none" ? type : auth.metaLastType,
			type,
		});
	};

	return (
		<section className="editor-section table-card">
			<div className="table-card-header">
				<h3>Authorization</h3>
			</div>
			<div className="auth-toolbar">
				<label className="toggle-row auth-toggle-row">
					<input checked={authEnabled} onChange={(event) => toggleEnabled(event.target.checked)} type="checkbox" />
					<span>Enable authorization</span>
				</label>
				{auth.type === "inherit" && resolvedCollectionAuthLabel ? (
					<span className="auth-inline-summary">
						Auth inherited from collection: <strong>{resolvedCollectionAuthLabel}</strong>
					</span>
				) : null}
			</div>
			<label className="field">
				<span>Type</span>
				<select disabled={!authEnabled} onChange={(event) => changeType(event.target.value)} value={auth.type}>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</label>
			{!authEnabled ? (
				<div className="banner banner-info" role="status">
					Authorization is disabled for this request.
				</div>
			) : null}
			{auth.type === "inherit" && resolvedCollectionAuthLabel ? (
				<div className="banner banner-info" role="status">
					This request will send <strong>{resolvedCollectionAuthLabel}</strong> from the parent collection.
				</div>
			) : null}
			{auth.type === "bearer" ? (
				<label className="field">
					<span>Bearer token</span>
					<input
						onChange={(event) => onChange({ ...auth, bearerToken: event.target.value })}
						placeholder="Paste a bearer token"
						type="text"
						value={auth.bearerToken}
					/>
				</label>
			) : null}
			{auth.type === "basic" ? (
				<div className="form-grid two-columns">
					<label className="field">
						<span>Username</span>
						<input
							onChange={(event) => onChange({ ...auth, basicUsername: event.target.value })}
							type="text"
							value={auth.basicUsername}
						/>
					</label>
					<label className="field">
						<span>Password</span>
						<input
							onChange={(event) => onChange({ ...auth, basicPassword: event.target.value })}
							type="password"
							value={auth.basicPassword}
						/>
					</label>
				</div>
			) : null}
			{auth.type === "apiKey" ? (
				<div className="form-grid three-columns">
					<label className="field">
						<span>Key</span>
						<input
							onChange={(event) => onChange({ ...auth, apiKeyKey: event.target.value })}
							type="text"
							value={auth.apiKeyKey}
						/>
					</label>
					<label className="field">
						<span>Value</span>
						<input
							onChange={(event) => onChange({ ...auth, apiKeyValue: event.target.value })}
							type="text"
							value={auth.apiKeyValue}
						/>
					</label>
					<label className="field">
						<span>Location</span>
						<select onChange={(event) => onChange({ ...auth, apiKeyLocation: event.target.value })} value={auth.apiKeyLocation}>
							<option value="header">Header</option>
							<option value="query">Query</option>
						</select>
					</label>
				</div>
			) : null}
			{authEnabled && auth.type === "none" ? (
				<div className="banner banner-info" role="status">
					No authorization will be sent.
				</div>
			) : null}
		</section>
	);
}
