<script lang="ts">
	import type { ToolPreset } from '$lib/types';

	interface Props {
		presets: ToolPreset[];
		onexecute: (presets: ToolPreset[]) => void;
	}

	let { presets, onexecute }: Props = $props();

	let open = $state(false);
	let selected: Set<string> = $state(new Set());
	let running = $state(false);

	function togglePreset(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function selectAll() {
		selected = new Set(presets.map((p) => p.id));
	}

	function selectNone() {
		selected = new Set();
	}

	async function handleRun() {
		const toRun = presets.filter((p) => selected.has(p.id));
		if (toRun.length === 0) return;
		running = true;
		await onexecute(toRun);
		running = false;
		open = false;
	}
</script>

{#if presets.length > 0}
	<button
		type="button"
		onclick={() => (open = !open)}
		class="h-7 rounded border border-zinc-300 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
		title="Run multiple presets sequentially"
	>
		Bulk
	</button>
{/if}

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick={() => (open = false)} onkeydown={(e) => e.key === 'Escape' && (open = false)}>
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div class="w-96 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-800" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && (open = false)}>
			<h3 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bulk Execute</h3>
			<p class="mb-3 text-xs text-zinc-500">Select presets to run sequentially:</p>

			<div class="mb-3 flex items-center gap-2">
				<button onclick={selectAll} class="text-[11px] text-indigo-500 hover:underline">Select all</button>
				<button onclick={selectNone} class="text-[11px] text-zinc-400 hover:underline">None</button>
			</div>

			<div class="max-h-48 space-y-1 overflow-y-auto">
				{#each presets as preset (preset.id)}
					<label class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
						<input
							type="checkbox"
							checked={selected.has(preset.id)}
							onchange={() => togglePreset(preset.id)}
							class="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-500 dark:border-zinc-600 dark:bg-zinc-800"
						/>
						<span class="text-xs text-zinc-700 dark:text-zinc-300">{preset.presetName}</span>
					</label>
				{/each}
			</div>

			<div class="mt-4 flex items-center gap-2">
				<button
					onclick={handleRun}
					disabled={selected.size === 0 || running}
					class="rounded bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
				>
					{running ? 'Running...' : `Run ${selected.size} preset${selected.size !== 1 ? 's' : ''}`}
				</button>
				<button
					onclick={() => (open = false)}
					class="rounded border border-zinc-300 px-4 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
