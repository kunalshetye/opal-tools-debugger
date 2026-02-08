import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { getPresetsForTool, savePreset, deletePreset, updatePreset } from './presets';
import type { ToolPreset } from '$lib/types';

function makePreset(overrides: Partial<ToolPreset> = {}): ToolPreset {
	return {
		id: crypto.randomUUID(),
		toolName: 'test-tool',
		discoveryUrl: 'https://example.com/discovery',
		presetName: 'My Preset',
		values: { name: 'Alice', count: 42 },
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides
	};
}

// Each test file import gets a fresh fake-indexeddb global, but the module-level
// `dbPromise` singleton in presets.ts means all tests share the same DB instance.
// We work around this by using unique discoveryUrl/toolName combos per test.

describe('presets IndexedDB layer', () => {
	let testId = 0;

	function uniqueScope() {
		testId++;
		return {
			discoveryUrl: `https://example.com/discovery-${testId}`,
			toolName: `tool-${testId}`
		};
	}

	it('savePreset + getPresetsForTool round-trips correctly', async () => {
		const { discoveryUrl, toolName } = uniqueScope();
		const preset = makePreset({ discoveryUrl, toolName, presetName: 'Preset A' });

		await savePreset(preset);
		const result = await getPresetsForTool(discoveryUrl, toolName);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(preset);
	});

	it('getPresetsForTool filters by compound index', async () => {
		const scope1 = uniqueScope();
		const scope2 = uniqueScope();

		const preset1 = makePreset({ ...scope1, presetName: 'Preset 1' });
		const preset2 = makePreset({ ...scope2, presetName: 'Preset 2' });

		await savePreset(preset1);
		await savePreset(preset2);

		const result1 = await getPresetsForTool(scope1.discoveryUrl, scope1.toolName);
		const result2 = await getPresetsForTool(scope2.discoveryUrl, scope2.toolName);

		expect(result1).toHaveLength(1);
		expect(result1[0].presetName).toBe('Preset 1');
		expect(result2).toHaveLength(1);
		expect(result2[0].presetName).toBe('Preset 2');
	});

	it('deletePreset removes the preset', async () => {
		const { discoveryUrl, toolName } = uniqueScope();
		const preset = makePreset({ discoveryUrl, toolName });

		await savePreset(preset);
		await deletePreset(preset.id);

		const result = await getPresetsForTool(discoveryUrl, toolName);
		expect(result).toHaveLength(0);
	});

	it('updatePreset updates values and updatedAt', async () => {
		const { discoveryUrl, toolName } = uniqueScope();
		const preset = makePreset({
			discoveryUrl,
			toolName,
			values: { name: 'Alice' },
			updatedAt: '2024-01-01T00:00:00.000Z'
		});

		await savePreset(preset);
		await updatePreset(preset.id, { name: 'Bob', count: 99 });

		const result = await getPresetsForTool(discoveryUrl, toolName);
		expect(result).toHaveLength(1);
		expect(result[0].values).toEqual({ name: 'Bob', count: 99 });
		expect(result[0].updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
		// Preserves other fields
		expect(result[0].presetName).toBe(preset.presetName);
		expect(result[0].createdAt).toBe(preset.createdAt);
	});

	it('updatePreset with non-existent id is a no-op', async () => {
		const { discoveryUrl, toolName } = uniqueScope();
		const preset = makePreset({ discoveryUrl, toolName });
		await savePreset(preset);

		// Should not throw
		await updatePreset('non-existent-id', { name: 'Ghost' });

		const result = await getPresetsForTool(discoveryUrl, toolName);
		expect(result).toHaveLength(1);
		expect(result[0].values).toEqual(preset.values);
	});

	it('returns empty array when no presets exist for scope', async () => {
		const { discoveryUrl, toolName } = uniqueScope();
		const result = await getPresetsForTool(discoveryUrl, toolName);
		expect(result).toEqual([]);
	});
});
