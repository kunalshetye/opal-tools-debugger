export interface ResourceReadResult {
	uri: string;
	mimeType: string;
	text: string;
}

export async function readResource(
	baseUrl: string,
	uri: string,
	bearerToken?: string,
	signal?: AbortSignal,
	customHeaders?: Record<string, string>
): Promise<ResourceReadResult> {
	const headers: Record<string, string> = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		...customHeaders
	};

	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const response = await fetch(`${baseUrl}/resources/read`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ uri }),
		signal
	});

	if (!response.ok) {
		throw new Error(`Resource read failed: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}
