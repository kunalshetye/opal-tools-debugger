<script lang="ts">
	import type { OpalFunction } from '$lib/types';

	interface Props {
		tool: OpalFunction;
		selected: boolean;
		onclick: () => void;
	}

	let { tool, selected, onclick }: Props = $props();

	const methodColors: Record<string, string> = {
		POST: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
		GET: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
		PUT: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
		DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400'
	};

	const methodColor = $derived(
		methodColors[tool.http_method.toUpperCase()] || 'bg-zinc-500/20 text-zinc-500 dark:text-zinc-400'
	);
</script>

<button
	type="button"
	{onclick}
	class="w-full border-l-2 px-3 py-2.5 text-left transition-colors {selected
		? 'border-indigo-400 bg-indigo-50 dark:bg-zinc-700/50'
		: 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
>
	<div class="flex items-center gap-2">
		<span class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase {methodColor}">
			{tool.http_method}
		</span>
		<span class="truncate text-sm font-medium {selected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}">
			{tool.name}
		</span>
	</div>
	<div class="mt-0.5 truncate pl-[calc(1.5rem+0.5rem)] font-mono text-xs text-zinc-400 dark:text-zinc-500">
		{tool.endpoint}
	</div>
</button>
