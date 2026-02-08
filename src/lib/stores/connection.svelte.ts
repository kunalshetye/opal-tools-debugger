import { browser } from '$app/environment';
import { addToHistory } from './history.svelte';

const STORAGE_KEY = 'opal-debugger-connection';

interface ConnectionState {
	discoveryUrl: string;
	bearerToken: string;
	baseUrl: string;
	connected: boolean;
}

function loadFromStorage(): ConnectionState {
	if (!browser) return { discoveryUrl: '', bearerToken: '', baseUrl: '', connected: false };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore parse errors
	}
	return { discoveryUrl: '', bearerToken: '', baseUrl: '', connected: false };
}

function saveToStorage(state: ConnectionState) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deriveBaseUrl(discoveryUrl: string): string {
	try {
		const url = new URL(discoveryUrl);
		// Strip the pathname (e.g., /discovery) to get the base
		return `${url.origin}`;
	} catch {
		return '';
	}
}

const initial = loadFromStorage();

export const connectionState: ConnectionState = $state(initial);

export function connect(discoveryUrl: string, bearerToken: string) {
	connectionState.discoveryUrl = discoveryUrl;
	connectionState.bearerToken = bearerToken;
	connectionState.baseUrl = deriveBaseUrl(discoveryUrl);
	connectionState.connected = true;
	saveToStorage(connectionState);
	addToHistory(discoveryUrl, bearerToken);
}

export function disconnect() {
	connectionState.discoveryUrl = '';
	connectionState.bearerToken = '';
	connectionState.baseUrl = '';
	connectionState.connected = false;
	saveToStorage(connectionState);
}

export function updateFromConfig(discoveryUrl: string, bearerToken: string) {
	if (discoveryUrl && !connectionState.discoveryUrl) {
		connectionState.discoveryUrl = discoveryUrl;
		connectionState.baseUrl = deriveBaseUrl(discoveryUrl);
	}
	if (bearerToken && !connectionState.bearerToken) {
		connectionState.bearerToken = bearerToken;
	}
}
