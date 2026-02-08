import { browser } from '$app/environment';
import type { LogLevel, LogCategory, LogEntry } from '$lib/types';

const STORAGE_KEY = 'opal-debugger-activity-log';
const MAX_ENTRIES = 500;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;

interface PanelPrefs {
	panelHeight: number;
}

function loadPrefs(): PanelPrefs {
	if (!browser) return { panelHeight: 250 };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}
	return { panelHeight: 250 };
}

function savePrefs(prefs: PanelPrefs) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const initialPrefs = loadPrefs();

let entries: LogEntry[] = $state([]);
let panelOpen: boolean = $state(false);
let panelHeight: number = $state(initialPrefs.panelHeight);
let autoScroll: boolean = $state(true);
let filterLevel: LogLevel | 'all' = $state('all');
let filterCategory: LogCategory | 'all' = $state('all');

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addEntry(level: LogLevel, category: LogCategory, message: string, details?: unknown) {
	const entry: LogEntry = {
		id: generateId(),
		timestamp: Date.now(),
		level,
		category,
		message,
		details
	};
	entries = [entry, ...entries.slice(0, MAX_ENTRIES - 1)];
}

export const activityLogState = {
	get entries() { return entries; },
	get panelOpen() { return panelOpen; },
	get panelHeight() { return panelHeight; },
	get autoScroll() { return autoScroll; },
	get filterLevel() { return filterLevel; },
	get filterCategory() { return filterCategory; }
};

export function logInfo(category: LogCategory, message: string, details?: unknown) {
	addEntry('info', category, message, details);
}

export function logSuccess(category: LogCategory, message: string, details?: unknown) {
	addEntry('success', category, message, details);
}

export function logWarning(category: LogCategory, message: string, details?: unknown) {
	addEntry('warning', category, message, details);
}

export function logError(category: LogCategory, message: string, details?: unknown) {
	addEntry('error', category, message, details);
}

export function clearLog() {
	entries = [];
}

export function togglePanel() {
	panelOpen = !panelOpen;
}

export function openPanel() {
	panelOpen = true;
}

export function closePanel() {
	panelOpen = false;
}

export function setPanelHeight(px: number) {
	panelHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, px));
	savePrefs({ panelHeight });
}

export function toggleAutoScroll() {
	autoScroll = !autoScroll;
}

export function setAutoScroll(value: boolean) {
	autoScroll = value;
}

export function setFilterLevel(level: LogLevel | 'all') {
	filterLevel = level;
}

export function setFilterCategory(category: LogCategory | 'all') {
	filterCategory = category;
}

export function getFilteredEntries(): LogEntry[] {
	let filtered = entries;
	if (filterLevel !== 'all') {
		filtered = filtered.filter((e) => e.level === filterLevel);
	}
	if (filterCategory !== 'all') {
		filtered = filtered.filter((e) => e.category === filterCategory);
	}
	return filtered;
}
