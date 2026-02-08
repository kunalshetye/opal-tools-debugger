export function resolveTemplate(value: string, vars: Record<string, string>): string {
	return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return key in vars ? vars[key] : match;
	});
}

export function resolveAllTemplates(
	params: Record<string, unknown>,
	vars: Record<string, string>
): Record<string, unknown> {
	const resolved: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (typeof value === 'string') {
			resolved[key] = resolveTemplate(value, vars);
		} else {
			resolved[key] = value;
		}
	}
	return resolved;
}

export function hasTemplateTokens(value: string): boolean {
	return /\{\{\w+\}\}/.test(value);
}
