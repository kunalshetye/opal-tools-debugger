export function generateCurl(
	method: string,
	url: string,
	headers: Record<string, string>,
	body?: string
): string {
	const parts: string[] = ['curl'];

	if (method !== 'GET') {
		parts.push(`-X ${method}`);
	}

	parts.push(`'${escapeQuotes(url)}'`);

	for (const [key, value] of Object.entries(headers)) {
		parts.push(`-H '${escapeQuotes(key)}: ${escapeQuotes(value)}'`);
	}

	if (body) {
		parts.push(`-d '${escapeQuotes(body)}'`);
	}

	return parts.join(' \\\n  ');
}

function escapeQuotes(str: string): string {
	return str.replace(/'/g, "'\\''");
}

export function generateCurlFromResult(result: {
	requestMethod?: string;
	requestUrl?: string;
	requestHeaders?: Record<string, string>;
	requestParams?: Record<string, unknown>;
}): string | null {
	if (!result.requestUrl || !result.requestMethod) return null;

	const method = result.requestMethod;
	const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(method);
	const body = isBodyMethod && result.requestParams
		? JSON.stringify({ parameters: result.requestParams })
		: undefined;

	return generateCurl(method, result.requestUrl, result.requestHeaders ?? {}, body);
}
