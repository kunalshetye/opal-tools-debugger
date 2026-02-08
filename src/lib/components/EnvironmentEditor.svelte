<script lang="ts">
	import type { Environment } from '$lib/stores/environments.svelte';

	interface Props {
		environment: Environment;
		onsave: (name: string, vars: Record<string, string>) => void;
		onclose: () => void;
	}

	let { environment, onsave, onclose }: Props = $props();

	let name = $state('');
	let rows: Array<{ key: string; value: string }> = $state([]);

	$effect(() => {
		name = environment.name;
		rows = Object.entries(environment.vars).length > 0
			? Object.entries(environment.vars).map(([key, value]) => ({ key, value }))
			: [{ key: '', value: '' }];
	});

	function addRow() {
		rows = [...rows, { key: '', value: '' }];
	}

	function removeRow(index: number) {
		rows = rows.filter((_, i) => i !== index);
	}

	function updateRow(index: number, field: 'key' | 'value', val: string) {
		rows = rows.map((r, i) => (i === index ? { ...r, [field]: val } : r));
	}

	function handleSave() {
		const trimmedName = name.trim();
		if (!trimmedName) return;
		const vars: Record<string, string> = {};
		for (const row of rows) {
			const k = row.key.trim();
			if (k) vars[k] = row.value;
		}
		onsave(trimmedName, vars);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
	onclick={onclose}
	onkeydown={handleKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="w-[28rem] max-h-[80vh] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
			<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Edit Environment</h3>
			<button
				type="button"
				onclick={onclose}
				class="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
				aria-label="Close"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Body -->
		<div class="overflow-y-auto p-4" style="max-height: calc(80vh - 7rem);">
			<!-- Name -->
			<label class="mb-3 block">
				<span class="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
				<input
					type="text"
					bind:value={name}
					class="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
				/>
			</label>

			<!-- Variables -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">Variables</span>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
						Use as <code class="rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-700">{"{{key}}"}</code> in parameters
					</span>
				</div>

				<div class="space-y-2">
					{#each rows as row, i}
						<div class="flex items-center gap-2">
							<input
								type="text"
								value={row.key}
								oninput={(e) => updateRow(i, 'key', (e.target as HTMLInputElement).value)}
								placeholder="KEY"
								class="w-2/5 rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
							/>
							<input
								type="text"
								value={row.value}
								oninput={(e) => updateRow(i, 'value', (e.target as HTMLInputElement).value)}
								placeholder="value"
								class="flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
							/>
							<button
								type="button"
								onclick={() => removeRow(i)}
								class="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-700"
								aria-label="Remove variable"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}

					<button
						type="button"
						onclick={addRow}
						class="w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
					>
						+ Add variable
					</button>
				</div>

				<p class="mt-3 rounded bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
					Type <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono dark:bg-zinc-700">{"{{API_KEY}}"}</code> in any tool parameter field.
					When you execute, it will be replaced with the variable's value from the selected environment.
					Fields with template tokens show an amber badge.
				</p>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
			<button
				type="button"
				onclick={onclose}
				class="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleSave}
				disabled={!name.trim()}
				class="rounded bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
			>
				Save
			</button>
		</div>
	</div>
</div>
