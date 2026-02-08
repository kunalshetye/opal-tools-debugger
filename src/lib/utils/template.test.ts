import { describe, it, expect } from 'vitest';
import { resolveTemplate, resolveAllTemplates, hasTemplateTokens } from './template';

describe('resolveTemplate', () => {
	it('substitutes a single token', () => {
		expect(resolveTemplate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
	});

	it('substitutes multiple different tokens', () => {
		expect(resolveTemplate('{{greeting}} {{name}}!', { greeting: 'Hi', name: 'Alice' })).toBe(
			'Hi Alice!'
		);
	});

	it('substitutes the same token appearing more than once', () => {
		expect(resolveTemplate('{{x}} and {{x}}', { x: 'yes' })).toBe('yes and yes');
	});

	it('leaves missing vars as-is', () => {
		expect(resolveTemplate('Hello {{name}}, your id is {{id}}', { name: 'Bob' })).toBe(
			'Hello Bob, your id is {{id}}'
		);
	});

	it('leaves all tokens when vars is empty', () => {
		expect(resolveTemplate('{{a}} {{b}}', {})).toBe('{{a}} {{b}}');
	});

	it('returns the string unchanged when there are no tokens', () => {
		expect(resolveTemplate('no tokens here', { name: 'unused' })).toBe('no tokens here');
	});

	it('returns an empty string unchanged', () => {
		expect(resolveTemplate('', { name: 'unused' })).toBe('');
	});

	it('handles adjacent tokens with no separator', () => {
		expect(resolveTemplate('{{a}}{{b}}', { a: 'foo', b: 'bar' })).toBe('foobar');
	});

	it('handles special characters in replacement values', () => {
		expect(resolveTemplate('url={{url}}', { url: 'https://example.com?q=1&r=2' })).toBe(
			'url=https://example.com?q=1&r=2'
		);
	});

	it('handles replacement values containing dollar signs', () => {
		expect(resolveTemplate('price is {{price}}', { price: '$100' })).toBe('price is $100');
	});

	it('handles replacement values containing curly braces', () => {
		expect(resolveTemplate('data={{json}}', { json: '{"key":"value"}' })).toBe(
			'data={"key":"value"}'
		);
	});

	it('handles replacement values containing template-like strings', () => {
		expect(resolveTemplate('val={{v}}', { v: '{{other}}' })).toBe('val={{other}}');
	});

	it('does not substitute tokens with non-word characters in the key', () => {
		expect(resolveTemplate('{{my-var}}', { 'my-var': 'nope' })).toBe('{{my-var}}');
	});

	it('handles token at the very start of the string', () => {
		expect(resolveTemplate('{{start}} rest', { start: 'BEGIN' })).toBe('BEGIN rest');
	});

	it('handles token at the very end of the string', () => {
		expect(resolveTemplate('rest {{end}}', { end: 'DONE' })).toBe('rest DONE');
	});

	it('handles a string that is only a token', () => {
		expect(resolveTemplate('{{only}}', { only: 'value' })).toBe('value');
	});

	it('substitutes with an empty string value', () => {
		expect(resolveTemplate('a{{x}}b', { x: '' })).toBe('ab');
	});
});

describe('resolveAllTemplates', () => {
	it('resolves string values in the params object', () => {
		const result = resolveAllTemplates(
			{ greeting: 'Hello {{name}}', count: 'Items: {{n}}' },
			{ name: 'Alice', n: '5' }
		);
		expect(result).toEqual({ greeting: 'Hello Alice', count: 'Items: 5' });
	});

	it('passes through non-string values unchanged', () => {
		const result = resolveAllTemplates(
			{ name: '{{who}}', age: 30, active: true, tags: ['a', 'b'], data: null },
			{ who: 'Bob' }
		);
		expect(result).toEqual({
			name: 'Bob',
			age: 30,
			active: true,
			tags: ['a', 'b'],
			data: null
		});
	});

	it('does not recurse into nested objects', () => {
		const nested = { inner: '{{token}}' };
		const result = resolveAllTemplates({ obj: nested }, { token: 'resolved' });
		expect(result).toEqual({ obj: { inner: '{{token}}' } });
	});

	it('does not resolve strings inside arrays', () => {
		const result = resolveAllTemplates({ list: ['{{a}}', '{{b}}'] }, { a: '1', b: '2' });
		expect(result).toEqual({ list: ['{{a}}', '{{b}}'] });
	});

	it('returns an empty object when params is empty', () => {
		expect(resolveAllTemplates({}, { key: 'value' })).toEqual({});
	});

	it('resolves all tokens when all vars are provided', () => {
		const result = resolveAllTemplates(
			{ a: '{{x}}', b: '{{y}}', c: '{{x}} and {{y}}' },
			{ x: 'X', y: 'Y' }
		);
		expect(result).toEqual({ a: 'X', b: 'Y', c: 'X and Y' });
	});

	it('partially resolves when some vars are missing', () => {
		const result = resolveAllTemplates(
			{ a: '{{x}} {{y}}', b: '{{z}}' },
			{ x: 'found' }
		);
		expect(result).toEqual({ a: 'found {{y}}', b: '{{z}}' });
	});

	it('handles undefined values in params', () => {
		const result = resolveAllTemplates({ a: undefined as unknown }, { x: '1' });
		expect(result).toEqual({ a: undefined });
	});

	it('handles numeric zero and false boolean values', () => {
		const result = resolveAllTemplates({ num: 0, bool: false }, {});
		expect(result).toEqual({ num: 0, bool: false });
	});

	it('does not mutate the original params object', () => {
		const original = { a: '{{x}}', b: 42 };
		const originalCopy = { ...original };
		resolveAllTemplates(original, { x: 'resolved' });
		expect(original).toEqual(originalCopy);
	});
});

describe('hasTemplateTokens', () => {
	it('returns true for a string with a single token', () => {
		expect(hasTemplateTokens('{{name}}')).toBe(true);
	});

	it('returns true for a string with multiple tokens', () => {
		expect(hasTemplateTokens('{{a}} and {{b}}')).toBe(true);
	});

	it('returns true when token is embedded in other text', () => {
		expect(hasTemplateTokens('Hello {{name}}, welcome!')).toBe(true);
	});

	it('returns true for tokens with underscores', () => {
		expect(hasTemplateTokens('{{my_var}}')).toBe(true);
	});

	it('returns true for tokens with digits', () => {
		expect(hasTemplateTokens('{{var1}}')).toBe(true);
	});

	it('returns false for a plain string with no tokens', () => {
		expect(hasTemplateTokens('just a plain string')).toBe(false);
	});

	it('returns false for an empty string', () => {
		expect(hasTemplateTokens('')).toBe(false);
	});

	it('returns false for single curly braces like {single}', () => {
		expect(hasTemplateTokens('{single}')).toBe(false);
	});

	it('returns false for spaced tokens like {{ spaced }}', () => {
		expect(hasTemplateTokens('{{ spaced }}')).toBe(false);
	});

	it('returns false for triple braces like {{{name}}}', () => {
		// The inner {{name}} should still match since \w+ matches "name"
		// Actually {{{name}}} contains {{name}} as a substring, so it matches
		expect(hasTemplateTokens('{{{name}}}')).toBe(true);
	});

	it('returns false for empty braces {{}}', () => {
		expect(hasTemplateTokens('{{}}')).toBe(false);
	});

	it('returns false for braces with only spaces {{ }}', () => {
		expect(hasTemplateTokens('{{ }}')).toBe(false);
	});

	it('returns false for tokens with hyphens like {{my-var}}', () => {
		expect(hasTemplateTokens('{{my-var}}')).toBe(false);
	});

	it('returns false for tokens with dots like {{my.var}}', () => {
		expect(hasTemplateTokens('{{my.var}}')).toBe(false);
	});

	it('returns true when mixed with non-matching patterns', () => {
		expect(hasTemplateTokens('{nottoken} but {{valid}} here')).toBe(true);
	});
});
