const THEME_KEY = "anvil-theme";
const THEMES = ["dark", "light"];

export function readTheme() {
	const storedTheme = localStorage.getItem(THEME_KEY);
	if (THEMES.includes(storedTheme)) {
		return storedTheme;
	}

	if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
		return "light";
	}

	return "dark";
}

export function applyTheme(theme) {
	const nextTheme = THEMES.includes(theme) ? theme : "dark";
	document.documentElement.dataset.theme = nextTheme === "light" ? "light" : "dark";
	localStorage.setItem(THEME_KEY, nextTheme);
	return nextTheme;
}
