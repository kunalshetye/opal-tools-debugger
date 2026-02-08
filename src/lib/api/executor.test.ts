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
});
