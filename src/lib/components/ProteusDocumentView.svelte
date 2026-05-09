<script lang="ts">
	import JsonViewer from './JsonViewer.svelte';

	interface Props {
		document: Record<string, unknown>;
		oninteraction?: (name: string, params: Record<string, unknown>) => void;
	}

	let { document, oninteraction }: Props = $props();

	function children(node: Record<string, unknown>, key = 'children'): unknown[] {
		const value = node[key];
		if (value === undefined || value === null) return [];
		return Array.isArray(value) ? value : [value];
	}

	function text(value: unknown): string {
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
		return '';
	}

	function fieldName(node: Record<string, unknown>): string {
		return typeof node.name === 'string' ? node.name : '';
	}

	function handleAction(node: Record<string, unknown>) {
		const onClick = node.onClick;
		if (onClick && typeof onClick === 'object' && !Array.isArray(onClick)) {
			const click = onClick as Record<string, unknown>;
			if (typeof click.interaction === 'string') {
				const params = click.params && typeof click.params === 'object' && !Array.isArray(click.params)
					? click.params as Record<string, unknown>
					: {};
				oninteraction?.(click.interaction, params);
			}
		}
	}
</script>

{#snippet renderNode(node: unknown)}
	{#if node === null || node === undefined}
		<span class="text-xs text-zinc-400 italic">null</span>
	{:else if typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean'}
		<span>{String(node)}</span>
	{:else if typeof node === 'object' && !Array.isArray(node)}
		{@const record = node as Record<string, unknown>}
		{@const type = String(record.$type ?? '')}
		{#if type === 'Heading'}
			<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{#each children(record) as child}{@render renderNode(child)}{/each}</h3>
		{:else if type === 'Text'}
			<p class="text-sm text-zinc-700 dark:text-zinc-300">{#each children(record) as child}{@render renderNode(child)}{/each}</p>
		{:else if type === 'Group'}
			<div class="flex flex-col gap-2">
				{#each children(record) as child}
					{@render renderNode(child)}
				{/each}
			</div>
		{:else if type === 'Card'}
			<div class="space-y-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
				{#each children(record) as child}
					{@render renderNode(child)}
				{/each}
			</div>
		{:else if type === 'Field'}
			<label class="block space-y-1">
				{#if record.label}
					<span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">{#each children(record, 'label') as child}{@render renderNode(child)}{/each}</span>
				{/if}
				{#each children(record) as child}
					{@render renderNode(child)}
				{/each}
			</label>
		{:else if type === 'Input'}
			<input
				type={typeof record.type === 'string' ? record.type : 'text'}
				name={fieldName(record)}
				placeholder={text(record.placeholder)}
				class="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
			/>
		{:else if type === 'Textarea'}
			<textarea
				name={fieldName(record)}
				placeholder={text(record.placeholder)}
				rows="3"
				class="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
			></textarea>
		{:else if type === 'Switch'}
			<input type="checkbox" name={fieldName(record)} />
		{:else if type === 'Action' || type === 'CancelAction'}
			<button
				type="button"
				onclick={() => handleAction(record)}
				class="rounded bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
			>
				{#each children(record) as child}{@render renderNode(child)}{/each}
			</button>
		{:else if type === 'Separator'}
			<hr class="border-zinc-200 dark:border-zinc-700" />
		{:else}
			<div class="rounded border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900">
				<JsonViewer data={record} />
			</div>
		{/if}
	{:else if Array.isArray(node)}
		{#each node as child}
			{@render renderNode(child)}
		{/each}
	{/if}
{/snippet}

<div class="space-y-3">
	{#if document.title}
		<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{#each children(document, 'title') as child}{@render renderNode(child)}{/each}</h2>
	{/if}
	{#if document.subtitle}
		<p class="text-sm text-zinc-500 dark:text-zinc-400">{#each children(document, 'subtitle') as child}{@render renderNode(child)}{/each}</p>
	{/if}
	<div class="space-y-3">
		{#each children(document, 'body') as child}
			{@render renderNode(child)}
		{/each}
	</div>
	{#if document.actions}
		<div class="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
			{#each children(document, 'actions') as action}
				{@render renderNode(action)}
			{/each}
		</div>
	{/if}
</div>
