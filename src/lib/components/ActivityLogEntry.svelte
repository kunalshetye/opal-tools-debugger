<script lang="ts">
	import type { LogEntry } from '$lib/types';
	import JsonViewer from './JsonViewer.svelte';

	interface Props {
		entry: LogEntry;
	}

	let { entry }: Props = $props();

	let expanded = $state(false);

	const levelColors: Record<string, string> = {
		info: 'bg-blue-500',
		success: 'bg-emerald-500',
		warning: 'bg-amber-500',
		error: 'bg-red-500'
	};

	const categoryColors: Record<string, string> = {
		connection: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
		discovery: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
		execution: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
		app: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400'
	};

	function formatTime(ts: number): string {
		const d = new Date(ts);
		const h = d.getHours().toString().padStart(2, '0');
		const m = d.getMinutes().toString().padStart(2, '0');
		const s = d.getSeconds().toString().padStart(2, '0');
		const ms = d.getMilliseconds().toString().padStart(3, '0');
		return `${h}:${m}:${s}.${ms}`;
	}

	const hasDetails = $derived(entry.details !== undefined && entry.details !== null);
</script>

<div class="group flex flex-col border-b border-zinc-100 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
	<div class="flex items-center gap-2 text-xs">
		<span class="shrink-0 font-mono text-zinc-400 dark:text-zinc-500">
			{formatTime(entry.timestamp)}
		</span>

		<span class="h-2 w-2 shrink-0 rounded-full {levelColors[entry.level]}"></span>

		<span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider {categoryColors[entry.category]}">
			{entry.category}
		</span>

		<span class="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
			{entry.message}
		</span>

		{#if hasDetails}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				class="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
			>
				{expanded ? 'Hide' : 'Details'}
			</button>
		{/if}
	</div>

	{#if expanded && hasDetails}
		<div class="ml-[72px] mt-1.5 mb-1 overflow-x-auto rounded border border-zinc-200 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900">
			{#if typeof entry.details === 'string'}
				<pre class="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{entry.details}</pre>
			{:else}
				<JsonViewer data={entry.details} />
			{/if}
		</div>
	{/if}
</div>
