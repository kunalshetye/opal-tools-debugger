<script lang="ts">
	import type { OpalParameter } from '$lib/types';

	interface Props {
		parameters: OpalParameter[];
		onexecute: (params: Record<string, unknown>) => void;
		loading?: boolean;
	}

	let { parameters, onexecute, loading = false }: Props = $props();

	let values: Record<string, string | number | boolean> = $state({});

	// Initialize default values
	$effect(() => {
		const defaults: Record<string, string | number | boolean> = {};
		for (const param of parameters) {
			if (!(param.name in values)) {
				if (param.type === 'boolean') defaults[param.name] = false;
				else if (param.type === 'number') defaults[param.name] = 0;
				else defaults[param.name] = '';
			}
		}
		if (Object.keys(defaults).length > 0) {
			values = { ...defaults, ...values };
		}
	});

	function isTextarea(param: OpalParameter): boolean {
		const desc = param.description.toLowerCase();
		return desc.includes('json') || desc.includes('html') || desc.includes('body') || desc.includes('content');
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Validate required fields
		for (const param of parameters) {
			if (param.required && param.type === 'string' && !values[param.name]) {
				return;
			}
		}

		// Build params object with proper types
		const params: Record<string, unknown> = {};
		for (const param of parameters) {
			const val = values[param.name];
			if (param.type === 'string' && val === '' && !param.required) continue;
			if (param.type === 'number') {
				params[param.name] = Number(val);
			} else {
				params[param.name] = val;
			}
		}

		onexecute(params);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	{#each parameters as param (param.name)}
		<div>
			<label for="param-{param.name}" class="mb-1.5 block text-sm font-medium text-zinc-700">
				{param.name}
				{#if param.required}<span class="text-red-500">*</span>{/if}
			</label>
			<p class="mb-1 text-xs text-zinc-400">{param.description}</p>

			{#if param.type === 'boolean'}
				<label class="inline-flex items-center gap-2">
					<input
						id="param-{param.name}"
						type="checkbox"
						bind:checked={values[param.name] as boolean}
						class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
					/>
					<span class="text-sm text-zinc-600">Enabled</span>
				</label>
			{:else if param.type === 'number'}
				<input
					id="param-{param.name}"
					type="number"
					bind:value={values[param.name] as number}
					required={param.required}
					class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			{:else if isTextarea(param)}
				<textarea
					id="param-{param.name}"
					bind:value={values[param.name] as string}
					required={param.required}
					rows="4"
					class="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				></textarea>
			{:else}
				<input
					id="param-{param.name}"
					type="text"
					bind:value={values[param.name] as string}
					required={param.required}
					class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			{/if}
		</div>
	{/each}

	{#if parameters.length === 0}
		<p class="text-sm text-zinc-500 italic">This tool has no parameters.</p>
	{/if}

	<button
		type="submit"
		disabled={loading}
		class="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{#if loading}
			Executing...
		{:else}
			Execute
		{/if}
	</button>
</form>
