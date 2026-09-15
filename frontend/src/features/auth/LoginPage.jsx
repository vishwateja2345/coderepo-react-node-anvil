import { useMemo, useState } from "react";
import { MaterialIcon } from "../../shared/components/MaterialIcon.jsx";

function validate(values) {
	const errors = {};
	if (!values.email.trim()) {
		errors.email = "Email is required.";
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
		errors.email = "Enter a valid email address.";
	}

	if (!values.password) {
		errors.password = "Password is required.";
	}

	return errors;
}

export function LoginPage({ authError, loading, onSubmit }) {
	const [values, setValues] = useState({ email: "", password: "" });
	const [touched, setTouched] = useState({});
	const errors = useMemo(() => validate(values), [values]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setTouched({ email: true, password: true });
		if (Object.keys(errors).length) {
			return;
		}

		try {
			await onSubmit(values);
		} catch {
			// Error state is surfaced by the auth context.
		}
	};

	const updateField = (field, nextValue) => {
		setValues((current) => ({ ...current, [field]: nextValue }));
	};

	return (
		<main className="login-page">
			<section className="login-hero">
				<div className="login-identity-block">
					<div aria-hidden="true" className="brand-badge brand-badge-large">
						A
					</div>
					<div>
						<p className="eyebrow">Anvil</p>
						<h1>API workbench for fast request/response loops.</h1>
						<p className="login-copy">
							Build requests, switch environments, review history, and save reusable calls without leaving one focused
							workspace.
						</p>
					</div>
				</div>
				<ul aria-label="Core capabilities" className="feature-checklist">
					<li>
						<MaterialIcon name="send" size={18} /> Send and replay HTTP requests
					</li>
					<li>
						<MaterialIcon name="layers" size={18} /> Organize collections and folders
					</li>
					<li>
						<MaterialIcon name="globe" size={18} /> Switch environments instantly
					</li>
					<li>
						<MaterialIcon name="code" size={18} /> Generate snippets for popular clients
					</li>
				</ul>
			</section>
			<section className="login-card-section">
				<form className="login-card" noValidate onSubmit={handleSubmit}>
					<div>
						<p className="eyebrow">Sign in</p>
						<h2>Continue to Anvil</h2>
					</div>
					{authError ? (
						<div className="banner banner-error" role="alert">
							{authError}
						</div>
					) : null}
					<label className="field">
						<span>Email</span>
						<input
							aria-invalid={Boolean(touched.email && errors.email)}
							autoComplete="email"
							autoFocus
							name="email"
							onBlur={() => setTouched((current) => ({ ...current, email: true }))}
							onChange={(event) => updateField("email", event.target.value)}
							placeholder="you@example.com"
							type="email"
							value={values.email}
						/>
						{touched.email && errors.email ? <small className="field-error">{errors.email}</small> : null}
					</label>
					<label className="field">
						<span>Password</span>
						<input
							aria-invalid={Boolean(touched.password && errors.password)}
							autoComplete="current-password"
							name="password"
							onBlur={() => setTouched((current) => ({ ...current, password: true }))}
							onChange={(event) => updateField("password", event.target.value)}
							placeholder="Enter your password"
							type="password"
							value={values.password}
						/>
						{touched.password && errors.password ? <small className="field-error">{errors.password}</small> : null}
					</label>
					<button className="button button-primary button-block" disabled={loading} type="submit">
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</section>
		</main>
	);
}
