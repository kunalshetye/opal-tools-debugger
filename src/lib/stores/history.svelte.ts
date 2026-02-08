import { browser } from '$app/environment';

const STORAGE_KEY = 'opal-debugger-history';
const MAX_ENTRIES = 10;

interface HistoryEntry {
	discoveryUrl: string;
	bearerToken: string;
	connectedAt: string;
}

function loadFromStorage(): HistoryEntry[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore parse errors
	}
	return [];
}

function saveToStorage(entries: HistoryEntry[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const historyState: HistoryEntry[] = $state(loadFromStorage());

export function addToHistory(discoveryUrl: string, bearerToken: string) {
	// Remove existing entry with same URL (case-insensitive)
	const filtered = historyState.filter(
		(e) => e.discoveryUrl.toLowerCase() !== discoveryUrl.toLowerCase()
	);

	// Prepend new entry
	const newEntry: HistoryEntry = {
		discoveryUrl,
		bearerToken,
		connectedAt: new Date().toISOString()
	};
	filtered.unshift(newEntry);

	// Trim to max
	const trimmed = filtered.slice(0, MAX_ENTRIES);

	// Replace state contents
	historyState.length = 0;
	historyState.push(...trimmed);
	saveToStorage(historyState);
}

export function removeFromHistory(index: number) {
	historyState.splice(index, 1);
	saveToStorage(historyState);
}
