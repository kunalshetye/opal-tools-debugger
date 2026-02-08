import { browser } from '$app/environment';

const STORAGE_KEY = 'opal-debugger-favorites';

interface FavoritesData {
	[discoveryUrl: string]: string[];
}

function loadFromStorage(): FavoritesData {
	if (!browser) return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}
	return {};
}

function saveToStorage(data: FavoritesData) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data: FavoritesData = $state(loadFromStorage());

export const favoritesState = {
	isFavorite(discoveryUrl: string, toolName: string): boolean {
		return data[discoveryUrl]?.includes(toolName) ?? false;
	},
	getFavorites(discoveryUrl: string): string[] {
		return data[discoveryUrl] ?? [];
	}
};

export function toggleFavorite(discoveryUrl: string, toolName: string) {
	const current = data[discoveryUrl] ?? [];
	if (current.includes(toolName)) {
		data[discoveryUrl] = current.filter((n) => n !== toolName);
	} else {
		data[discoveryUrl] = [...current, toolName];
	}
	data = { ...data };
	saveToStorage(data);
}
