<script lang="ts">
	import type { OpalFunction } from '$lib/types';

	interface Props {
		tool: OpalFunction;
		selected: boolean;
		onclick: () => void;
		favorited?: boolean;
		ontogglefavorite?: () => void;
	}

	let { tool, selected, onclick, favorited = false, ontogglefavorite }: Props = $props();

	const methodColors: Record<string, string> = {
		POST: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
		GET: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
		PUT: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
		DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400',
		PATCH: 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
	};

	const methodColor = $derived(
		methodColors[tool.http_method.toUpperCase()] || 'bg-zinc-500/20 text-zinc-500 dark:text-zinc-400'
	);

	function handleStarClick(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		ontogglefavorite?.();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group flex w-full cursor-pointer flex-col border-l-2 px-3 py-2.5 text-left transition-colors {selected
		? 'border-indigo-400 bg-indigo-50 dark:bg-zinc-700/50'
		: 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
	onclick={onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick()}
	role="button"
	tabindex="0"
>
	<div class="flex items-center gap-2">
		<span class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase {methodColor}">
			{tool.http_method}
		</span>
		<span class="truncate text-sm font-medium {selected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}">
			{tool.name}
		</span>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			onclick={handleStarClick}
			role="button"
			tabindex="0"
			class="ml-auto shrink-0 cursor-pointer p-0.5 transition {favorited ? 'text-amber-400' : 'text-zinc-300 opacity-0 group-hover:opacity-100 dark:text-zinc-600 hover:text-amber-400'}"
			aria-label={favorited ? 'Unpin tool' : 'Pin tool'}
		>
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
			</svg>
		</span>
	</div>
	<div class="mt-0.5 truncate pl-[calc(1.5rem+0.5rem)] font-mono text-xs text-zinc-400 dark:text-zinc-500">
		{tool.endpoint}
	</div>
</div>
