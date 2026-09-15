import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../features/auth/auth.api.js";
import { clearSessionToken, hasSessionToken, setSessionToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [booting, setBooting] = useState(true);
	const [authenticating, setAuthenticating] = useState(false);
	const [error, setError] = useState("");

	const forceLogout = useCallback((message = "Your Anvil session has expired.") => {
		clearSessionToken();
		setUser(null);
		setError(message);
	}, []);

	useEffect(() => {
		const handleExpired = (event) => {
			forceLogout(event.detail || "Your Anvil session has expired.");
		};

		window.addEventListener("anvil-session-expired", handleExpired);
		return () => window.removeEventListener("anvil-session-expired", handleExpired);
	}, [forceLogout]);

	useEffect(() => {
		let active = true;

		const restore = async () => {
			if (!hasSessionToken()) {
				setBooting(false);
				return;
			}

			try {
				const session = await authApi.session();
				if (!active) {
					return;
				}
				setUser(session.user);
				setError("");
			} catch (requestError) {
				if (!active) {
					return;
				}
				forceLogout(requestError.message || "Your Anvil session has expired.");
			} finally {
				if (active) {
					setBooting(false);
				}
			}
		};

		restore();
		return () => {
			active = false;
		};
	}, [forceLogout]);

	const login = useCallback(async (email, password) => {
		setAuthenticating(true);
		setError("");
		try {
			const result = await authApi.login(email, password);
			setSessionToken(result.token);
			setUser(result.user);
			return result.user;
		} catch (requestError) {
			setError(requestError.message || "Unable to sign in.");
			throw requestError;
		} finally {
			setAuthenticating(false);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			if (hasSessionToken()) {
				await authApi.logout();
			}
		} catch {
			// Ignore logout failures when clearing a local session.
		} finally {
			clearSessionToken();
			setUser(null);
		}
	}, []);

	const value = useMemo(
		() => ({ authenticating, booting, error, forceLogout, login, logout, setError, user }),
		[authenticating, booting, error, forceLogout, login, logout, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
