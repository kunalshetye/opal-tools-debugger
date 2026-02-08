import { browser } from '$app/environment';
import type { ToolPreset } from '$lib/types';
import {
	getPresetsForTool,
	savePreset as dbSavePreset,
	deletePreset as dbDeletePreset,
	updatePreset as dbUpdatePreset
} from '$lib/db/presets';

interface PresetsState {
	presets: ToolPreset[];
	loading: boolean;
	currentToolName: string | null;
	currentDiscoveryUrl: string | null;
	selectedPresetId: string | null;
}

export const presetsState: PresetsState = $state({
	presets: [],
	loading: false,
	currentToolName: null,
	currentDiscoveryUrl: null,
	selectedPresetId: null
});

export async function loadPresets(discoveryUrl: string, toolName: string) {
	if (!browser) return;
	presetsState.loading = true;
	presetsState.currentToolName = toolName;
	presetsState.currentDiscoveryUrl = discoveryUrl;
	presetsState.selectedPresetId = null;

	try {
		presetsState.presets = await getPresetsForTool(discoveryUrl, toolName);
	} catch {
		presetsState.presets = [];
	} finally {
		presetsState.loading = false;
	}
}

export async function addPreset(
	discoveryUrl: string,
	toolName: string,
	presetName: string,
	values: Record<string, string | number | boolean>,
	headers?: Record<string, string>
): Promise<ToolPreset> {
	const now = new Date().toISOString();
	const preset: ToolPreset = {
		id: crypto.randomUUID(),
		toolName,
		discoveryUrl,
		presetName,
		values: { ...values },
		headers,
		createdAt: now,
		updatedAt: now
	};

	// Optimistic update
	presetsState.presets = [...presetsState.presets, preset];
	presetsState.selectedPresetId = preset.id;

	await dbSavePreset(preset);
	return preset;
}

export async function removePreset(id: string) {
	// Optimistic update
	presetsState.presets = presetsState.presets.filter((p) => p.id !== id);
	if (presetsState.selectedPresetId === id) {
		presetsState.selectedPresetId = null;
	}

	await dbDeletePreset(id);
}

export async function overwritePreset(
	id: string,
	values: Record<string, string | number | boolean>,
	headers?: Record<string, string>
) {
	// Optimistic update
	presetsState.presets = presetsState.presets.map((p) =>
		p.id === id ? { ...p, values: { ...values }, headers, updatedAt: new Date().toISOString() } : p
	);

	await dbUpdatePreset(id, values, headers);
}
