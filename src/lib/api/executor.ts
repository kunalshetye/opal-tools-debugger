import type { ToolExecutionResult } from '$lib/types';

export async function executeTool(
	baseUrl: string,
	endpoint: string,
	params: Record<string, unknown>,
	bearerToken?: string
): Promise<ToolExecutionResult> {
	const url = `${baseUrl}${endpoint}`;
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	};

	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const requestBody = JSON.stringify(params);
	const requestSize = new Blob([requestBody]).size;
	const start = performance.now();

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: requestBody
		});

		const duration = Math.round(performance.now() - start);

		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		let body: unknown;
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			body = await response.json();
		} else {
			body = await response.text();
		}

		return {
			status: response.status,
			headers: responseHeaders,
			body,
			duration,
			requestSize
		};
	} catch (err) {
		const duration = Math.round(performance.now() - start);
		return {
			status: 0,
			headers: {},
			body: null,
			duration,
			requestSize,
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
}
