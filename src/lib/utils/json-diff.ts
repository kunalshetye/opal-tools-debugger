export interface DiffEntry {
	path: string;
	type: 'added' | 'removed' | 'changed';
	oldVal?: unknown;
	newVal?: unknown;
}

export function jsonDiff(a: unknown, b: unknown, path: string = ''): DiffEntry[] {
	if (a === b) return [];

	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
		if (a === undefined && b !== undefined) {
			return [{ path: path || '(root)', type: 'added', newVal: b }];
		}
		if (a !== undefined && b === undefined) {
			return [{ path: path || '(root)', type: 'removed', oldVal: a }];
		}
		return [{ path: path || '(root)', type: 'changed', oldVal: a, newVal: b }];
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		const diffs: DiffEntry[] = [];
		const maxLen = Math.max(a.length, b.length);
		for (let i = 0; i < maxLen; i++) {
			const p = path ? `${path}[${i}]` : `[${i}]`;
			if (i >= a.length) {
				diffs.push({ path: p, type: 'added', newVal: b[i] });
			} else if (i >= b.length) {
				diffs.push({ path: p, type: 'removed', oldVal: a[i] });
			} else {
				diffs.push(...jsonDiff(a[i], b[i], p));
			}
		}
		return diffs;
	}

	const aObj = a as Record<string, unknown>;
	const bObj = b as Record<string, unknown>;
	const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
	const diffs: DiffEntry[] = [];

	for (const key of allKeys) {
		const p = path ? `${path}.${key}` : key;
		if (!(key in aObj)) {
			diffs.push({ path: p, type: 'added', newVal: bObj[key] });
		} else if (!(key in bObj)) {
			diffs.push({ path: p, type: 'removed', oldVal: aObj[key] });
		} else {
			diffs.push(...jsonDiff(aObj[key], bObj[key], p));
		}
	}

	return diffs;
}
