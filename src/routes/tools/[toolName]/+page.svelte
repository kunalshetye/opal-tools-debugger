<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { connectionState, disconnect } from '$lib/stores/connection.svelte';
	import { getToolByName, toolsState, setTools, setLoading, setError, clearTools } from '$lib/stores/tools.svelte';
	import { fetchDiscovery } from '$lib/api/discovery';
	import { executeTool } from '$lib/api/executor';
	import ToolForm from '$lib/components/ToolForm.svelte';
	import ResponseViewer from '$lib/components/ResponseViewer.svelte';
	import type { ToolExecutionResult } from '$lib/types';
	import { browser } from '$app/environment';

	const HISTORY_KEY_PREFIX = 'opal-debugger-history-';

	const toolName = $derived($page.params.toolName);
	const tool = $derived(getToolByName(toolName));

	let loading = $state(false);
	let refreshing = $state(false);
	let refreshError = $state('');
	let results: ToolExecutionResult[] = $state([]);

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
				return;
			}
		}

		// Load execution history from localStorage
		if (browser && toolName) {
			try {
				const stored = localStorage.getItem(HISTORY_KEY_PREFIX + toolName);
				if (stored) results = JSON.parse(stored);
			} catch {
				// ignore
			}
		}
	});

	function saveHistory() {
		if (!browser || !toolName) return;
		localStorage.setItem(HISTORY_KEY_PREFIX + toolName, JSON.stringify(results.slice(0, 10)));
	}

	async function handleExecute(params: Record<string, unknown>) {
		if (!tool) return;
		loading = true;

		const result = await executeTool(
			connectionState.baseUrl,
			tool.endpoint,
			params,
			connectionState.bearerToken || undefined
		);

		results = [result, ...results.slice(0, 9)];
		saveHistory();
		loading = false;
	}
</script>

<svelte:head>
	<title>{toolName} - Opal Tools Debugger</title>
</svelte:head>

<div>
	<div class="mb-6">
		<a href="/tools" class="mb-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
			&larr; Back to tools
		</a>

		{#if tool}
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-zinc-900">{tool.name}</h2>
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
			<p class="mt-1 text-sm text-zinc-500">{tool.description}</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-zinc-400">
				<span class="rounded bg-zinc-100 px-2 py-0.5 font-mono font-semibold uppercase text-zinc-600">
					{tool.http_method}
				</span>
				<span class="font-mono">{connectionState.baseUrl}{tool.endpoint}</span>
			</div>

			{#if refreshError}
				<div class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{refreshError}
				</div>
			{/if}
		{/if}
	</div>

	{#if tool}
		<div class="grid gap-8 lg:grid-cols-2">
			<div>
				<h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Parameters</h3>
				<ToolForm parameters={tool.parameters} onexecute={handleExecute} {loading} />
			</div>

			<div>
				<h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
					Response
					{#if results.length > 0}
						<span class="ml-1 font-normal normal-case text-zinc-400">({results.length} execution{results.length !== 1 ? 's' : ''})</span>
					{/if}
				</h3>

				{#if results.length === 0}
					<p class="text-sm text-zinc-400 italic">Execute the tool to see the response here.</p>
				{:else}
					<div class="space-y-4">
						{#each results as result, i}
							{#if i > 0}
								<details class="group">
									<summary class="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600">
										Previous execution ({result.status}, {result.duration}ms)
									</summary>
									<div class="mt-2">
										<ResponseViewer {result} />
									</div>
								</details>
							{:else}
								<ResponseViewer {result} />
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
			Tool "{toolName}" not found. It may have been removed from the discovery endpoint.
		</div>
	{/if}
</div>
