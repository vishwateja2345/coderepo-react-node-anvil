export function ResponseHeaders({ headers = [] }) {
	if (!headers.length) {
		return <div className="subtle-empty">No response headers were returned.</div>;
	}

	return (
		<div className="response-headers">
			<div className="response-table-header">
				<span>Header</span>
				<span>Value</span>
			</div>
			{headers.map((header, index) => (
				<div className="response-table-row" key={`${header.key}-${index}`}>
					<span>{header.key}</span>
					<code>{header.value}</code>
				</div>
			))}
		</div>
	);
}
