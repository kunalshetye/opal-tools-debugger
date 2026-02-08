import { describe, it, expect } from 'vitest';
import { SANDBOX_URL, isSandboxMode } from './constants';

describe('SANDBOX_URL', () => {
	it('equals sandbox://local', () => {
		expect(SANDBOX_URL).toBe('sandbox://local');
	});
});

describe('isSandboxMode', () => {
	it('returns true for sandbox://local', () => {
		expect(isSandboxMode('sandbox://local')).toBe(true);
	});

	it('returns false for a regular URL', () => {
		expect(isSandboxMode('https://example.com/discovery')).toBe(false);
	});

	it('returns false for an empty string', () => {
		expect(isSandboxMode('')).toBe(false);
	});

	it('returns false for similar but different strings', () => {
		expect(isSandboxMode('sandbox://local/')).toBe(false);
		expect(isSandboxMode('SANDBOX://LOCAL')).toBe(false);
		expect(isSandboxMode('sandbox://remote')).toBe(false);
	});
});
