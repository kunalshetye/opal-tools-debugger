<script lang="ts">
	import JsonViewer from './JsonViewer.svelte';

	interface Props {
		data: unknown;
		depth?: number;
	}

	let { data, depth = 0 }: Props = $props();

	let collapsed = $state(false);

	$effect(() => {
		collapsed = depth > 2;
	});

	function isObject(val: unknown): val is Record<string, unknown> {
		return val !== null && typeof val === 'object' && !Array.isArray(val);
	}

	function isArray(val: unknown): val is unknown[] {
		return Array.isArray(val);
	}

	const entries = $derived(isObject(data) ? Object.entries(data) : []);
	const items = $derived(isArray(data) ? data : []);
	const isExpandable = $derived(isObject(data) || isArray(data));
	const itemCount = $derived(isObject(data) ? entries.length : isArray(data) ? items.length : 0);
	const bracketOpen = $derived(isArray(data) ? '[' : '{');
	const bracketClose = $derived(isArray(data) ? ']' : '}');
</script>

{#if isExpandable}
	<span class="inline">
		<button
			type="button"
			onclick={() => (collapsed = !collapsed)}
			class="inline-flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600 focus:outline-none dark:text-zinc-500 dark:hover:text-zinc-300"
			aria-label={collapsed ? 'Expand' : 'Collapse'}
		>
			<svg class="h-3 w-3 transition-transform {collapsed ? '' : 'rotate-90'}" viewBox="0 0 12 12" fill="currentColor">
				<path d="M4 2l4 4-4 4z" />
			</svg>
		</button>
		<span class="text-zinc-400 dark:text-zinc-500">{bracketOpen}</span>
		{#if collapsed}
			<button
				type="button"
				onclick={() => (collapsed = false)}
				class="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
			>
				{itemCount} {isArray(data) ? 'items' : 'keys'}
			</button>
			<span class="text-zinc-400 dark:text-zinc-500">{bracketClose}</span>
		{:else}
			<div class="ml-4 border-l border-zinc-200/50 pl-3 dark:border-zinc-700/50">
				{#if isObject(data)}
					{#each entries as [key, value], i}
						<div class="leading-relaxed">
							<span class="text-purple-600 dark:text-purple-400">"{key}"</span><span class="text-zinc-400 dark:text-zinc-500">: </span>
							{#if isObject(value) || isArray(value)}
								<JsonViewer data={value} depth={depth + 1} />
							{:else if typeof value === 'string'}
								<span class="text-emerald-600 dark:text-emerald-400">"{value}"</span>
							{:else if typeof value === 'number'}
								<span class="text-amber-600 dark:text-amber-300">{value}</span>
							{:else if typeof value === 'boolean'}
								<span class="text-sky-600 dark:text-sky-400">{value}</span>
							{:else if value === null}
								<span class="text-zinc-400 italic dark:text-zinc-500">null</span>
							{:else}
								<span class="text-zinc-500 dark:text-zinc-400">{String(value)}</span>
							{/if}
							{#if i < entries.length - 1}<span class="text-zinc-300 dark:text-zinc-600">,</span>{/if}
						</div>
					{/each}
				{:else}
					{#each items as item, i}
						<div class="leading-relaxed">
							{#if isObject(item) || isArray(item)}
								<JsonViewer data={item} depth={depth + 1} />
							{:else if typeof item === 'string'}
								<span class="text-emerald-600 dark:text-emerald-400">"{item}"</span>
							{:else if typeof item === 'number'}
								<span class="text-amber-600 dark:text-amber-300">{item}</span>
							{:else if typeof item === 'boolean'}
								<span class="text-sky-600 dark:text-sky-400">{item}</span>
							{:else if item === null}
								<span class="text-zinc-400 italic dark:text-zinc-500">null</span>
							{:else}
								<span class="text-zinc-500 dark:text-zinc-400">{String(item)}</span>
							{/if}
							{#if i < items.length - 1}<span class="text-zinc-300 dark:text-zinc-600">,</span>{/if}
						</div>
					{/each}
				{/if}
			</div>
			<span class="text-zinc-400 dark:text-zinc-500">{bracketClose}</span>
		{/if}
	</span>
{:else if typeof data === 'string'}
	<span class="text-emerald-600 dark:text-emerald-400">"{data}"</span>
{:else if typeof data === 'number'}
	<span class="text-amber-600 dark:text-amber-300">{data}</span>
{:else if typeof data === 'boolean'}
	<span class="text-sky-600 dark:text-sky-400">{data}</span>
{:else if data === null || data === undefined}
	<span class="text-zinc-400 italic dark:text-zinc-500">null</span>
{:else}
	<span class="text-zinc-500 dark:text-zinc-400">{String(data)}</span>
{/if}
