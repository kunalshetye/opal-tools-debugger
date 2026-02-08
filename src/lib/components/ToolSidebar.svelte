<script lang="ts">
	import { toolsState } from '$lib/stores/tools.svelte';
	import { uiState, selectTool } from '$lib/stores/ui.svelte';
	import ToolListItem from './ToolListItem.svelte';

	interface Props {
		onrefresh: () => void;
		refreshing: boolean;
	}

	let { onrefresh, refreshing }: Props = $props();

	const filteredTools = $derived(
		toolsState.functions.filter((tool) => {
			if (!uiState.searchQuery.trim()) return true;
			const q = uiState.searchQuery.toLowerCase();
			return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
		})
	);
</script>

<aside class="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
	<!-- Search + refresh -->
	<div class="flex flex-col gap-2 border-b border-zinc-200 p-3 dark:border-zinc-700">
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					bind:value={uiState.searchQuery}
					placeholder="Filter tools..."
					class="w-full rounded border border-zinc-300 bg-zinc-50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
				/>
			</div>
			<button
				onclick={onrefresh}
				disabled={refreshing}
				class="shrink-0 rounded border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
				title="Refresh discovery"
			>
				<svg class="h-3.5 w-3.5 {refreshing ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>
		<div class="text-[11px] text-zinc-400 dark:text-zinc-500">
			{filteredTools.length} of {toolsState.functions.length} tools
		</div>
	</div>

	<!-- Tool list -->
	<div class="flex-1 overflow-y-auto">
		{#if filteredTools.length === 0}
			<div class="px-3 py-6 text-center text-xs text-zinc-500 italic">
				{#if uiState.searchQuery.trim()}
					No tools match your filter.
				{:else}
					No tools available.
				{/if}
			</div>
		{:else}
			{#each filteredTools as tool (tool.name)}
				<ToolListItem
					{tool}
					selected={uiState.selectedToolName === tool.name}
					onclick={() => selectTool(tool.name)}
				/>
			{/each}
		{/if}
	</div>
</aside>
