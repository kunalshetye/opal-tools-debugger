<script lang="ts">
	import type { OpalParameter } from '$lib/types';
	import { hasTemplateTokens } from '$lib/utils/template';

	interface Props {
		parameters: OpalParameter[];
		onexecute: (params: Record<string, unknown>) => void;
		loading?: boolean;
		initialValues?: Record<string, string | number | boolean> | null;
		onvalueschange?: (values: Record<string, string | number | boolean>) => void;
		oncancel?: () => void;
	}

	let { parameters, onexecute, loading = false, initialValues = null, onvalueschange, oncancel }: Props = $props();

	let values: Record<string, string | number | boolean> = $state({});
	let formEl: HTMLFormElement | undefined = $state();

	// Reset values to fresh defaults when parameters change (tool switch)
	$effect(() => {
		const defaults: Record<string, string | number | boolean> = {};
		for (const param of parameters) {
			if (param.type === 'boolean') defaults[param.name] = false;
			else if (param.type === 'number') defaults[param.name] = 0;
			else defaults[param.name] = '';
		}
		values = defaults;
	});

	// Apply initial values from presets
	$effect(() => {
		if (initialValues) {
			values = { ...initialValues };
		}
	});

	// Notify parent of value changes
	$effect(() => {
		onvalueschange?.({ ...values });
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

	export function triggerExecute() {
		formEl?.requestSubmit();
	}
</script>

<form bind:this={formEl} onsubmit={handleSubmit} class="space-y-4">
	{#each parameters as param (param.name)}
		<div>
			<label for="param-{param.name}" class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
				{param.name}
				{#if param.required}<span class="text-red-500 dark:text-red-400">*</span>{/if}
			</label>
			<p class="mb-1 text-xs text-zinc-400 dark:text-zinc-500">{param.description}</p>

			{#if param.type === 'boolean'}
				<label class="inline-flex items-center gap-2">
					<input
						id="param-{param.name}"
						type="checkbox"
						bind:checked={values[param.name] as boolean}
						class="h-4 w-4 rounded border-zinc-300 bg-white text-indigo-500 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-offset-zinc-900"
					/>
					<span class="text-sm text-zinc-500 dark:text-zinc-400">Enabled</span>
				</label>
			{:else if param.type === 'number'}
				<input
					id="param-{param.name}"
					type="number"
					bind:value={values[param.name] as number}
					required={param.required}
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
				/>
			{:else if isTextarea(param)}
				<div class="relative">
					<textarea
						id="param-{param.name}"
						bind:value={values[param.name] as string}
						required={param.required}
						rows="4"
						class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
					></textarea>
					{#if typeof values[param.name] === 'string' && hasTemplateTokens(values[param.name] as string)}
						<span class="absolute right-2 bottom-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
							template
						</span>
					{/if}
				</div>
			{:else}
				<div class="relative">
					<input
						id="param-{param.name}"
						type="text"
						bind:value={values[param.name] as string}
						required={param.required}
						class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
					/>
					{#if typeof values[param.name] === 'string' && hasTemplateTokens(values[param.name] as string)}
						<span class="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
							template
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	{#if parameters.length === 0}
		<p class="text-sm text-zinc-500 italic">This tool has no parameters.</p>
	{/if}

	<div class="flex items-center gap-2">
		{#if loading}
			<button
				type="button"
				onclick={oncancel}
				class="rounded-md bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
			>
				Cancel
			</button>
		{:else}
			<button
				type="submit"
				class="rounded-md bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-600"
			>
				Execute
			</button>
		{/if}
		<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
			{navigator?.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter
		</span>
	</div>
</form>
