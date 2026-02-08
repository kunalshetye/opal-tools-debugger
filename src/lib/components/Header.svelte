<script lang="ts">
	import { connectionState, disconnect, connect } from '$lib/stores/connection.svelte';
	import { clearTools, setTools, setLoading } from '$lib/stores/tools.svelte';
	import { historyState } from '$lib/stores/history.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { clearSelection } from '$lib/stores/ui.svelte';
	import { fetchDiscovery } from '$lib/api/discovery';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { logInfo, logSuccess, logError } from '$lib/stores/activity-log.svelte';
	import ActivityLogToggle from './ActivityLogToggle.svelte';

	let dropdownOpen = $state(false);
	let switching = $state(false);

	const otherConnections = $derived(
		historyState.filter(
			(e) => e.discoveryUrl.toLowerCase() !== connectionState.discoveryUrl.toLowerCase()
		)
	);

	function handleDisconnect() {
		logInfo('connection', `Disconnected from ${connectionState.discoveryUrl}`);
		dropdownOpen = false;
		clearTools();
		disconnect();
		goto('/');
	}

	async function switchTo(entry: { discoveryUrl: string; bearerToken: string }) {
		switching = true;
		logInfo('connection', `Switching to ${entry.discoveryUrl}...`);
		try {
			setLoading();
			const data = await fetchDiscovery(entry.discoveryUrl, entry.bearerToken || undefined);
			clearSelection();
			connect(entry.discoveryUrl, entry.bearerToken);
			setTools(data.functions);
			logSuccess('connection', `Switched to ${entry.discoveryUrl} (${data.functions.length} tools)`);

			// If not already on tools page, navigate there
			if (!$page.url.pathname.startsWith('/tools')) {
				goto('/tools');
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to switch connection';
			logError('connection', `Failed to switch to ${entry.discoveryUrl}: ${msg}`);
			console.error('Failed to switch connection:', err);
		} finally {
			switching = false;
			dropdownOpen = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-connection-dropdown]')) {
			dropdownOpen = false;
		}
	}

	function formatUrl(url: string): string {
		try {
			return new URL(url).origin;
		} catch {
			return url;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<header class="border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
	<div class="flex items-center justify-between">
		<a href="/" class="flex items-center gap-2.5">
			<div class="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-xs font-bold text-white">
				O
			</div>
			<h1 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Opal Tools Debugger</h1>
		</a>

		<div class="flex items-center gap-3">
			{#if connectionState.connected}
				<div class="relative" data-connection-dropdown>
					<button
						onclick={() => (dropdownOpen = !dropdownOpen)}
						class="flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1 text-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 {dropdownOpen ? 'bg-zinc-50 dark:bg-zinc-800' : ''}"
						disabled={switching}
					>
						<span class="h-1.5 w-1.5 shrink-0 rounded-full {switching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span>
						<span class="max-w-48 truncate text-zinc-600 dark:text-zinc-400">
							{formatUrl(connectionState.discoveryUrl)}
						</span>
						<svg class="h-3 w-3 shrink-0 text-zinc-400 transition-transform {dropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if dropdownOpen}
						<div class="absolute right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
							{#if otherConnections.length > 0}
								<div class="px-3 pt-2.5 pb-1.5">
									<span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Switch to</span>
								</div>
								<div class="max-h-48 overflow-y-auto">
									{#each otherConnections as entry}
										<button
											type="button"
											onclick={() => switchTo(entry)}
											disabled={switching}
											class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-700/50"
										>
											<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
											<span class="min-w-0 flex-1">
												<span class="block truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
													{formatUrl(entry.discoveryUrl)}
												</span>
												<span class="block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
													{entry.discoveryUrl}
												</span>
											</span>
										</button>
									{/each}
								</div>
							{:else}
								<div class="px-3 py-3 text-xs text-zinc-400 italic dark:text-zinc-500">
									No other connections in history.
								</div>
							{/if}

							<div class="border-t border-zinc-100 dark:border-zinc-700">
								<button
									type="button"
									onclick={handleDisconnect}
									class="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Disconnect
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<ActivityLogToggle />

			<button
				onclick={toggleTheme}
				class="rounded border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
				aria-label="Toggle theme"
			>
				{#if themeState.mode === 'dark'}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</header>
