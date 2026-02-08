/**
 * Detects whether a response body is an Adaptive Block Document (ABD).
 *
 * Primary check: body.content.$type === "Block.Document"
 * Secondary check: content-type header contains "application/vnd.opal.block+json"
 */
export function isAbdResponse(
	body: unknown,
	headers?: Record<string, string>
): boolean {
	// Primary: check body shape
	if (
		body !== null &&
		typeof body === 'object' &&
		!Array.isArray(body) &&
		'content' in body
	) {
		const content = (body as Record<string, unknown>).content;
		if (
			content !== null &&
			typeof content === 'object' &&
			!Array.isArray(content) &&
			'$type' in content &&
			(content as Record<string, unknown>).$type === 'Block.Document'
		) {
			return true;
		}
	}

	// Secondary: check content-type header
	if (headers) {
		const contentType =
			headers['content-type'] ?? headers['Content-Type'] ?? '';
		if (contentType.includes('application/vnd.opal.block+json')) {
			return true;
		}
	}

	return false;
}
