export async function executeInteraction(
	baseUrl: string,
	name: string,
	parameters: Record<string, unknown>,
	bearerToken?: string,
	signal?: AbortSignal,
	customHeaders?: Record<string, string>
): Promise<unknown> {
	const headers: Record<string, string> = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		...customHeaders
	};

	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const response = await fetch(`${baseUrl}/interactions/execute`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ name, parameters }),
		signal
	});

	if (!response.ok) {
		throw new Error(`Interaction failed: ${response.status} ${response.statusText}`);
	}

	const contentType = response.headers.get('content-type') || '';
	return contentType.includes('json') ? await response.json() : await response.text();
}
