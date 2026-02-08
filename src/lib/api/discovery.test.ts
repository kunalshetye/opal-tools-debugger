import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDiscovery } from './discovery';

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
	mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200, statusText = 'OK') {
	return Promise.resolve({
		ok: status >= 200 && status < 300,
		status,
		statusText,
		json: () => Promise.resolve(data)
	});
}

describe('fetchDiscovery', () => {
	it('returns parsed data on successful response with functions array', async () => {
		const data = { functions: [{ name: 'test-tool', description: 'A tool', endpoint: '/test', http_method: 'POST', parameters: [] }] };
		mockFetch.mockReturnValue(jsonResponse(data));

		const result = await fetchDiscovery('https://example.com/discovery');

		expect(result).toEqual(data);
		expect(result.functions).toHaveLength(1);
	});

	it('adds Authorization Bearer header when token is provided', async () => {
		mockFetch.mockReturnValue(jsonResponse({ functions: [] }));

		await fetchDiscovery('https://example.com/discovery', 'my-token');

		expect(mockFetch).toHaveBeenCalledWith('https://example.com/discovery', {
			headers: {
				Accept: 'application/json',
				Authorization: 'Bearer my-token'
			}
		});
	});

	it('does not add Authorization header when token is omitted', async () => {
		mockFetch.mockReturnValue(jsonResponse({ functions: [] }));

		await fetchDiscovery('https://example.com/discovery');

		expect(mockFetch).toHaveBeenCalledWith('https://example.com/discovery', {
			headers: {
				Accept: 'application/json'
			}
		});
	});

	it('throws on non-OK response', async () => {
		mockFetch.mockReturnValue(jsonResponse({}, 401, 'Unauthorized'));

		await expect(fetchDiscovery('https://example.com/discovery'))
			.rejects.toThrow('Discovery failed: 401 Unauthorized');
	});

	it('throws when response is missing functions key', async () => {
		mockFetch.mockReturnValue(jsonResponse({ tools: [] }));

		await expect(fetchDiscovery('https://example.com/discovery'))
			.rejects.toThrow('Invalid discovery response: missing "functions" array');
	});

	it('throws when functions is not an array', async () => {
		mockFetch.mockReturnValue(jsonResponse({ functions: 'not-an-array' }));

		await expect(fetchDiscovery('https://example.com/discovery'))
			.rejects.toThrow('Invalid discovery response: missing "functions" array');
	});
});
