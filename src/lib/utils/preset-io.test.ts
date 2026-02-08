import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ToolPreset } from '$lib/types';

// Mock the svelte store module to avoid rune imports in vitest
const mockAddPreset = vi.fn();
vi.mock('$lib/stores/presets.svelte', () => ({
	addPreset: (...args: unknown[]) => mockAddPreset(...args)
}));

import { exportPresets, importPresets } from './preset-io';

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

function makeFile(content: string): File {
	return new File([content], 'presets.json', { type: 'application/json' });
}

describe('exportPresets', () => {
	let clickSpy: ReturnType<typeof vi.fn>;
	let createdAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
	let revokedUrls: string[];

	beforeEach(() => {
		clickSpy = vi.fn();
		createdAnchor = { href: '', download: '', click: clickSpy };
		revokedUrls = [];

		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => 'blob:mock-url'),
			revokeObjectURL: vi.fn((url: string) => revokedUrls.push(url))
		});

		vi.stubGlobal('document', {
			createElement: vi.fn(() => createdAnchor)
		});
	});

	it('creates correct JSON structure with version, tool, and presets', () => {
		const presets = [
			makePreset({ presetName: 'Preset A', values: { key: 'val' } }),
			makePreset({ presetName: 'Preset B', values: { num: 7 } })
		];

		exportPresets(presets, 'my-tool');

		// Blob was created — inspect its content via the createObjectURL mock arg
		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		expect(blobArg).toBeInstanceOf(Blob);
		expect(blobArg.type).toBe('application/json');

		// We can't easily read the blob synchronously, so verify the structure
		// by checking that the anchor was set up correctly and click was called
		expect(createdAnchor.href).toBe('blob:mock-url');
		expect(clickSpy).toHaveBeenCalledOnce();
	});

	it('includes headers when preset has headers', async () => {
		const presets = [
			makePreset({
				presetName: 'With Headers',
				values: { q: 'test' },
				headers: { Authorization: 'Bearer token123', 'X-Custom': 'value' }
			})
		];

		exportPresets(presets, 'header-tool');

		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		const text = await blobArg.text();
		const parsed = JSON.parse(text);

		expect(parsed.presets[0].headers).toEqual({
			Authorization: 'Bearer token123',
			'X-Custom': 'value'
		});
	});

	it('excludes headers field when preset has no headers', async () => {
		const presets = [makePreset({ presetName: 'No Headers', values: { a: 1 } })];

		exportPresets(presets, 'no-header-tool');

		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		const text = await blobArg.text();
		const parsed = JSON.parse(text);

		expect(parsed.presets[0]).not.toHaveProperty('headers');
	});

	it('produces correct export format with version and tool name', async () => {
		const presets = [
			makePreset({ presetName: 'Alpha', values: { x: true } }),
			makePreset({ presetName: 'Beta', values: { y: 'hello' } })
		];

		exportPresets(presets, 'format-tool');

		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		const text = await blobArg.text();
		const parsed = JSON.parse(text);

		expect(parsed).toEqual({
			version: 1,
			tool: 'format-tool',
			presets: [
				{ name: 'Alpha', values: { x: true } },
				{ name: 'Beta', values: { y: 'hello' } }
			]
		});
	});

	it('triggers download with correct filename', () => {
		const presets = [makePreset()];

		exportPresets(presets, 'my-awesome-tool');

		expect(document.createElement).toHaveBeenCalledWith('a');
		expect(createdAnchor.download).toBe('my-awesome-tool-presets.json');
		expect(createdAnchor.href).toBe('blob:mock-url');
		expect(clickSpy).toHaveBeenCalledOnce();
	});

	it('revokes the object URL after triggering download', () => {
		const presets = [makePreset()];

		exportPresets(presets, 'cleanup-tool');

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
		expect(revokedUrls).toEqual(['blob:mock-url']);
	});

	it('maps presetName to name in exported format', async () => {
		const presets = [makePreset({ presetName: 'Original Name' })];

		exportPresets(presets, 'rename-tool');

		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		const text = await blobArg.text();
		const parsed = JSON.parse(text);

		expect(parsed.presets[0].name).toBe('Original Name');
		expect(parsed.presets[0]).not.toHaveProperty('presetName');
	});

	it('handles empty presets array', async () => {
		exportPresets([], 'empty-tool');

		const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
		const text = await blobArg.text();
		const parsed = JSON.parse(text);

		expect(parsed).toEqual({
			version: 1,
			tool: 'empty-tool',
			presets: []
		});
	});
});

