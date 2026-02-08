import type { DiscoveryResponse } from '$lib/types';

export async function fetchDiscovery(
	url: string,
	bearerToken?: string
): Promise<DiscoveryResponse> {
	const headers: Record<string, string> = {
		Accept: 'application/json'
	};

	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const response = await fetch(url, { headers });

	if (!response.ok) {
		throw new Error(`Discovery failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	if (!data.functions || !Array.isArray(data.functions)) {
		throw new Error('Invalid discovery response: missing "functions" array');
	}

	return data as DiscoveryResponse;
}
