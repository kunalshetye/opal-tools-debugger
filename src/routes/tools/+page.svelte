<script lang="ts">
	import { onMount } from 'svelte';
	import { connectionState, disconnect } from '$lib/stores/connection.svelte';
	import { toolsState, setTools, setLoading, setError, clearTools } from '$lib/stores/tools.svelte';
	import { fetchDiscovery } from '$lib/api/discovery';
	import { goto } from '$app/navigation';
	import ToolCard from '$lib/components/ToolCard.svelte';

	let search = $state('');
	let refreshing = $state(false);
	let refreshError = $state('');

	const filteredTools = $derived(
		toolsState.functions.filter((tool) => {
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
		})
	);

	async function refreshDiscovery() {
		refreshing = true;
		refreshError = '';
		try {
			const data = await fetchDiscovery(
				connectionState.discoveryUrl,
				connectionState.bearerToken || undefined
			);
			setTools(data.functions);
		} catch (err) {
			refreshError = err instanceof Error ? err.message : 'Failed to refresh';
		} finally {
			refreshing = false;
		}
	}

	onMount(async () => {
		if (!connectionState.connected) {
			goto('/');
			return;
		}

		// Re-fetch tools from discovery if they're not in memory (e.g. after page refresh)
		if (toolsState.functions.length === 0) {
			setLoading();
			try {
				const data = await fetchDiscovery(
					connectionState.discoveryUrl,
					connectionState.bearerToken || undefined
				);
				setTools(data.functions);
			} catch {
				clearTools();
				disconnect();
				goto('/');
			}
		}
	});
</script>

<svelte:head>
	<title>Tools - Opal Tools Debugger</title>
</svelte:head>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-xl font-bold text-zinc-900">
			Available Tools
			<span class="ml-2 text-base font-normal text-zinc-400">({toolsState.functions.length})</span>
		</h2>
		<button
			onclick={refreshDiscovery}
			disabled={refreshing}
			class="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
		>
			<svg class="h-4 w-4 {refreshing ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			{refreshing ? 'Refreshing...' : 'Refresh'}
		</button>
	</div>

	{#if refreshError}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{refreshError}
		</div>
	{/if}

	<div class="mb-6">
		<input
			type="text"
			bind:value={search}
			placeholder="Search tools by name or description..."
			class="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
		/>
	</div>

	{#if filteredTools.length === 0}
		<p class="text-sm text-zinc-500 italic">No tools match your search.</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredTools as tool (tool.name)}
				<ToolCard {tool} />
			{/each}
		</div>
	{/if}
</div>
