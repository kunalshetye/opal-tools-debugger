import { describe, it, expect } from 'vitest';
import { getStatusInfo } from './http-status';

describe('getStatusInfo', () => {
	it('returns correct label for known 200 status', () => {
		const info = getStatusInfo(200);
		expect(info.label).toBe('200 OK');
		expect(info.category).toBe('success');
	});

	it('returns correct label for known 404 status', () => {
		const info = getStatusInfo(404);
		expect(info.label).toBe('404 Not Found');
		expect(info.category).toBe('client-error');
	});

	it('returns correct label for known 500 status', () => {
		const info = getStatusInfo(500);
		expect(info.label).toBe('500 Internal Server Error');
		expect(info.category).toBe('server-error');
	});

	it('falls back to numeric label for unknown status code', () => {
		const info = getStatusInfo(418);
		expect(info.label).toBe('418');
		expect(info.category).toBe('client-error');
	});

	it('categorizes 2xx as success', () => {
		expect(getStatusInfo(200).category).toBe('success');
		expect(getStatusInfo(201).category).toBe('success');
		expect(getStatusInfo(299).category).toBe('success');
	});

	it('categorizes 3xx as redirect', () => {
		expect(getStatusInfo(300).category).toBe('redirect');
		expect(getStatusInfo(301).category).toBe('redirect');
		expect(getStatusInfo(399).category).toBe('redirect');
	});

	it('categorizes 4xx as client-error', () => {
		expect(getStatusInfo(400).category).toBe('client-error');
		expect(getStatusInfo(401).category).toBe('client-error');
		expect(getStatusInfo(499).category).toBe('client-error');
	});

	it('categorizes 5xx as server-error', () => {
		expect(getStatusInfo(500).category).toBe('server-error');
		expect(getStatusInfo(502).category).toBe('server-error');
	});

	it('returns network-error for status 0', () => {
		const info = getStatusInfo(0);
		expect(info.category).toBe('network-error');
		expect(info.label).toBe('Error');
	});

	it('returns network-error with "Network Error" label when error string provided', () => {
		const info = getStatusInfo(0, 'Failed to fetch');
		expect(info.category).toBe('network-error');
		expect(info.label).toBe('Network Error');
	});

	it('returns network-error when error string provided even with non-zero status', () => {
		const info = getStatusInfo(200, 'Some error');
		expect(info.category).toBe('network-error');
		expect(info.label).toBe('Network Error');
	});

	it('boundary: 200 is success, 299 is success', () => {
		expect(getStatusInfo(200).category).toBe('success');
		expect(getStatusInfo(299).category).toBe('success');
	});

	it('boundary: 300 is redirect, 399 is redirect', () => {
		expect(getStatusInfo(300).category).toBe('redirect');
		expect(getStatusInfo(399).category).toBe('redirect');
	});

	it('boundary: 400 is client-error, 499 is client-error', () => {
		expect(getStatusInfo(400).category).toBe('client-error');
		expect(getStatusInfo(499).category).toBe('client-error');
	});

	it('returns color properties for all categories', () => {
		const success = getStatusInfo(200);
		expect(success.bgColor).toBeTruthy();
		expect(success.textColor).toBeTruthy();
		expect(success.badgeBg).toBeTruthy();

		const error = getStatusInfo(0);
		expect(error.bgColor).toBeTruthy();
		expect(error.textColor).toBeTruthy();
		expect(error.badgeBg).toBeTruthy();
	});
});
