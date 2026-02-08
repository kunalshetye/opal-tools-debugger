import type { OpalFunction } from '$lib/types';

interface ToolsState {
	functions: OpalFunction[];
	loading: boolean;
	error: string | null;
}

export const toolsState: ToolsState = $state({
	functions: [],
	loading: false,
	error: null
});

export function setTools(functions: OpalFunction[]) {
	toolsState.functions = functions;
	toolsState.loading = false;
	toolsState.error = null;
}

export function setLoading() {
	toolsState.loading = true;
	toolsState.error = null;
}

export function setError(error: string) {
	toolsState.loading = false;
	toolsState.error = error;
}

export function clearTools() {
	toolsState.functions = [];
	toolsState.loading = false;
	toolsState.error = null;
}

export function getToolByName(name: string): OpalFunction | undefined {
	return toolsState.functions.find((f) => f.name === name);
}
