import { describe, it, expect } from 'vitest';
import { generateCurl, generateCurlFromResult } from './curl-export';

describe('generateCurl', () => {
	it('generates a basic GET request', () => {
		const result = generateCurl('GET', 'https://api.example.com/data', {
			Accept: 'application/json'
		});
		expect(result).toContain('curl');
		expect(result).toContain("'https://api.example.com/data'");
		expect(result).toContain("-H 'Accept: application/json'");
		expect(result).not.toContain('-X');
	});

	it('generates a POST request with body', () => {
		const result = generateCurl(
			'POST',
			'https://api.example.com/run',
			{ 'Content-Type': 'application/json' },
			'{"key":"value"}'
		);
		expect(result).toContain('-X POST');
		expect(result).toContain("-d '{\"key\":\"value\"}'");
	});

	it('escapes single quotes in values', () => {
		const result = generateCurl('GET', "https://api.example.com/data?q=it's", {});
		expect(result).toContain("'https://api.example.com/data?q=it'\\''s'");
	});

	it('includes -X DELETE for DELETE method', () => {
		const result = generateCurl('DELETE', 'https://api.example.com/resource/42', {
			Authorization: 'Bearer token123'
		});
		expect(result).toContain('-X DELETE');
		expect(result).toContain("'https://api.example.com/resource/42'");
		expect(result).not.toContain('-d');
	});

	it('includes -X PUT and -d for PUT method with body', () => {
		const result = generateCurl(
			'PUT',
			'https://api.example.com/resource/42',
			{ 'Content-Type': 'application/json' },
			'{"name":"updated"}'
		);
		expect(result).toContain('-X PUT');
		expect(result).toContain("-d '{\"name\":\"updated\"}'");
	});

	it('includes all headers when multiple are provided', () => {
		const result = generateCurl('GET', 'https://api.example.com/data', {
			Accept: 'application/json',
			Authorization: 'Bearer abc123',
			'X-Custom-Header': 'custom-value'
		});
		expect(result).toContain("-H 'Accept: application/json'");
		expect(result).toContain("-H 'Authorization: Bearer abc123'");
		expect(result).toContain("-H 'X-Custom-Header: custom-value'");
	});

	it('does not include -H flags when headers object is empty', () => {
		const result = generateCurl('GET', 'https://api.example.com/data', {});
		expect(result).not.toContain('-H');
	});

	it('does not include -d flag when body is undefined', () => {
		const result = generateCurl('POST', 'https://api.example.com/run', {
			'Content-Type': 'application/json'
		});
		expect(result).toContain('-X POST');
		expect(result).not.toContain('-d');
	});
});

describe('generateCurlFromResult', () => {
	it('returns null when no request URL', () => {
		expect(generateCurlFromResult({})).toBeNull();
	});

	it('generates curl from a POST result', () => {
		const result = generateCurlFromResult({
			requestMethod: 'POST',
			requestUrl: 'https://api.example.com/run',
			requestHeaders: { 'Content-Type': 'application/json' },
			requestParams: { key: 'val' }
		});
		expect(result).toContain('-X POST');
		expect(result).toContain("-d '{\"key\":\"val\"}'");
	});

	it('generates curl from a GET result without body', () => {
		const result = generateCurlFromResult({
			requestMethod: 'GET',
			requestUrl: 'https://api.example.com/search?q=test',
			requestHeaders: { Accept: 'application/json' }
		});
		expect(result).not.toContain('-d');
	});

	it('generates curl from a DELETE result without body', () => {
		const result = generateCurlFromResult({
			requestMethod: 'DELETE',
			requestUrl: 'https://api.example.com/resource/42',
			requestHeaders: { Authorization: 'Bearer token' }
		});
		expect(result).toContain('-X DELETE');
		expect(result).not.toContain('-d');
	});

	it('generates curl from a PUT result with params as body', () => {
		const result = generateCurlFromResult({
			requestMethod: 'PUT',
			requestUrl: 'https://api.example.com/resource/42',
			requestHeaders: { 'Content-Type': 'application/json' },
			requestParams: { name: 'updated', active: true }
		});
		expect(result).toContain('-X PUT');
		expect(result).toContain("-d '{\"name\":\"updated\",\"active\":true}'");
	});

	it('uses empty headers when requestHeaders is missing', () => {
		const result = generateCurlFromResult({
			requestMethod: 'GET',
			requestUrl: 'https://api.example.com/data'
		});
		expect(result).not.toBeNull();
		expect(result).toContain('curl');
		expect(result).toContain("'https://api.example.com/data'");
		expect(result).not.toContain('-H');
	});

	it('generates curl from a PATCH result with body', () => {
		const result = generateCurlFromResult({
			requestMethod: 'PATCH',
			requestUrl: 'https://api.example.com/resource/42',
			requestHeaders: { 'Content-Type': 'application/json' },
			requestParams: { status: 'archived' }
		});
		expect(result).toContain('-X PATCH');
		expect(result).toContain("-d '{\"status\":\"archived\"}'");
	});
});
