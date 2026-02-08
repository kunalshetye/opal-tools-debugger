<script lang="ts">
	import type { ToolExecutionResult } from '$lib/types';
	import { jsonDiff, type DiffEntry } from '$lib/utils/json-diff';

	interface Props {
		resultA: ToolExecutionResult;
		resultB: ToolExecutionResult;
	}

	let { resultA, resultB }: Props = $props();

	const diffs = $derived(jsonDiff(resultA.body, resultB.body));

	const typeColors: Record<string, string> = {
		added: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20',
		removed: 'bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20',
		changed: 'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20'
	};

	const typeBadgeColors: Record<string, string> = {
		added: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
		removed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
		changed: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
	};

	function formatValue(val: unknown): string {
		if (val === undefined) return 'undefined';
		return JSON.stringify(val, null, 2);
	}
</script>

<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
	<div class="flex items-center gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
		<span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Response Diff</span>
		<span class="text-[10px] text-zinc-400">
			({resultA.status} {resultA.duration}ms) vs ({resultB.status} {resultB.duration}ms)
		</span>
		<span class="ml-auto text-[10px] text-zinc-400">
			{diffs.length} difference{diffs.length !== 1 ? 's' : ''}
		</span>
	</div>

	<div class="max-h-96 overflow-auto p-4">
		{#if diffs.length === 0}
			<p class="text-center text-sm text-zinc-500 italic">Responses are identical.</p>
		{:else}
			<div class="space-y-2">
				{#each diffs as diff}
					<div class="rounded border p-2.5 {typeColors[diff.type]}">
						<div class="flex items-center gap-2">
							<span class="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">{diff.path}</span>
							<span class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase {typeBadgeColors[diff.type]}">
								{diff.type}
							</span>
						</div>
						{#if diff.type === 'changed'}
							<div class="mt-1.5 grid grid-cols-2 gap-2">
								<div>
									<span class="text-[10px] text-zinc-400">Previous</span>
									<pre class="mt-0.5 rounded bg-white/50 p-1.5 font-mono text-xs text-red-600 dark:bg-zinc-900/50 dark:text-red-400">{formatValue(diff.oldVal)}</pre>
								</div>
								<div>
									<span class="text-[10px] text-zinc-400">Current</span>
									<pre class="mt-0.5 rounded bg-white/50 p-1.5 font-mono text-xs text-emerald-600 dark:bg-zinc-900/50 dark:text-emerald-400">{formatValue(diff.newVal)}</pre>
								</div>
							</div>
						{:else if diff.type === 'added'}
							<pre class="mt-1.5 rounded bg-white/50 p-1.5 font-mono text-xs text-emerald-600 dark:bg-zinc-900/50 dark:text-emerald-400">{formatValue(diff.newVal)}</pre>
						{:else}
							<pre class="mt-1.5 rounded bg-white/50 p-1.5 font-mono text-xs text-red-600 dark:bg-zinc-900/50 dark:text-red-400">{formatValue(diff.oldVal)}</pre>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
