import type { ToolExecutionResult } from '$lib/types';

export async function executeTool(
	baseUrl: string,
	endpoint: string,
	params: Record<string, unknown>,
	bearerToken?: string,
	method: string = 'POST',
	signal?: AbortSignal,
	customHeaders?: Record<string, string>
): Promise<ToolExecutionResult> {
	const upperMethod = method.toUpperCase();
	const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(upperMethod);

	let url = `${baseUrl}${endpoint}`;
	if (!isBodyMethod && Object.keys(params).length > 0) {
		const qs = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			qs.append(k, String(v));
		}
		url += `?${qs.toString()}`;
	}

	const headers: Record<string, string> = {
		Accept: 'application/json',
		...customHeaders
	};

	if (isBodyMethod) {
		headers['Content-Type'] = 'application/json';
	}

	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const requestPayload = { parameters: params };
	const requestBody = isBodyMethod ? JSON.stringify(requestPayload) : undefined;
	const requestSize = requestBody ? new Blob([requestBody]).size : 0;
	const start = performance.now();

	try {
		const response = await fetch(url, {
			method: upperMethod,
			headers,
			body: requestBody,
			signal
		});

		const duration = Math.round(performance.now() - start);

		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		let body: unknown;
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('json')) {
			body = await response.json();
		} else {
			body = await response.text();
		}

		return {
			status: response.status,
			headers: responseHeaders,
			body,
			duration,
			requestSize,
			requestParams: params,
			requestUrl: url,
			requestMethod: upperMethod,
			requestHeaders: headers
		};
	} catch (err) {
		const duration = Math.round(performance.now() - start);
		const isAbort = err instanceof DOMException && err.name === 'AbortError';
		return {
			status: 0,
			headers: {},
			body: null,
			duration,
			requestSize,
			error: isAbort ? 'Request cancelled' : (err instanceof Error ? err.message : 'Unknown error'),
			requestParams: params,
			requestUrl: url,
			requestMethod: upperMethod,
			requestHeaders: headers
		};
	}
}
