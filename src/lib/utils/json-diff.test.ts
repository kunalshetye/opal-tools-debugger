import { describe, it, expect } from 'vitest';
import { jsonDiff } from './json-diff';

describe('jsonDiff', () => {
	it('returns empty for identical objects', () => {
		expect(jsonDiff({ a: 1 }, { a: 1 })).toEqual([]);
	});

	it('detects added keys', () => {
		const diffs = jsonDiff({ a: 1 }, { a: 1, b: 2 });
		expect(diffs).toEqual([{ path: 'b', type: 'added', newVal: 2 }]);
	});

	it('detects removed keys', () => {
		const diffs = jsonDiff({ a: 1, b: 2 }, { a: 1 });
		expect(diffs).toEqual([{ path: 'b', type: 'removed', oldVal: 2 }]);
	});

	it('detects changed values', () => {
		const diffs = jsonDiff({ a: 1 }, { a: 2 });
		expect(diffs).toEqual([{ path: 'a', type: 'changed', oldVal: 1, newVal: 2 }]);
	});

	it('handles nested objects', () => {
		const diffs = jsonDiff({ a: { b: 1 } }, { a: { b: 2 } });
		expect(diffs).toEqual([{ path: 'a.b', type: 'changed', oldVal: 1, newVal: 2 }]);
	});

	it('handles arrays', () => {
		const diffs = jsonDiff([1, 2], [1, 3, 4]);
		expect(diffs).toHaveLength(2);
		expect(diffs[0]).toEqual({ path: '[1]', type: 'changed', oldVal: 2, newVal: 3 });
		expect(diffs[1]).toEqual({ path: '[2]', type: 'added', newVal: 4 });
	});

	it('handles null vs object', () => {
		const diffs = jsonDiff(null, { a: 1 });
		expect(diffs).toHaveLength(1);
		expect(diffs[0].type).toBe('changed');
	});

	it('returns empty array for identical primitives', () => {
		expect(jsonDiff(42, 42)).toEqual([]);
	});

	it('detects different primitives as changed at root', () => {
		const diffs = jsonDiff('a', 'b');
		expect(diffs).toEqual([{ path: '(root)', type: 'changed', oldVal: 'a', newVal: 'b' }]);
	});

	it('returns empty array for empty objects', () => {
		expect(jsonDiff({}, {})).toEqual([]);
	});

	it('returns only the leaf diff for deeply nested changes', () => {
		const a = { level1: { level2: { level3: { value: 'old' } } } };
		const b = { level1: { level2: { level3: { value: 'new' } } } };
		const diffs = jsonDiff(a, b);
		expect(diffs).toEqual([
			{ path: 'level1.level2.level3.value', type: 'changed', oldVal: 'old', newVal: 'new' }
		]);
	});

	it('detects mixed types (object vs array) at the same path as changed', () => {
		const a = { data: 'hello' };
		const b = { data: [1, 2, 3] };
		const diffs = jsonDiff(a, b);
		expect(diffs).toEqual([
			{ path: 'data', type: 'changed', oldVal: 'hello', newVal: [1, 2, 3] }
		]);
	});

	it('detects null vs undefined as changed', () => {
		const diffs = jsonDiff(null, undefined);
		expect(diffs).toEqual([{ path: '(root)', type: 'removed', oldVal: null }]);
	});

	it('detects array element removed', () => {
		const diffs = jsonDiff([1, 2, 3], [1, 2]);
		expect(diffs).toEqual([{ path: '[2]', type: 'removed', oldVal: 3 }]);
	});

	it('detects multiple changes in the same object simultaneously', () => {
		const a = { keep: 1, change: 'old', remove: true };
		const b = { keep: 1, change: 'new', add: 42 };
		const diffs = jsonDiff(a, b);
		expect(diffs).toHaveLength(3);
		expect(diffs).toContainEqual({ path: 'change', type: 'changed', oldVal: 'old', newVal: 'new' });
		expect(diffs).toContainEqual({ path: 'remove', type: 'removed', oldVal: true });
		expect(diffs).toContainEqual({ path: 'add', type: 'added', newVal: 42 });
	});

	it('detects boolean value changes', () => {
		const diffs = jsonDiff({ flag: true }, { flag: false });
		expect(diffs).toEqual([{ path: 'flag', type: 'changed', oldVal: true, newVal: false }]);
	});

	it('detects nested object added', () => {
		const diffs = jsonDiff({ a: 1 }, { a: 1, b: { c: 2 } });
		expect(diffs).toEqual([{ path: 'b', type: 'added', newVal: { c: 2 } }]);
	});
});
