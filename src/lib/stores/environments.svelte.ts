import { browser } from '$app/environment';

const STORAGE_KEY = 'opal-debugger-environments';

export interface Environment {
	name: string;
	vars: Record<string, string>;
}

interface EnvironmentsData {
	environments: Environment[];
	selectedIndex: number;
}

function loadFromStorage(): EnvironmentsData {
	if (!browser) return { environments: [], selectedIndex: -1 };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}
	return { environments: [], selectedIndex: -1 };
}

function saveToStorage(data: EnvironmentsData) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let state: EnvironmentsData = $state(loadFromStorage());

export const environmentsState = {
	get environments() { return state.environments; },
	get selectedIndex() { return state.selectedIndex; },
	get selectedEnvironment(): Environment | null {
		return state.selectedIndex >= 0 ? state.environments[state.selectedIndex] ?? null : null;
	},
	get currentVars(): Record<string, string> {
		const env = this.selectedEnvironment;
		return env ? env.vars : {};
	}
};

export function selectEnvironment(index: number) {
	state.selectedIndex = index;
	saveToStorage(state);
}

export function addEnvironment(name: string, vars: Record<string, string>) {
	state.environments = [...state.environments, { name, vars }];
	state.selectedIndex = state.environments.length - 1;
	saveToStorage(state);
}

export function updateEnvironment(index: number, name: string, vars: Record<string, string>) {
	state.environments = state.environments.map((e, i) =>
		i === index ? { name, vars } : e
	);
	saveToStorage(state);
}

export function removeEnvironment(index: number) {
	state.environments = state.environments.filter((_, i) => i !== index);
	if (state.selectedIndex >= state.environments.length) {
		state.selectedIndex = state.environments.length - 1;
	}
	saveToStorage(state);
}
