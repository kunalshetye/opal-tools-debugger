import { describe, it, expect } from 'vitest';
import { mergePresetWithParameters } from './preset-merge';
import type { OpalParameter } from '$lib/types';

function param(name: string, type: OpalParameter['type'], required = false): OpalParameter {
	return { name, type, required, description: '' };
}

describe('mergePresetWithParameters', () => {
	it('uses preset value when param exists in both preset and schema', () => {
		const result = mergePresetWithParameters(
			{ name: 'Alice' },
			[param('name', 'string')]
		);
		expect(result).toEqual({ name: 'Alice' });
	});

	it('coerces string to number', () => {
		const result = mergePresetWithParameters(
			{ count: '42' },
			[param('count', 'number')]
		);
		expect(result).toEqual({ count: 42 });
	});

	it('coerces string to boolean', () => {
		const result = mergePresetWithParameters(
			{ enabled: 'true' },
			[param('enabled', 'boolean')]
		);
		expect(result).toEqual({ enabled: true });
	});

	it('coerces "false" string to boolean false', () => {
		const result = mergePresetWithParameters(
			{ enabled: 'false' },
			[param('enabled', 'boolean')]
		);
		expect(result).toEqual({ enabled: false });
	});

	it('coerces number to string', () => {
		const result = mergePresetWithParameters(
			{ label: 123 },
			[param('label', 'string')]
		);
		expect(result).toEqual({ label: '123' });
	});

	it('coerces boolean to string', () => {
		const result = mergePresetWithParameters(
			{ flag: true },
			[param('flag', 'string')]
		);
		expect(result).toEqual({ flag: 'true' });
	});

	it('keeps number value as-is when type matches', () => {
		const result = mergePresetWithParameters(
			{ count: 7 },
			[param('count', 'number')]
		);
		expect(result).toEqual({ count: 7 });
	});

	it('keeps boolean value as-is when type matches', () => {
		const result = mergePresetWithParameters(
			{ active: false },
			[param('active', 'boolean')]
		);
		expect(result).toEqual({ active: false });
	});

	it('uses default empty string for missing string param', () => {
		const result = mergePresetWithParameters(
			{},
			[param('name', 'string')]
		);
		expect(result).toEqual({ name: '' });
	});

	it('uses default 0 for missing number param', () => {
		const result = mergePresetWithParameters(
			{},
			[param('count', 'number')]
		);
		expect(result).toEqual({ count: 0 });
	});

	it('coerces integer values like numbers', () => {
		const result = mergePresetWithParameters(
			{ count: '42' },
			[param('count', 'integer')]
		);
		expect(result).toEqual({ count: 42 });
	});

	it('uses default false for missing boolean param', () => {
		const result = mergePresetWithParameters(
			{},
			[param('enabled', 'boolean')]
		);
		expect(result).toEqual({ enabled: false });
	});

	it('discards preset values not in schema', () => {
		const result = mergePresetWithParameters(
			{ name: 'Alice', obsolete: 'gone' },
			[param('name', 'string')]
		);
		expect(result).toEqual({ name: 'Alice' });
	});

	it('returns empty object for empty parameters array', () => {
		const result = mergePresetWithParameters({ name: 'Alice' }, []);
		expect(result).toEqual({});
	});

	it('returns all defaults for empty preset values', () => {
		const result = mergePresetWithParameters(
			{},
			[param('name', 'string'), param('count', 'number'), param('active', 'boolean'), param('items', 'array'), param('metadata', 'object')]
		);
		expect(result).toEqual({ name: '', count: 0, active: false, items: '[]', metadata: '{}' });
	});

	it('coerces non-numeric string to 0 for number type', () => {
		const result = mergePresetWithParameters(
			{ count: 'not-a-number' },
			[param('count', 'number')]
		);
		expect(result).toEqual({ count: 0 });
	});

	it('stringifies array and object preset values for JSON text inputs', () => {
		const result = mergePresetWithParameters(
			{ items: ['a', 'b'], metadata: { id: 1 } },
			[param('items', 'array'), param('metadata', 'object')]
		);
		expect(result).toEqual({
			items: JSON.stringify(['a', 'b'], null, 2),
			metadata: JSON.stringify({ id: 1 }, null, 2)
		});
	});
});
