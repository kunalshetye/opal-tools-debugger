<script lang="ts">
	import AbdRenderer from './AbdRenderer.svelte';
	import JsonViewer from './JsonViewer.svelte';

	interface Props {
		response: Record<string, unknown>;
	}

	let { response }: Props = $props();

	let dataCollapsed = $state(true);
	let artifactCollapsed = $state(true);
	let rollbackCollapsed = $state(true);

	const content = $derived(response.content as Record<string, unknown> | undefined);
	const data = $derived(response.data);
	const artifact = $derived(response.artifact as Record<string, unknown> | undefined);
	const error = $derived(response.error as Record<string, unknown> | undefined);
	const rollback = $derived(response.rollback as Record<string, unknown> | undefined);
</script>

<div class="space-y-4">
	<!-- Content (Block Document) -->
	{#if content}
		<div class="space-y-2">
			<AbdRenderer node={content} />
		</div>
	{/if}

	<!-- Data -->
	{#if data !== undefined}
		<div class="rounded-md border border-zinc-200 dark:border-zinc-700">
			<button
				onclick={() => (dataCollapsed = !dataCollapsed)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				<svg class="h-3 w-3 text-zinc-400 transition-transform dark:text-zinc-500 {dataCollapsed ? '' : 'rotate-90'}" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2l4 4-4 4z" />
				</svg>
				Data
			</button>
			{#if !dataCollapsed}
				<div class="border-t border-zinc-200 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
					<JsonViewer data={data} />
				</div>
			{/if}
		</div>
	{/if}

	<!-- Artifact -->
	{#if artifact}
		<div class="rounded-md border border-zinc-200 dark:border-zinc-700">
			<button
				onclick={() => (artifactCollapsed = !artifactCollapsed)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				<svg class="h-3 w-3 text-zinc-400 transition-transform dark:text-zinc-500 {artifactCollapsed ? '' : 'rotate-90'}" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2l4 4-4 4z" />
				</svg>
				Artifact
				{#if typeof artifact.type === 'string'}
					<span class="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">{artifact.type}</span>
				{/if}
				{#if typeof artifact.id === 'string'}
					<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">{artifact.id}</span>
				{/if}
			</button>
			{#if !artifactCollapsed}
				<div class="border-t border-zinc-200 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
					<JsonViewer data={artifact} />
				</div>
			{/if}
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="rounded-md border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-950/30">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-red-700 dark:text-red-300">Error</span>
				{#if typeof error.code === 'string' || typeof error.code === 'number'}
					<span class="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs text-red-600 dark:bg-red-900/40 dark:text-red-400">{error.code}</span>
				{/if}
			</div>
			{#if typeof error.message === 'string'}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>
			{/if}
			{#if error.details}
				<div class="mt-2 rounded bg-red-100/50 p-2 font-mono text-xs dark:bg-red-900/20">
					<JsonViewer data={error.details} />
				</div>
			{/if}
		</div>
	{/if}

	<!-- Rollback -->
	{#if rollback}
		<div class="rounded-md border border-zinc-200 dark:border-zinc-700">
			<button
				onclick={() => (rollbackCollapsed = !rollbackCollapsed)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				<svg class="h-3 w-3 text-zinc-400 transition-transform dark:text-zinc-500 {rollbackCollapsed ? '' : 'rotate-90'}" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2l4 4-4 4z" />
				</svg>
				Rollback
				{#if typeof rollback.type === 'string'}
					<span class="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">{rollback.type}</span>
				{/if}
				{#if typeof rollback.label === 'string'}
					<span class="text-xs text-zinc-400 dark:text-zinc-500">{rollback.label}</span>
				{/if}
			</button>
			{#if !rollbackCollapsed}
				<div class="border-t border-zinc-200 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
					<JsonViewer data={rollback} />
				</div>
			{/if}
		</div>
	{/if}
</div>
