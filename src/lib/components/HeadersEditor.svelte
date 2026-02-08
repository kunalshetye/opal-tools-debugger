<script lang="ts">
	interface Props {
		headers: Array<{ key: string; value: string }>;
		onchange: (headers: Array<{ key: string; value: string }>) => void;
	}

	let { headers, onchange }: Props = $props();
	let expanded = $state(false);

	function addRow() {
		onchange([...headers, { key: '', value: '' }]);
	}

	function removeRow(index: number) {
		onchange(headers.filter((_, i) => i !== index));
	}

	function updateRow(index: number, field: 'key' | 'value', val: string) {
		const updated = headers.map((h, i) =>
			i === index ? { ...h, [field]: val } : h
		);
		onchange(updated);
	}
</script>

<div class="mt-4">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
	>
		<svg class="h-3 w-3 transition-transform {expanded ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
		Custom Headers
		{#if headers.length > 0}
			<span class="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-700">{headers.length}</span>
		{/if}
	</button>

	{#if expanded}
		<div class="mt-2 space-y-2">
			{#each headers as header, i}
				<div class="flex items-center gap-2">
					<input
						type="text"
						value={header.key}
						oninput={(e) => updateRow(i, 'key', (e.target as HTMLInputElement).value)}
						placeholder="Header name"
						class="w-1/3 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
					/>
					<input
						type="text"
						value={header.value}
						oninput={(e) => updateRow(i, 'value', (e.target as HTMLInputElement).value)}
						placeholder="Value"
						class="flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
					/>
					<button
						type="button"
						onclick={() => removeRow(i)}
						class="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-red-400"
						aria-label="Remove header"
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
				class="rounded border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
			>
				+ Add header
			</button>
		</div>
	{/if}
</div>
