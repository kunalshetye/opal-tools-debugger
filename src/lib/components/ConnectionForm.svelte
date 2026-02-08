<script lang="ts">
	import { fetchDiscovery } from '$lib/api/discovery';
	import { connect } from '$lib/stores/connection.svelte';
	import { setTools, setLoading, setError } from '$lib/stores/tools.svelte';
	import { historyState, removeFromHistory } from '$lib/stores/history.svelte';
	import { goto } from '$app/navigation';
	import { logInfo, logSuccess, logError } from '$lib/stores/activity-log.svelte';

	interface Props {
		initialDiscoveryUrl?: string;
		initialBearerToken?: string;
	}

	let { initialDiscoveryUrl = '', initialBearerToken = '' }: Props = $props();

	let discoveryUrl = $state('');
	let bearerToken = $state('');
	let showToken = $state(false);
	let loading = $state(false);
	let error = $state('');
	let connectingIndex = $state(-1);

	$effect(() => {
		if (initialDiscoveryUrl && !discoveryUrl) discoveryUrl = initialDiscoveryUrl;
		if (initialBearerToken && !bearerToken) bearerToken = initialBearerToken;
	});

	async function handleConnect() {
		if (!discoveryUrl.trim()) return;

		loading = true;
		error = '';
		setLoading();
		logInfo('connection', `Connecting to ${discoveryUrl.trim()}...`);

		try {
			const data = await fetchDiscovery(discoveryUrl.trim(), bearerToken.trim() || undefined);
			connect(discoveryUrl.trim(), bearerToken.trim());
			setTools(data.functions);
			logSuccess('connection', `Connected to ${discoveryUrl.trim()} (${data.functions.length} tools)`);
			goto('/tools');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to connect';
			error = msg;
			setError(msg);
			logError('connection', `Failed to connect to ${discoveryUrl.trim()}: ${msg}`);
		} finally {
			loading = false;
		}
	}

	async function handleHistoryConnect(entry: { discoveryUrl: string; bearerToken: string }, index: number) {
		connectingIndex = index;
		error = '';
		setLoading();
		logInfo('connection', `Connecting to ${entry.discoveryUrl} (from history)...`);

		try {
			const data = await fetchDiscovery(entry.discoveryUrl, entry.bearerToken || undefined);
			connect(entry.discoveryUrl, entry.bearerToken);
			setTools(data.functions);
			logSuccess('connection', `Connected to ${entry.discoveryUrl} (${data.functions.length} tools)`);
			goto('/tools');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to connect';
			error = msg;
			setError(msg);
			logError('connection', `Failed to connect to ${entry.discoveryUrl}: ${msg}`);
		} finally {
			connectingIndex = -1;
		}
	}

	function maskToken(token: string): string {
		if (!token) return '';
		if (token.length <= 8) return '****';
		return token.slice(0, 4) + '****' + token.slice(-4);
	}

	function formatRelativeTime(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const seconds = Math.floor(diff / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return new Date(iso).toLocaleDateString();
	}
</script>

<form onsubmit={handleConnect} class="w-full max-w-lg space-y-5">
	<div>
		<label for="discovery-url" class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
			Discovery URL <span class="text-red-500">*</span>
		</label>
		<input
			id="discovery-url"
			type="url"
			bind:value={discoveryUrl}
			placeholder="https://your-opal-tools.example.com/discovery"
			required
			class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
		/>
	</div>

	<div>
		<label for="bearer-token" class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
			Bearer Token
			<span class="text-zinc-400">(optional)</span>
		</label>
		<div class="relative">
			<input
				id="bearer-token"
				type={showToken ? 'text' : 'password'}
				bind:value={bearerToken}
				placeholder="Enter bearer token"
				class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-16 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
			/>
			<button
				type="button"
				onclick={() => (showToken = !showToken)}
				class="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
			>
				{showToken ? 'Hide' : 'Show'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
			{error}
		</div>
	{/if}

	<button
		type="submit"
		disabled={loading || !discoveryUrl.trim()}
		class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{#if loading}
			Connecting...
		{:else}
			Connect
		{/if}
	</button>
</form>

{#if historyState.length > 0}
	<div class="mt-8 w-full max-w-lg">
		<div class="mb-3 flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
			<span class="text-xs font-medium text-zinc-400 uppercase">Recent connections</span>
			<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
		</div>

		<ul class="space-y-2">
			{#each historyState as entry, i}
				<li class="group relative">
					<button
						type="button"
						disabled={connectingIndex !== -1}
						onclick={() => handleHistoryConnect(entry, i)}
						class="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
					>
						<div class="flex items-center justify-between gap-2">
							<span class="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
								{entry.discoveryUrl}
							</span>
							<span class="shrink-0 text-xs text-zinc-400">
								{formatRelativeTime(entry.connectedAt)}
							</span>
						</div>
						{#if entry.bearerToken}
							<div class="mt-0.5 text-xs text-zinc-400 font-mono">
								{maskToken(entry.bearerToken)}
							</div>
						{/if}
						{#if connectingIndex === i}
							<div class="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Connecting...</div>
						{/if}
					</button>
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); removeFromHistory(i); }}
						class="absolute top-2 right-2 hidden rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 group-hover:block dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
						aria-label="Remove from history"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
							<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
						</svg>
					</button>
				</li>
			{/each}
		</ul>
	</div>
{/if}
