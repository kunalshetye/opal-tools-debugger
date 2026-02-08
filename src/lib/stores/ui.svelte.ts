import { browser } from '$app/environment';
import type { ToolExecutionResult } from '$lib/types';
import { connectionState } from './connection.svelte';

const STORAGE_KEY_PREFIX = 'opal-debugger-history-';
const MAX_RESULTS_PER_TOOL = 10;

function hashString(str: string): string {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
	}
	return (hash >>> 0).toString(36);
}

function storageKey(toolName: string): string {
	const url = connectionState.discoveryUrl;
	if (url) {
		return `${STORAGE_KEY_PREFIX}${hashString(url)}-${toolName}`;
	}
	return `${STORAGE_KEY_PREFIX}${toolName}`;
}

interface UIState {
	selectedToolName: string | null;
	searchQuery: string;
	sidebarOpen: boolean;
	results: Record<string, ToolExecutionResult[]>;
}

export const uiState: UIState = $state({
	selectedToolName: null,
	searchQuery: '',
	sidebarOpen: false,
	results: {}
});

function loadResultsForTool(toolName: string): ToolExecutionResult[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(storageKey(toolName));
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}
	return [];
}

function saveResultsForTool(toolName: string, results: ToolExecutionResult[]) {
	if (!browser) return;
	localStorage.setItem(
		storageKey(toolName),
		JSON.stringify(results.slice(0, MAX_RESULTS_PER_TOOL))
	);
}

export function selectTool(toolName: string) {
	uiState.selectedToolName = toolName;
	uiState.sidebarOpen = false;
	// Lazy-load history from localStorage
	if (!(toolName in uiState.results)) {
		uiState.results[toolName] = loadResultsForTool(toolName);
	}
}

export function clearSelection() {
	uiState.selectedToolName = null;
}

export function getResultsForTool(toolName: string): ToolExecutionResult[] {
	return uiState.results[toolName] ?? [];
}

export function addResultForTool(toolName: string, result: ToolExecutionResult) {
	const existing = uiState.results[toolName] ?? [];
	const updated = [result, ...existing.slice(0, MAX_RESULTS_PER_TOOL - 1)];
	uiState.results[toolName] = updated;
	saveResultsForTool(toolName, updated);
}

export function clearResultsForTool(toolName: string) {
	uiState.results[toolName] = [];
	if (browser) {
		localStorage.removeItem(storageKey(toolName));
	}
}

export function clearAllResults() {
	uiState.results = {};
	if (!browser) return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_KEY_PREFIX)) {
			keysToRemove.push(key);
		}
	}
	for (const key of keysToRemove) {
		localStorage.removeItem(key);
	}
}

export function toggleSidebar() {
	uiState.sidebarOpen = !uiState.sidebarOpen;
}

export function closeSidebar() {
	uiState.sidebarOpen = false;
}
