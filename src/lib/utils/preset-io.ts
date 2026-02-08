import type { ToolPreset } from '$lib/types';
import { addPreset } from '$lib/stores/presets.svelte';

interface PresetExportFormat {
	version: 1;
	tool: string;
	presets: Array<{ name: string; values: Record<string, string | number | boolean>; headers?: Record<string, string> }>;
}

export function exportPresets(presets: ToolPreset[], toolName: string) {
	const data: PresetExportFormat = {
		version: 1,
		tool: toolName,
		presets: presets.map((p) => ({
			name: p.presetName,
			values: p.values,
			...(p.headers ? { headers: p.headers } : {})
		}))
	};
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${toolName}-presets.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importPresets(
	file: File,
	discoveryUrl: string,
	toolName: string,
	existingPresets: ToolPreset[]
): Promise<number> {
	const text = await file.text();
	const data: PresetExportFormat = JSON.parse(text);

	if (data.version !== 1 || !Array.isArray(data.presets)) {
		throw new Error('Invalid preset file format');
	}

	const existingNames = new Set(existingPresets.map((p) => p.presetName.toLowerCase()));
	let imported = 0;

	for (const preset of data.presets) {
		if (existingNames.has(preset.name.toLowerCase())) continue;
		await addPreset(discoveryUrl, toolName, preset.name, preset.values, preset.headers);
		imported++;
	}

	return imported;
}
