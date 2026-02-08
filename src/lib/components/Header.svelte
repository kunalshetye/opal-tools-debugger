<script lang="ts">
	import { connectionState, disconnect, connect } from '$lib/stores/connection.svelte';
	import { clearTools, setTools, setLoading } from '$lib/stores/tools.svelte';
	import { historyState } from '$lib/stores/history.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { clearSelection, clearAllResults } from '$lib/stores/ui.svelte';
	import { environmentsState, selectEnvironment, addEnvironment, updateEnvironment, removeEnvironment } from '$lib/stores/environments.svelte';
	import { fetchDiscovery } from '$lib/api/discovery';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { logInfo, logSuccess, logError, logWarning } from '$lib/stores/activity-log.svelte';
	import { isSandboxMode } from '$lib/sandbox/constants';
	import ActivityLogToggle from './ActivityLogToggle.svelte';
	import EnvironmentEditor from './EnvironmentEditor.svelte';

	let dropdownOpen = $state(false);
	let switching = $state(false);
	let envDropdownOpen = $state(false);
	let editingEnvIndex: number | 'new' | null = $state(null);

	const isSandbox = $derived(isSandboxMode(connectionState.discoveryUrl));

	// Connection health
	let healthStatus: 'healthy' | 'slow' | 'unreachable' | null = $state(null);
	let healthInterval: ReturnType<typeof setInterval> | null = null;

	const otherConnections = $derived(
		historyState.filter(
			(e) => e.discoveryUrl.toLowerCase() !== connectionState.discoveryUrl.toLowerCase()
		)
	);

	const healthDotColor = $derived(() => {
		if (switching) return 'bg-amber-500 animate-pulse';
		if (!healthStatus || healthStatus === 'healthy') return 'bg-emerald-500';
		if (healthStatus === 'slow') return 'bg-amber-500';
		return 'bg-red-500';
	});

	async function checkHealth() {
		if (!connectionState.connected || !connectionState.discoveryUrl) return;
		if (isSandbox) {
			healthStatus = 'healthy';
			return;
		}
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const start = performance.now();
		try {
			await fetch(connectionState.discoveryUrl, {
				method: 'HEAD',
				signal: controller.signal
			});
			const duration = performance.now() - start;
			const newStatus = duration > 2000 ? 'slow' : 'healthy';
			if (healthStatus !== newStatus) {
				if (newStatus === 'slow') {
					logWarning('connection', `Connection slow (${Math.round(duration)}ms)`);
				} else if (healthStatus === 'slow' || healthStatus === 'unreachable') {
					logInfo('connection', 'Connection restored');
				}
				healthStatus = newStatus;
			}
		} catch {
			if (healthStatus !== 'unreachable') {
				logError('connection', 'Connection health check failed — endpoint unreachable');
				healthStatus = 'unreachable';
			}
		} finally {
			clearTimeout(timeout);
		}
	}

	function startHealthCheck() {
		stopHealthCheck();
		if (connectionState.connected) {
			checkHealth();
			healthInterval = setInterval(checkHealth, 60000);
		}
	}

	function stopHealthCheck() {
		if (healthInterval) {
			clearInterval(healthInterval);
			healthInterval = null;
		}
		healthStatus = null;
	}

	$effect(() => {
		if (connectionState.connected) {
			startHealthCheck();
		} else {
			stopHealthCheck();
		}
	});

	onDestroy(() => {
		stopHealthCheck();
	});

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
		if (!target.closest('[data-env-dropdown]')) {
			envDropdownOpen = false;
		}
	}

	function formatUrl(url: string): string {
		try {
			return new URL(url).origin;
		} catch {
			return url;
		}
	}

	function handleNewEnv() {
		editingEnvIndex = 'new';
		envDropdownOpen = false;
	}

	function handleEditEnv(index: number, e: MouseEvent) {
		e.stopPropagation();
		editingEnvIndex = index;
		envDropdownOpen = false;
	}

	function handleSaveEnv(name: string, vars: Record<string, string>) {
		if (editingEnvIndex === 'new') {
			addEnvironment(name, vars);
		} else if (editingEnvIndex !== null) {
			updateEnvironment(editingEnvIndex, name, vars);
		}
		editingEnvIndex = null;
	}

	function handleEnvSelect(index: number) {
		selectEnvironment(index);
		envDropdownOpen = false;
	}

	function handleRemoveEnv(index: number, e: MouseEvent) {
		e.stopPropagation();
		removeEnvironment(index);
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
						class="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition hover:bg-zinc-50 dark:hover:bg-zinc-800 {isSandbox ? 'border-amber-300 dark:border-amber-600' : 'border-zinc-200 dark:border-zinc-700'} {dropdownOpen ? 'bg-zinc-50 dark:bg-zinc-800' : ''}"
						disabled={switching}
					>
						<span class="h-1.5 w-1.5 shrink-0 rounded-full {healthDotColor()}"></span>
						{#if isSandbox}
							<span class="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
								</svg>
								Sandbox
							</span>
						{:else}
							<span class="max-w-48 truncate text-zinc-600 dark:text-zinc-400">
								{formatUrl(connectionState.discoveryUrl)}
							</span>
						{/if}
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
									onclick={() => { clearAllResults(); dropdownOpen = false; }}
									class="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Clear all execution history
								</button>
								<button
									type="button"
									onclick={handleDisconnect}
									class="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									{isSandbox ? 'Exit Sandbox' : 'Disconnect'}
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Environment selector -->
				<div class="relative" data-env-dropdown>
					<button
						onclick={() => (envDropdownOpen = !envDropdownOpen)}
						class="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 {envDropdownOpen ? 'bg-zinc-50 dark:bg-zinc-800' : ''}"
						title="Environment variables"
					>
						<svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span class="max-w-24 truncate text-zinc-500 dark:text-zinc-400">
							{environmentsState.selectedEnvironment?.name ?? 'No env'}
						</span>
					</button>

					{#if envDropdownOpen}
						<div class="absolute right-0 z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
							<div class="px-3 pt-2.5 pb-1.5">
								<span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Environments</span>
							</div>

							<button
								type="button"
								onclick={() => { selectEnvironment(-1); envDropdownOpen = false; }}
								class="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50 {environmentsState.selectedIndex === -1 ? 'bg-zinc-50 font-medium dark:bg-zinc-700/50' : ''}"
							>
								None
							</button>

							{#each environmentsState.environments as env, i}
								<div class="group flex items-center">
									<button
										type="button"
										onclick={() => handleEnvSelect(i)}
										class="flex-1 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/50 {environmentsState.selectedIndex === i ? 'bg-zinc-50 font-medium dark:bg-zinc-700/50' : ''}"
									>
										{env.name}
										<span class="ml-1 text-[10px] text-zinc-400">({Object.keys(env.vars).length} vars)</span>
									</button>
									<button
										type="button"
										onclick={(e) => handleEditEnv(i, e)}
										class="mr-1 hidden rounded p-0.5 text-zinc-400 hover:text-indigo-500 group-hover:block"
										aria-label="Edit environment"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
									</button>
									<button
										type="button"
										onclick={(e) => handleRemoveEnv(i, e)}
										class="mr-2 hidden rounded p-0.5 text-zinc-400 hover:text-red-500 group-hover:block"
										aria-label="Remove environment"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/each}

							<div class="border-t border-zinc-100 px-3 py-2 dark:border-zinc-700">
								<button
									onclick={handleNewEnv}
									class="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400"
								>
									+ New environment
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

{#if editingEnvIndex === 'new'}
	<EnvironmentEditor
		environment={{ name: '', vars: {} }}
		onsave={handleSaveEnv}
		onclose={() => (editingEnvIndex = null)}
	/>
{:else if editingEnvIndex !== null && environmentsState.environments[editingEnvIndex]}
	<EnvironmentEditor
		environment={environmentsState.environments[editingEnvIndex]}
		onsave={handleSaveEnv}
		onclose={() => (editingEnvIndex = null)}
	/>
{/if}
