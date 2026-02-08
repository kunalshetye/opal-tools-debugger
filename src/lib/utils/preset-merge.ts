import type { OpalParameter } from '$lib/types';

export function mergePresetWithParameters(
	presetValues: Record<string, string | number | boolean>,
	parameters: OpalParameter[]
): Record<string, string | number | boolean> {
	const merged: Record<string, string | number | boolean> = {};

	for (const param of parameters) {
		if (param.name in presetValues) {
			const val = presetValues[param.name];
			// Type-coerce if needed
			if (param.type === 'number') {
				merged[param.name] = typeof val === 'number' ? val : Number(val) || 0;
			} else if (param.type === 'boolean') {
				merged[param.name] = typeof val === 'boolean' ? val : String(val) === 'true';
			} else {
				merged[param.name] = typeof val === 'string' ? val : String(val);
			}
		} else {
			// Param in schema but not preset — use default
			if (param.type === 'boolean') merged[param.name] = false;
			else if (param.type === 'number') merged[param.name] = 0;
			else merged[param.name] = '';
		}
	}

	// Params in preset but not schema are discarded (not added to merged)
	return merged;
}
