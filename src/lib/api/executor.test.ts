import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTool } from './executor';

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
	mockFetch.mockReset();
});

function makeResponse(
	body: unknown,
	options: {
		status?: number;
		contentType?: string;
		headers?: Record<string, string>;
	} = {}
) {
	const { status = 200, contentType = 'application/json', headers = {} } = options;
	const allHeaders = new Map<string, string>(Object.entries({ 'content-type': contentType, ...headers }));

	return {
		ok: status >= 200 && status < 300,
		status,
		headers: {
			get: (key: string) => allHeaders.get(key.toLowerCase()) ?? null,
			forEach: (cb: (value: string, key: string) => void) => allHeaders.forEach(cb)
		},
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body))
	};
}

describe('executeTool', () => {
	it('returns status, headers, body, duration, and requestSize on successful JSON response', async () => {
		mockFetch.mockResolvedValue(makeResponse({ result: 'ok' }));

		const result = await executeTool('https://api.example.com', '/run', { key: 'val' });

		expect(result.status).toBe(200);
		expect(result.body).toEqual({ result: 'ok' });
		expect(result.duration).toBeGreaterThanOrEqual(0);
		expect(result.requestSize).toBeGreaterThan(0);
		expect(result.headers).toHaveProperty('content-type', 'application/json');
		expect(result.error).toBeUndefined();
	});

	it('returns string body for non-JSON content-type', async () => {
		mockFetch.mockResolvedValue(makeResponse('plain text response', { contentType: 'text/plain' }));

		const result = await executeTool('https://api.example.com', '/run', {});

		expect(result.body).toBe('plain text response');
	});

	it('adds Authorization Bearer header when token is provided', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool('https://api.example.com', '/run', { a: 1 }, 'secret-token');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/run',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer secret-token'
				})
			})
		);
	});

	it('does not add Authorization header when token is omitted', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool('https://api.example.com', '/run', {});

		const callHeaders = mockFetch.mock.calls[0][1].headers;
		expect(callHeaders).not.toHaveProperty('Authorization');
	});

	it('sends POST with JSON body to the correct URL', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool('https://api.example.com', '/tools/run', { foo: 'bar' });

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/tools/run',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ foo: 'bar' }),
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		);
	});

	it('returns status 0 and error message on network failure', async () => {
		mockFetch.mockRejectedValue(new Error('Network unreachable'));

		const result = await executeTool('https://api.example.com', '/run', {});

		expect(result.status).toBe(0);
		expect(result.error).toBe('Network unreachable');
		expect(result.body).toBeNull();
		expect(result.duration).toBeGreaterThanOrEqual(0);
	});

	it('sends GET request with query string params when method is GET', async () => {
		mockFetch.mockResolvedValue(makeResponse({ ok: true }));

		const result = await executeTool('https://api.example.com', '/search', { q: 'hello', limit: 10 }, undefined, 'GET');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/search?q=hello&limit=10',
			expect.objectContaining({
				method: 'GET',
				body: undefined
			})
		);
		expect(result.requestMethod).toBe('GET');
		expect(result.requestUrl).toBe('https://api.example.com/search?q=hello&limit=10');
		expect(result.requestSize).toBe(0);
	});

	it('sends DELETE request with query string params', async () => {
		mockFetch.mockResolvedValue(makeResponse(null, { status: 204, contentType: 'text/plain' }));

		await executeTool('https://api.example.com', '/items', { id: '123' }, undefined, 'DELETE');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/items?id=123',
			expect.objectContaining({
				method: 'DELETE',
				body: undefined
			})
		);
	});

	it('sends PUT request with JSON body', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool('https://api.example.com', '/items', { name: 'test' }, undefined, 'PUT');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/items',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({ name: 'test' }),
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		);
	});

	it('stores request metadata in result', async () => {
		mockFetch.mockResolvedValue(makeResponse({ ok: true }));

		const result = await executeTool('https://api.example.com', '/run', { key: 'val' }, 'token', 'POST');

		expect(result.requestParams).toEqual({ key: 'val' });
		expect(result.requestUrl).toBe('https://api.example.com/run');
		expect(result.requestMethod).toBe('POST');
		expect(result.requestHeaders).toHaveProperty('Authorization', 'Bearer token');
	});

	it('merges custom headers with defaults', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool(
			'https://api.example.com', '/run', {}, undefined, 'POST', undefined,
			{ 'X-Custom': 'value' }
		);

		const callHeaders = mockFetch.mock.calls[0][1].headers;
		expect(callHeaders).toHaveProperty('X-Custom', 'value');
		expect(callHeaders).toHaveProperty('Content-Type', 'application/json');
	});

	it('GET request does not include Content-Type header', async () => {
		mockFetch.mockResolvedValue(makeResponse({}));

		await executeTool('https://api.example.com', '/run', {}, undefined, 'GET');

		const callHeaders = mockFetch.mock.calls[0][1].headers;
		expect(callHeaders).not.toHaveProperty('Content-Type');
	});

	it('returns status 0 and "Request cancelled" error when abort signal fires', async () => {
		const abortError = new DOMException('The operation was aborted.', 'AbortError');
		mockFetch.mockRejectedValue(abortError);

		const controller = new AbortController();
		const result = await executeTool(
			'https://api.example.com', '/run', { key: 'val' }, undefined, 'POST', controller.signal
		);

		expect(result.status).toBe(0);
		expect(result.error).toBe('Request cancelled');
		expect(result.body).toBeNull();
		expect(result.headers).toEqual({});
		expect(result.duration).toBeGreaterThanOrEqual(0);
	});

	it('sends PATCH request with JSON body like POST and PUT', async () => {
		mockFetch.mockResolvedValue(makeResponse({ patched: true }));

		await executeTool('https://api.example.com', '/items/1', { name: 'updated' }, undefined, 'PATCH');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/items/1',
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ name: 'updated' }),
				headers: expect.objectContaining({
					'Content-Type': 'application/json'
				})
			})
		);
	});

	it('does not append query string when GET params object is empty', async () => {
		mockFetch.mockResolvedValue(makeResponse({ ok: true }));

		const result = await executeTool('https://api.example.com', '/search', {}, undefined, 'GET');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/search',
			expect.objectContaining({
				method: 'GET',
				body: undefined
			})
		);
		expect(result.requestUrl).toBe('https://api.example.com/search');
	});

	it('custom headers override default Accept header', async () => {
		mockFetch.mockResolvedValue(makeResponse('data', { contentType: 'text/xml' }));

		await executeTool(
			'https://api.example.com', '/run', {}, undefined, 'GET', undefined,
			{ Accept: 'text/xml' }
		);

		const callHeaders = mockFetch.mock.calls[0][1].headers;
		expect(callHeaders['Accept']).toBe('text/xml');
	});

	it('preserves request metadata even on network failure', async () => {
		mockFetch.mockRejectedValue(new Error('DNS resolution failed'));

		const result = await executeTool(
			'https://api.example.com', '/tools/run', { foo: 'bar' }, 'mytoken', 'PUT'
		);

		expect(result.status).toBe(0);
		expect(result.error).toBe('DNS resolution failed');
		expect(result.requestParams).toEqual({ foo: 'bar' });
		expect(result.requestUrl).toBe('https://api.example.com/tools/run');
		expect(result.requestMethod).toBe('PUT');
		expect(result.requestHeaders).toHaveProperty('Authorization', 'Bearer mytoken');
		expect(result.requestHeaders).toHaveProperty('Content-Type', 'application/json');
	});

	it('handles method in lowercase by converting to uppercase', async () => {
		mockFetch.mockResolvedValue(makeResponse({ ok: true }));

		const result = await executeTool(
			'https://api.example.com', '/search', { q: 'test' }, undefined, 'get'
		);

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.example.com/search?q=test',
			expect.objectContaining({
				method: 'GET',
				body: undefined
			})
		);
		expect(result.requestMethod).toBe('GET');
	});
});
