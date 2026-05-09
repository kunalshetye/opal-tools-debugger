import type { OpalParameter } from '$lib/types';

export function mergePresetWithParameters(
	presetValues: Record<string, unknown>,
	parameters: OpalParameter[]
): Record<string, unknown> {
	const merged: Record<string, unknown> = {};

	for (const param of parameters) {
		if (param.name in presetValues) {
			const val = presetValues[param.name];
			// Type-coerce if needed
			if (param.type === 'number' || param.type === 'integer') {
				merged[param.name] = typeof val === 'number' ? val : Number(val) || 0;
			} else if (param.type === 'boolean') {
				merged[param.name] = typeof val === 'boolean' ? val : String(val) === 'true';
			} else if (param.type === 'array' || param.type === 'object') {
				merged[param.name] = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
			} else {
				merged[param.name] = typeof val === 'string' ? val : String(val);
			}
		} else {
			// Param in schema but not preset — use default
			if (param.type === 'boolean') merged[param.name] = false;
			else if (param.type === 'number' || param.type === 'integer') merged[param.name] = 0;
			else if (param.type === 'array') merged[param.name] = '[]';
			else if (param.type === 'object') merged[param.name] = '{}';
			else merged[param.name] = '';
		}
	}

	// Params in preset but not schema are discarded (not added to merged)
	return merged;
}
