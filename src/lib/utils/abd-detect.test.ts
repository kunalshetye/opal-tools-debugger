import { describe, it, expect } from 'vitest';
import { isAbdResponse } from './abd-detect';

describe('isAbdResponse', () => {
	it('returns true for a valid ABD response with Block.Document content', () => {
		const body = {
			content: {
				$type: 'Block.Document',
				children: [
					{ $type: 'Block.Heading', children: 'Hello', level: '2' }
				]
			}
		};
		expect(isAbdResponse(body)).toBe(true);
	});

	it('returns true for ABD response with data, artifact, error, rollback', () => {
		const body = {
			content: {
				$type: 'Block.Document',
				children: []
			},
			data: { task_id: '123' },
			artifact: { type: 'task', id: 'task-123', data: {} },
			error: { message: 'something failed' },
			rollback: { type: 'undo', label: 'Undo' }
		};
		expect(isAbdResponse(body)).toBe(true);
	});

	it('returns true when detected via content-type header', () => {
		const body = { some: 'data' };
		const headers = { 'content-type': 'application/vnd.opal.block+json' };
		expect(isAbdResponse(body, headers)).toBe(true);
	});

	it('returns true when detected via Content-Type header (capitalized)', () => {
		const body = { some: 'data' };
		const headers = { 'Content-Type': 'application/vnd.opal.block+json; charset=utf-8' };
		expect(isAbdResponse(body, headers)).toBe(true);
	});

	it('returns false for null body', () => {
		expect(isAbdResponse(null)).toBe(false);
	});

	it('returns false for string body', () => {
		expect(isAbdResponse('hello')).toBe(false);
	});

	it('returns false for empty object', () => {
		expect(isAbdResponse({})).toBe(false);
	});

	it('returns false for object with content but no $type', () => {
		const body = { content: { children: [] } };
		expect(isAbdResponse(body)).toBe(false);
	});

	it('returns false for object with wrong $type', () => {
		const body = { content: { $type: 'Block.Heading', children: 'hi' } };
		expect(isAbdResponse(body)).toBe(false);
	});

	it('returns false for object with null content', () => {
		const body = { content: null };
		expect(isAbdResponse(body)).toBe(false);
	});

	it('returns false for array body', () => {
		expect(isAbdResponse([1, 2, 3])).toBe(false);
	});

	it('returns false for number body', () => {
		expect(isAbdResponse(42)).toBe(false);
	});

	it('returns false for boolean body', () => {
		expect(isAbdResponse(true)).toBe(false);
	});

	it('returns false for undefined body', () => {
		expect(isAbdResponse(undefined)).toBe(false);
	});

	it('returns false when headers have unrelated content-type', () => {
		const body = { some: 'data' };
		const headers = { 'content-type': 'application/json' };
		expect(isAbdResponse(body, headers)).toBe(false);
	});

	it('returns true via body even when headers are wrong', () => {
		const body = {
			content: { $type: 'Block.Document', children: [] }
		};
		const headers = { 'content-type': 'application/json' };
		expect(isAbdResponse(body, headers)).toBe(true);
	});
});
