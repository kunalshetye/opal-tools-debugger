import { browser } from '$app/environment';

const STORAGE_KEY = 'opal-debugger-theme';

type ThemeMode = 'light' | 'dark';

let mode: ThemeMode = $state('light');

export const themeState = {
	get mode() {
		return mode;
	}
};

function applyTheme(theme: ThemeMode) {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function initTheme() {
	if (!browser) return;

	const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
	if (stored === 'light' || stored === 'dark') {
		mode = stored;
	} else {
		mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	applyTheme(mode);
}

export function toggleTheme() {
	mode = mode === 'dark' ? 'light' : 'dark';
	applyTheme(mode);
	if (browser) {
		localStorage.setItem(STORAGE_KEY, mode);
	}
}
