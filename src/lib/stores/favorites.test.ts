import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));

describe('favorites store', () => {
	let favoritesState: typeof import('./favorites.svelte').favoritesState;
	let toggleFavorite: typeof import('./favorites.svelte').toggleFavorite;

	beforeEach(async () => {
		vi.resetModules();
		const mod = await import('./favorites.svelte');
		favoritesState = mod.favoritesState;
		toggleFavorite = mod.toggleFavorite;
	});

	describe('initial state (browser = false)', () => {
		it('starts with empty data', () => {
			expect(favoritesState.getFavorites('https://example.com')).toEqual([]);
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(false);
		});
	});

	describe('isFavorite', () => {
		it('returns false for an unknown discovery URL', () => {
			expect(favoritesState.isFavorite('https://unknown.com', 'tool-a')).toBe(false);
		});

		it('returns false for an unknown tool name under a known URL', () => {
			toggleFavorite('https://example.com', 'tool-a');
			expect(favoritesState.isFavorite('https://example.com', 'tool-b')).toBe(false);
		});

		it('returns true after toggling a tool as favorite', () => {
			toggleFavorite('https://example.com', 'tool-a');
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(true);
		});
	});

	describe('getFavorites', () => {
		it('returns an empty array for an unknown discovery URL', () => {
			expect(favoritesState.getFavorites('https://unknown.com')).toEqual([]);
		});

		it('returns the correct list after adding favorites', () => {
			toggleFavorite('https://example.com', 'tool-a');
			toggleFavorite('https://example.com', 'tool-b');
			expect(favoritesState.getFavorites('https://example.com')).toEqual(['tool-a', 'tool-b']);
		});
	});

	describe('toggleFavorite', () => {
		it('adds a tool as a favorite', () => {
			toggleFavorite('https://example.com', 'tool-a');
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(true);
			expect(favoritesState.getFavorites('https://example.com')).toEqual(['tool-a']);
		});

		it('removes a favorite on second toggle', () => {
			toggleFavorite('https://example.com', 'tool-a');
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(true);

			toggleFavorite('https://example.com', 'tool-a');
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(false);
			expect(favoritesState.getFavorites('https://example.com')).toEqual([]);
		});

		it('works across different discovery URLs independently', () => {
			toggleFavorite('https://alpha.com', 'tool-x');
			toggleFavorite('https://beta.com', 'tool-y');

			expect(favoritesState.isFavorite('https://alpha.com', 'tool-x')).toBe(true);
			expect(favoritesState.isFavorite('https://alpha.com', 'tool-y')).toBe(false);

			expect(favoritesState.isFavorite('https://beta.com', 'tool-y')).toBe(true);
			expect(favoritesState.isFavorite('https://beta.com', 'tool-x')).toBe(false);
		});

		it('allows multiple tools to be favorited for the same URL', () => {
			toggleFavorite('https://example.com', 'tool-a');
			toggleFavorite('https://example.com', 'tool-b');
			toggleFavorite('https://example.com', 'tool-c');

			expect(favoritesState.getFavorites('https://example.com')).toEqual([
				'tool-a',
				'tool-b',
				'tool-c'
			]);
			expect(favoritesState.isFavorite('https://example.com', 'tool-a')).toBe(true);
			expect(favoritesState.isFavorite('https://example.com', 'tool-b')).toBe(true);
			expect(favoritesState.isFavorite('https://example.com', 'tool-c')).toBe(true);
		});
	});
});
