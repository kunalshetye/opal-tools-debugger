export function isIslandResponse(body: unknown): body is {
	type: 'island';
	message?: string;
	config?: { islands?: unknown[] };
} {
	if (body === null || typeof body !== 'object' || Array.isArray(body)) return false;
	const record = body as Record<string, unknown>;
	const config = record.config;
	return record.type === 'island'
		&& config !== null
		&& typeof config === 'object'
		&& Array.isArray((config as Record<string, unknown>).islands);
}
