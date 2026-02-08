<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { connectionState } from '$lib/stores/connection.svelte';
	import { getToolByName, toolsState } from '$lib/stores/tools.svelte';
	import { executeTool } from '$lib/api/executor';
	import ToolForm from '$lib/components/ToolForm.svelte';
	import ResponseViewer from '$lib/components/ResponseViewer.svelte';
	import type { ToolExecutionResult } from '$lib/types';
	import { browser } from '$app/environment';

	const HISTORY_KEY_PREFIX = 'opal-debugger-history-';

	const toolName = $derived($page.params.toolName);
	const tool = $derived(getToolByName(toolName));

	let loading = $state(false);
	let results: ToolExecutionResult[] = $state([]);

	onMount(() => {
		if (!connectionState.connected || toolsState.functions.length === 0) {
			goto('/');
			return;
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
			<h2 class="text-xl font-bold text-zinc-900">{tool.name}</h2>
			<p class="mt-1 text-sm text-zinc-500">{tool.description}</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-zinc-400">
				<span class="rounded bg-zinc-100 px-2 py-0.5 font-mono font-semibold uppercase text-zinc-600">
					{tool.http_method}
				</span>
				<span class="font-mono">{connectionState.baseUrl}{tool.endpoint}</span>
			</div>
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
