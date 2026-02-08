import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));

import {
	activityLogState,
	logInfo,
	logSuccess,
	logWarning,
	logError,
	clearLog,
	togglePanel,
	openPanel,
	closePanel,
	setPanelHeight,
	toggleAutoScroll,
	setAutoScroll,
	setFilterLevel,
	setFilterCategory,
	setSearchQuery,
	getFilteredEntries,
	getErrorCount
} from './activity-log.svelte';

beforeEach(() => {
	// Reset all state between tests for isolation
	clearLog();
	closePanel();
	setAutoScroll(true);
	setFilterLevel('all');
	setFilterCategory('all');
	setSearchQuery('');
});

// ---------------------------------------------------------------------------
// logInfo / logSuccess / logWarning / logError
// ---------------------------------------------------------------------------
describe('log entry functions', () => {
	it('logInfo adds an entry with level "info"', () => {
		logInfo('connection', 'Connected to server');
		expect(activityLogState.entries).toHaveLength(1);
		expect(activityLogState.entries[0].level).toBe('info');
		expect(activityLogState.entries[0].category).toBe('connection');
		expect(activityLogState.entries[0].message).toBe('Connected to server');
	});

	it('logSuccess adds an entry with level "success"', () => {
		logSuccess('execution', 'Tool executed');
		expect(activityLogState.entries).toHaveLength(1);
		expect(activityLogState.entries[0].level).toBe('success');
		expect(activityLogState.entries[0].category).toBe('execution');
		expect(activityLogState.entries[0].message).toBe('Tool executed');
	});

	it('logWarning adds an entry with level "warning"', () => {
		logWarning('discovery', 'Slow response');
		expect(activityLogState.entries).toHaveLength(1);
		expect(activityLogState.entries[0].level).toBe('warning');
		expect(activityLogState.entries[0].category).toBe('discovery');
		expect(activityLogState.entries[0].message).toBe('Slow response');
	});

	it('logError adds an entry with level "error"', () => {
		logError('app', 'Something broke');
		expect(activityLogState.entries).toHaveLength(1);
		expect(activityLogState.entries[0].level).toBe('error');
		expect(activityLogState.entries[0].category).toBe('app');
		expect(activityLogState.entries[0].message).toBe('Something broke');
	});

	it('includes details when provided', () => {
		const details = { statusCode: 500, body: 'Internal Server Error' };
		logError('execution', 'Request failed', details);
		expect(activityLogState.entries[0].details).toEqual(details);
	});

	it('includes toolName when provided', () => {
		logInfo('execution', 'Running tool', undefined, 'my-tool');
		expect(activityLogState.entries[0].toolName).toBe('my-tool');
	});

	it('sets toolName to undefined when not provided', () => {
		logInfo('connection', 'Connected');
		expect(activityLogState.entries[0].toolName).toBeUndefined();
	});

	it('sets details to undefined when not provided', () => {
		logInfo('connection', 'Connected');
		expect(activityLogState.entries[0].details).toBeUndefined();
	});

	it('generates a unique id for each entry', () => {
		logInfo('app', 'First');
		logInfo('app', 'Second');
		const ids = activityLogState.entries.map((e) => e.id);
		expect(ids[0]).not.toBe(ids[1]);
	});

	it('sets a numeric timestamp on each entry', () => {
		const before = Date.now();
		logInfo('app', 'Timestamped');
		const after = Date.now();
		const ts = activityLogState.entries[0].timestamp;
		expect(ts).toBeGreaterThanOrEqual(before);
		expect(ts).toBeLessThanOrEqual(after);
	});
});

// ---------------------------------------------------------------------------
// Entry ordering (newest first) and max entries
// ---------------------------------------------------------------------------
describe('entry ordering and limits', () => {
	it('prepends new entries (newest first)', () => {
		logInfo('app', 'First');
		logInfo('app', 'Second');
		logInfo('app', 'Third');
		expect(activityLogState.entries[0].message).toBe('Third');
		expect(activityLogState.entries[1].message).toBe('Second');
		expect(activityLogState.entries[2].message).toBe('First');
	});

	it('enforces max 500 entries', () => {
		for (let i = 0; i < 510; i++) {
			logInfo('app', `Entry ${i}`);
		}
		expect(activityLogState.entries).toHaveLength(500);
		// The most recent entry should be the last one added
		expect(activityLogState.entries[0].message).toBe('Entry 509');
	});
});

