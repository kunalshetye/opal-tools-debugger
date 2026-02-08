<script lang="ts">
	import { onMount } from 'svelte';
	import { connectionState } from '$lib/stores/connection.svelte';
	import { toolsState } from '$lib/stores/tools.svelte';
	import { goto } from '$app/navigation';
	import ToolCard from '$lib/components/ToolCard.svelte';

	let search = $state('');

	const filteredTools = $derived(
		toolsState.functions.filter((tool) => {
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
		})
	);

	onMount(() => {
		if (!connectionState.connected || toolsState.functions.length === 0) {
			goto('/');
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
	</div>

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