describe('importPresets', () => {
	const discoveryUrl = 'https://example.com/discovery';
	const toolName = 'test-tool';

	beforeEach(() => {
		mockAddPreset.mockReset();
		mockAddPreset.mockResolvedValue(undefined);
	});

	it('imports new presets and returns the count', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{ name: 'Preset A', values: { key: 'val' } },
				{ name: 'Preset B', values: { num: 5 } }
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, []);

		expect(result).toBe(2);
		expect(mockAddPreset).toHaveBeenCalledTimes(2);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'Preset A', { key: 'val' }, undefined);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'Preset B', { num: 5 }, undefined);
	});

	it('skips presets with duplicate names (exact match)', async () => {
		const existing = [makePreset({ presetName: 'Preset A' })];
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{ name: 'Preset A', values: { key: 'new-val' } },
				{ name: 'Preset B', values: { key: 'val' } }
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, existing);

		expect(result).toBe(1);
		expect(mockAddPreset).toHaveBeenCalledTimes(1);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'Preset B', { key: 'val' }, undefined);
	});

	it('skips presets with duplicate names (case-insensitive)', async () => {
		const existing = [makePreset({ presetName: 'My Preset' })];
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{ name: 'my preset', values: { a: 1 } },
				{ name: 'MY PRESET', values: { a: 2 } },
				{ name: 'New One', values: { b: 3 } }
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, existing);

		expect(result).toBe(1);
		expect(mockAddPreset).toHaveBeenCalledTimes(1);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'New One', { b: 3 }, undefined);
	});

	it('throws on invalid version number', async () => {
		const fileContent = JSON.stringify({
			version: 2,
			tool: toolName,
			presets: [{ name: 'Preset', values: {} }]
		});

		await expect(importPresets(makeFile(fileContent), discoveryUrl, toolName, [])).rejects.toThrow(
			'Invalid preset file format'
		);
	});

	it('throws when version is missing', async () => {
		const fileContent = JSON.stringify({
			tool: toolName,
			presets: [{ name: 'Preset', values: {} }]
		});

		await expect(importPresets(makeFile(fileContent), discoveryUrl, toolName, [])).rejects.toThrow(
			'Invalid preset file format'
		);
	});

	it('throws when presets is not an array', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: 'not-an-array'
		});

		await expect(importPresets(makeFile(fileContent), discoveryUrl, toolName, [])).rejects.toThrow(
			'Invalid preset file format'
		);
	});

	it('throws when presets field is missing', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName
		});

		await expect(importPresets(makeFile(fileContent), discoveryUrl, toolName, [])).rejects.toThrow(
			'Invalid preset file format'
		);
	});

	it('throws on invalid JSON', async () => {
		const fileContent = 'this is not json';

		await expect(importPresets(makeFile(fileContent), discoveryUrl, toolName, [])).rejects.toThrow();
	});

	it('returns 0 when all presets are duplicates', async () => {
		const existing = [
			makePreset({ presetName: 'Preset A' }),
			makePreset({ presetName: 'Preset B' })
		];
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{ name: 'Preset A', values: { x: 1 } },
				{ name: 'preset b', values: { y: 2 } }
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, existing);

		expect(result).toBe(0);
		expect(mockAddPreset).not.toHaveBeenCalled();
	});

	it('returns 0 when file contains empty presets array', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: []
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, []);

		expect(result).toBe(0);
		expect(mockAddPreset).not.toHaveBeenCalled();
	});

	it('passes headers to addPreset when present in imported data', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{
					name: 'With Headers',
					values: { q: 'search' },
					headers: { Authorization: 'Bearer abc', 'X-Api-Key': 'key123' }
				}
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, []);

		expect(result).toBe(1);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'With Headers', { q: 'search' }, {
			Authorization: 'Bearer abc',
			'X-Api-Key': 'key123'
		});
	});

	it('passes undefined headers when not present in imported data', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [{ name: 'No Headers', values: { a: 'b' } }]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, []);

		expect(result).toBe(1);
		expect(mockAddPreset).toHaveBeenCalledWith(discoveryUrl, toolName, 'No Headers', { a: 'b' }, undefined);
	});

	it('imports presets with mixed header presence', async () => {
		const fileContent = JSON.stringify({
			version: 1,
			tool: toolName,
			presets: [
				{ name: 'With', values: { a: 1 }, headers: { 'X-Key': 'val' } },
				{ name: 'Without', values: { b: 2 } },
				{ name: 'Also With', values: { c: 3 }, headers: { Auth: 'token' } }
			]
		});

		const result = await importPresets(makeFile(fileContent), discoveryUrl, toolName, []);

		expect(result).toBe(3);
		expect(mockAddPreset).toHaveBeenNthCalledWith(1, discoveryUrl, toolName, 'With', { a: 1 }, { 'X-Key': 'val' });
		expect(mockAddPreset).toHaveBeenNthCalledWith(2, discoveryUrl, toolName, 'Without', { b: 2 }, undefined);
		expect(mockAddPreset).toHaveBeenNthCalledWith(3, discoveryUrl, toolName, 'Also With', { c: 3 }, { Auth: 'token' });
	});

	it('calls addPreset with the correct discoveryUrl and toolName', async () => {
		const customUrl = 'https://other.example.com/api';
		const customTool = 'special-tool';
		const fileContent = JSON.stringify({
			version: 1,
			tool: customTool,
			presets: [{ name: 'Test', values: { x: 1 } }]
		});

		await importPresets(makeFile(fileContent), customUrl, customTool, []);

		expect(mockAddPreset).toHaveBeenCalledWith(customUrl, customTool, 'Test', { x: 1 }, undefined);
	});
});