// ---------------------------------------------------------------------------
// clearLog
// ---------------------------------------------------------------------------
describe('clearLog', () => {
	it('empties all entries', () => {
		logInfo('app', 'A');
		logError('app', 'B');
		logWarning('app', 'C');
		expect(activityLogState.entries).toHaveLength(3);

		clearLog();
		expect(activityLogState.entries).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Panel state: togglePanel, openPanel, closePanel
// ---------------------------------------------------------------------------
describe('panel state management', () => {
	it('panel is initially closed', () => {
		expect(activityLogState.panelOpen).toBe(false);
	});

	it('togglePanel opens the panel when closed', () => {
		togglePanel();
		expect(activityLogState.panelOpen).toBe(true);
	});

	it('togglePanel closes the panel when open', () => {
		openPanel();
		togglePanel();
		expect(activityLogState.panelOpen).toBe(false);
	});

	it('openPanel sets panelOpen to true', () => {
		openPanel();
		expect(activityLogState.panelOpen).toBe(true);
	});

	it('closePanel sets panelOpen to false', () => {
		openPanel();
		closePanel();
		expect(activityLogState.panelOpen).toBe(false);
	});

	it('openPanel is idempotent', () => {
		openPanel();
		openPanel();
		expect(activityLogState.panelOpen).toBe(true);
	});

	it('closePanel is idempotent', () => {
		closePanel();
		closePanel();
		expect(activityLogState.panelOpen).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// setPanelHeight — clamping between MIN_HEIGHT (100) and MAX_HEIGHT (600)
// ---------------------------------------------------------------------------
describe('setPanelHeight', () => {
	it('sets height within valid range', () => {
		setPanelHeight(300);
		expect(activityLogState.panelHeight).toBe(300);
	});

	it('clamps height to minimum of 100', () => {
		setPanelHeight(50);
		expect(activityLogState.panelHeight).toBe(100);
	});

	it('clamps height to maximum of 600', () => {
		setPanelHeight(800);
		expect(activityLogState.panelHeight).toBe(600);
	});

	it('allows exact minimum value', () => {
		setPanelHeight(100);
		expect(activityLogState.panelHeight).toBe(100);
	});

	it('allows exact maximum value', () => {
		setPanelHeight(600);
		expect(activityLogState.panelHeight).toBe(600);
	});

	it('clamps negative values to minimum', () => {
		setPanelHeight(-10);
		expect(activityLogState.panelHeight).toBe(100);
	});

	it('clamps zero to minimum', () => {
		setPanelHeight(0);
		expect(activityLogState.panelHeight).toBe(100);
	});
});

// ---------------------------------------------------------------------------
// Auto-scroll
// ---------------------------------------------------------------------------
describe('auto-scroll', () => {
	it('autoScroll is initially true', () => {
		expect(activityLogState.autoScroll).toBe(true);
	});

	it('toggleAutoScroll flips the value', () => {
		toggleAutoScroll();
		expect(activityLogState.autoScroll).toBe(false);
		toggleAutoScroll();
		expect(activityLogState.autoScroll).toBe(true);
	});

	it('setAutoScroll sets the value directly', () => {
		setAutoScroll(false);
		expect(activityLogState.autoScroll).toBe(false);
		setAutoScroll(true);
		expect(activityLogState.autoScroll).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Filter level and category
// ---------------------------------------------------------------------------
describe('filter state', () => {
	it('filterLevel is initially "all"', () => {
		expect(activityLogState.filterLevel).toBe('all');
	});

	it('setFilterLevel updates the filter level', () => {
		setFilterLevel('error');
		expect(activityLogState.filterLevel).toBe('error');
	});

	it('setFilterLevel can be set back to "all"', () => {
		setFilterLevel('warning');
		setFilterLevel('all');
		expect(activityLogState.filterLevel).toBe('all');
	});

	it('filterCategory is initially "all"', () => {
		expect(activityLogState.filterCategory).toBe('all');
	});

	it('setFilterCategory updates the filter category', () => {
		setFilterCategory('execution');
		expect(activityLogState.filterCategory).toBe('execution');
	});

	it('setFilterCategory can be set back to "all"', () => {
		setFilterCategory('connection');
		setFilterCategory('all');
		expect(activityLogState.filterCategory).toBe('all');
	});
});

// ---------------------------------------------------------------------------
// Search query
// ---------------------------------------------------------------------------
describe('search query', () => {
	it('searchQuery is initially empty', () => {
		expect(activityLogState.searchQuery).toBe('');
	});

	it('setSearchQuery updates the search query', () => {
		setSearchQuery('error');
		expect(activityLogState.searchQuery).toBe('error');
	});

	it('setSearchQuery can be cleared', () => {
		setSearchQuery('something');
		setSearchQuery('');
		expect(activityLogState.searchQuery).toBe('');
	});
});

// ---------------------------------------------------------------------------
// getFilteredEntries
// ---------------------------------------------------------------------------
describe('getFilteredEntries', () => {
	beforeEach(() => {
		logInfo('connection', 'Connected to server');
		logSuccess('execution', 'Tool ran successfully', undefined, 'my-tool');
		logWarning('discovery', 'Slow response from endpoint');
		logError('app', 'Unexpected crash');
		logError('execution', 'Tool execution failed', undefined, 'other-tool');
	});

	it('returns all entries when no filters are set', () => {
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(5);
	});

	it('filters by level', () => {
		setFilterLevel('error');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(2);
		expect(filtered.every((e) => e.level === 'error')).toBe(true);
	});

	it('filters by category', () => {
		setFilterCategory('execution');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(2);
		expect(filtered.every((e) => e.category === 'execution')).toBe(true);
	});

	it('filters by search query (case-insensitive)', () => {
		setSearchQuery('TOOL');
		const filtered = getFilteredEntries();
		// Matches: "Tool ran successfully", "Tool execution failed"
		expect(filtered).toHaveLength(2);
	});

	it('filters by search query matching partial text', () => {
		setSearchQuery('connect');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(1);
		expect(filtered[0].message).toBe('Connected to server');
	});

	it('ignores whitespace-only search query', () => {
		setSearchQuery('   ');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(5);
	});

	it('combines level and category filters', () => {
		setFilterLevel('error');
		setFilterCategory('execution');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(1);
		expect(filtered[0].message).toBe('Tool execution failed');
	});

	it('combines level filter with search query', () => {
		setFilterLevel('error');
		setSearchQuery('crash');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(1);
		expect(filtered[0].message).toBe('Unexpected crash');
	});

	it('combines category filter with search query', () => {
		setFilterCategory('execution');
		setSearchQuery('failed');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(1);
		expect(filtered[0].message).toBe('Tool execution failed');
	});

	it('combines all three filters', () => {
		setFilterLevel('error');
		setFilterCategory('app');
		setSearchQuery('crash');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(1);
		expect(filtered[0].message).toBe('Unexpected crash');
	});

	it('returns empty array when no entries match', () => {
		setFilterLevel('success');
		setFilterCategory('app');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(0);
	});

	it('returns empty array when search matches nothing', () => {
		setSearchQuery('nonexistent-query-string');
		const filtered = getFilteredEntries();
		expect(filtered).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// getErrorCount
// ---------------------------------------------------------------------------
describe('getErrorCount', () => {
	it('returns 0 when there are no entries', () => {
		expect(getErrorCount()).toBe(0);
	});

	it('counts only error-level entries', () => {
		logInfo('app', 'Info message');
		logSuccess('app', 'Success message');
		logWarning('app', 'Warning message');
		logError('app', 'Error one');
		logError('execution', 'Error two');
		expect(getErrorCount()).toBe(2);
	});

	it('returns 0 when there are entries but none are errors', () => {
		logInfo('app', 'Info');
		logSuccess('app', 'Success');
		logWarning('app', 'Warning');
		expect(getErrorCount()).toBe(0);
	});
});
