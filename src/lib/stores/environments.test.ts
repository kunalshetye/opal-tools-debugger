import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));

// Dynamic import so the mock is in place before the module loads
const {
	environmentsState,
	addEnvironment,
	selectEnvironment,
	updateEnvironment,
	removeEnvironment
} = await import('./environments.svelte');

describe('environments store', () => {
	// Reset state before each test by removing all environments
	beforeEach(() => {
		while (environmentsState.environments.length > 0) {
			removeEnvironment(0);
		}
		selectEnvironment(-1);
	});

	describe('environmentsState (initial)', () => {
		it('starts with empty environments', () => {
			expect(environmentsState.environments).toEqual([]);
		});

		it('starts with selectedIndex -1', () => {
			expect(environmentsState.selectedIndex).toBe(-1);
		});

		it('selectedEnvironment is null when none selected', () => {
			expect(environmentsState.selectedEnvironment).toBeNull();
		});

		it('currentVars returns empty object when none selected', () => {
			expect(environmentsState.currentVars).toEqual({});
		});
	});

	describe('addEnvironment', () => {
		it('adds an environment and auto-selects it', () => {
			addEnvironment('dev', { API_URL: 'http://localhost' });

			expect(environmentsState.environments).toHaveLength(1);
			expect(environmentsState.environments[0]).toEqual({
				name: 'dev',
				vars: { API_URL: 'http://localhost' }
			});
			expect(environmentsState.selectedIndex).toBe(0);
		});

		it('adds multiple environments and selects the last one added', () => {
			addEnvironment('dev', { API_URL: 'http://localhost' });
			addEnvironment('staging', { API_URL: 'https://staging.example.com' });
			addEnvironment('prod', { API_URL: 'https://example.com' });

			expect(environmentsState.environments).toHaveLength(3);
			expect(environmentsState.selectedIndex).toBe(2);
			expect(environmentsState.environments[0].name).toBe('dev');
			expect(environmentsState.environments[1].name).toBe('staging');
			expect(environmentsState.environments[2].name).toBe('prod');
		});
	});

	describe('selectEnvironment', () => {
		it('changes the selected index', () => {
			addEnvironment('dev', { KEY: 'dev-val' });
			addEnvironment('prod', { KEY: 'prod-val' });

			selectEnvironment(0);
			expect(environmentsState.selectedIndex).toBe(0);

			selectEnvironment(1);
			expect(environmentsState.selectedIndex).toBe(1);
		});

		it('deselects when set to -1', () => {
			addEnvironment('dev', { KEY: 'val' });
			expect(environmentsState.selectedIndex).toBe(0);

			selectEnvironment(-1);
			expect(environmentsState.selectedIndex).toBe(-1);
			expect(environmentsState.selectedEnvironment).toBeNull();
		});
	});

	describe('updateEnvironment', () => {
		it('updates name and vars at the given index', () => {
			addEnvironment('dev', { KEY: 'old-val' });
			addEnvironment('prod', { KEY: 'prod-val' });

			updateEnvironment(0, 'development', { KEY: 'new-val', EXTRA: 'extra-val' });

			expect(environmentsState.environments[0]).toEqual({
				name: 'development',
				vars: { KEY: 'new-val', EXTRA: 'extra-val' }
			});
			// Other environments remain unchanged
			expect(environmentsState.environments[1]).toEqual({
				name: 'prod',
				vars: { KEY: 'prod-val' }
			});
		});
	});

	describe('removeEnvironment', () => {
		it('removes the environment at the given index', () => {
			addEnvironment('dev', { KEY: 'dev' });
			addEnvironment('staging', { KEY: 'staging' });
			addEnvironment('prod', { KEY: 'prod' });

			removeEnvironment(1);

			expect(environmentsState.environments).toHaveLength(2);
			expect(environmentsState.environments[0].name).toBe('dev');
			expect(environmentsState.environments[1].name).toBe('prod');
		});

		it('adjusts selectedIndex when removing the last selected item', () => {
			addEnvironment('dev', { KEY: 'dev' });
			addEnvironment('prod', { KEY: 'prod' });
			// selectedIndex is 1 (last added)

			removeEnvironment(1);

			// selectedIndex should adjust to length - 1 = 0
			expect(environmentsState.selectedIndex).toBe(0);
			expect(environmentsState.environments).toHaveLength(1);
		});

		it('adjusts selectedIndex to -1 when removing the only environment', () => {
			addEnvironment('dev', { KEY: 'dev' });
			expect(environmentsState.selectedIndex).toBe(0);

			removeEnvironment(0);

			expect(environmentsState.environments).toHaveLength(0);
			expect(environmentsState.selectedIndex).toBe(-1);
		});

		it('adjusts selectedIndex when it would be >= environments length', () => {
			addEnvironment('a', {});
			addEnvironment('b', {});
			addEnvironment('c', {});
			// selectedIndex is 2

			removeEnvironment(2);

			// length is now 2, selectedIndex was 2, should become 1
			expect(environmentsState.selectedIndex).toBe(1);
		});
	});

	describe('selectedEnvironment and currentVars', () => {
		it('returns the correct environment after add + select', () => {
			addEnvironment('dev', { API_URL: 'http://localhost', TOKEN: 'abc' });
			addEnvironment('prod', { API_URL: 'https://example.com', TOKEN: 'xyz' });

			selectEnvironment(0);
			expect(environmentsState.selectedEnvironment).toEqual({
				name: 'dev',
				vars: { API_URL: 'http://localhost', TOKEN: 'abc' }
			});
			expect(environmentsState.currentVars).toEqual({
				API_URL: 'http://localhost',
				TOKEN: 'abc'
			});

			selectEnvironment(1);
			expect(environmentsState.selectedEnvironment).toEqual({
				name: 'prod',
				vars: { API_URL: 'https://example.com', TOKEN: 'xyz' }
			});
			expect(environmentsState.currentVars).toEqual({
				API_URL: 'https://example.com',
				TOKEN: 'xyz'
			});
		});

		it('returns null and empty object when deselected', () => {
			addEnvironment('dev', { KEY: 'val' });
			selectEnvironment(-1);

			expect(environmentsState.selectedEnvironment).toBeNull();
			expect(environmentsState.currentVars).toEqual({});
		});
	});
});
