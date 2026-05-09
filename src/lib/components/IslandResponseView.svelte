<script lang="ts">
	interface IslandField {
		name: string;
		label: string;
		type: 'string' | 'boolean' | 'json';
		value?: string;
		hidden?: boolean;
		options?: string[];
	}

	interface IslandAction {
		name: string;
		label: string;
		type: string;
		endpoint: string;
		operation?: string;
	}

	interface IslandConfig {
		fields?: IslandField[];
		actions?: IslandAction[];
	}

	interface Props {
		response: { message?: string; config?: { islands?: unknown[] } };
		onaction?: (action: IslandAction, parameters: Record<string, unknown>) => void;
	}

	let { response, onaction }: Props = $props();
	let values: Record<string, unknown> = $state({});

	const islands = $derived((response.config?.islands ?? []) as IslandConfig[]);

	$effect(() => {
		const next: Record<string, unknown> = {};
		for (const island of islands) {
			for (const field of island.fields ?? []) {
				if (field.type === 'boolean') next[field.name] = field.value === 'true';
				else next[field.name] = field.value ?? '';
			}
		}
		values = next;
	});

	function buildParams(fields: IslandField[] = []): Record<string, unknown> {
		const params: Record<string, unknown> = {};
		for (const field of fields) {
			const value = values[field.name];
			if (field.type === 'json' && typeof value === 'string') {
				params[field.name] = value.trim() ? JSON.parse(value) : null;
			} else {
				params[field.name] = value;
			}
		}
		return params;
	}

	function handleAction(action: IslandAction, fields: IslandField[] = []) {
		try {
			onaction?.(action, buildParams(fields));
		} catch (err) {
			window.alert(err instanceof Error ? err.message : 'Invalid island field value');
		}
	}
</script>

<div class="space-y-3">
	{#if response.message}
		<p class="text-sm text-zinc-700 dark:text-zinc-300">{response.message}</p>
	{/if}

	{#each islands as island}
		<div class="space-y-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
			{#each island.fields ?? [] as field}
				{#if !field.hidden}
					<label class="block space-y-1">
						<span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">{field.label || field.name}</span>
						{#if field.options?.length}
							<select
								bind:value={values[field.name] as string}
								class="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
							>
								{#each field.options as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
						{:else if field.type === 'boolean'}
							<input type="checkbox" bind:checked={values[field.name] as boolean} />
						{:else if field.type === 'json'}
							<textarea
								bind:value={values[field.name] as string}
								rows="3"
								class="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
							></textarea>
						{:else}
							<input
								type="text"
								bind:value={values[field.name] as string}
								class="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
							/>
						{/if}
					</label>
				{/if}
			{/each}

			{#if island.actions?.length}
				<div class="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
					{#each island.actions as action}
						<button
							type="button"
							onclick={() => handleAction(action, island.fields)}
							class="rounded bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
						>
							{action.label || action.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
