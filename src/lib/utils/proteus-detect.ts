export const PROTEUS_MIME_TYPE = 'application/vnd.opal.proteus+json';

export function isProteusDocument(body: unknown): body is Record<string, unknown> {
	return body !== null
		&& typeof body === 'object'
		&& !Array.isArray(body)
		&& (body as Record<string, unknown>).$type === 'Document';
}

export function parseResourceText(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
