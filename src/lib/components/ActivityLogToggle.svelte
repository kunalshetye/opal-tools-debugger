<script lang="ts">
	import { activityLogState, togglePanel, getErrorCount } from '$lib/stores/activity-log.svelte';

	const entryCount = $derived(activityLogState.entries.length);
	const errorCount = $derived(getErrorCount());
	const hasErrors = $derived(errorCount > 0);
</script>

<button
	onclick={togglePanel}
	class="relative rounded border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 {activityLogState.panelOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''}"
	aria-label="Toggle activity log"
	title="Activity Log (Ctrl+Shift+L)"
>
	<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
	</svg>

	{#if !activityLogState.panelOpen && entryCount > 0}
		{#if hasErrors}
			<span class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
				{errorCount > 99 ? '99+' : errorCount}
			</span>
		{:else}
			<span class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
				{entryCount > 99 ? '99+' : entryCount}
			</span>
		{/if}
	{/if}
</button>
