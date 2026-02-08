<script lang="ts">
	import type { ToolExecutionResult } from '$lib/types';
	import { getStatusInfo } from '$lib/utils/http-status';
	import { generateCurlFromResult } from '$lib/utils/curl-export';
	import JsonViewer from './JsonViewer.svelte';

	interface Props {
		result: ToolExecutionResult;
		onreplay?: (params: Record<string, unknown>) => void;
	}

	let { result, onreplay }: Props = $props();

	let activeTab: 'body' | 'headers' | 'timing' = $state('body');
	let copied = $state(false);
	let curlCopied = $state(false);

	const statusInfo = $derived(getStatusInfo(result.status, result.error));

	const formattedBody = $derived(
		typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)
	);

	const isJsonBody = $derived(
		result.body !== null && typeof result.body === 'object'
	);

	const responseSize = $derived(() => {
		const bytes = new Blob([formattedBody]).size;
		if (bytes < 1024) return `${bytes} B`;
		return `${(bytes / 1024).toFixed(1)} KB`;
	});

	const curlCommand = $derived(generateCurlFromResult(result));

	async function copyBody() {
		await navigator.clipboard.writeText(formattedBody);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function copyCurl() {
		if (!curlCommand) return;
		await navigator.clipboard.writeText(curlCommand);
		curlCopied = true;
		setTimeout(() => (curlCopied = false), 2000);
	}

	function handleReplay() {
		if (result.requestParams && onreplay) {
			onreplay(result.requestParams);
		}
	}
</script>

<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
	<!-- Status bar -->
	<div class="flex items-center gap-3 px-4 py-2.5 {statusInfo.bgColor}">
		<span class="font-mono text-sm font-bold text-white">
			{#if result.error}
				Network Error
			{:else}
				{statusInfo.label}
			{/if}
		</span>
		<div class="flex items-center gap-3 text-xs text-white/70">
			<span>{result.duration}ms</span>
			<span>{responseSize()}</span>
		</div>
		{#if result.error}
			<span class="ml-auto text-xs text-white/80">{result.error}</span>
		{/if}
		<div class="ml-auto flex items-center gap-1.5">
			{#if result.requestParams && onreplay}
				<button
					onclick={handleReplay}
					class="rounded px-2 py-0.5 text-xs font-medium text-white/90 hover:bg-white/20"
					title="Replay with same parameters"
				>
					Replay
				</button>
			{/if}
			{#if curlCommand}
				<button
					onclick={copyCurl}
					class="rounded px-2 py-0.5 text-xs font-medium text-white/90 hover:bg-white/20"
					title="Copy as cURL"
				>
					{curlCopied ? 'Copied!' : 'cURL'}
				</button>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex border-b border-zinc-200 dark:border-zinc-700">
		<button
			onclick={() => (activeTab = 'body')}
			class="px-4 py-2 text-xs font-medium {activeTab === 'body' ? 'border-b-2 border-indigo-400 text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}"
		>
			Body
		</button>
		<button
			onclick={() => (activeTab = 'headers')}
			class="px-4 py-2 text-xs font-medium {activeTab === 'headers' ? 'border-b-2 border-indigo-400 text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}"
		>
			Headers
		</button>
		<button
			onclick={() => (activeTab = 'timing')}
			class="px-4 py-2 text-xs font-medium {activeTab === 'timing' ? 'border-b-2 border-indigo-400 text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}"
		>
			Timing
		</button>
	</div>

	<!-- Tab content -->
	<div class="p-4">
		{#if activeTab === 'body'}
			<div class="relative">
				<button
					onclick={copyBody}
					class="absolute top-2 right-2 z-10 rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
				>
					{copied ? 'Copied!' : 'Copy'}
				</button>
				{#if isJsonBody}
					<div class="max-h-96 overflow-auto rounded-md bg-zinc-50 p-4 font-mono text-sm leading-relaxed dark:bg-zinc-900">
						<JsonViewer data={result.body} />
					</div>
				{:else}
					<pre class="max-h-96 overflow-auto rounded-md bg-zinc-50 p-4 font-mono text-sm text-zinc-700 leading-relaxed dark:bg-zinc-900 dark:text-zinc-300">{formattedBody}</pre>
				{/if}
			</div>
		{:else if activeTab === 'headers'}
			{#if Object.keys(result.headers).length === 0}
				<p class="text-sm text-zinc-500 italic dark:text-zinc-400">No headers available.</p>
			{:else}
				<div class="space-y-1">
					{#each Object.entries(result.headers) as [key, value]}
						<div class="flex gap-2 text-sm">
							<span class="font-mono font-medium text-purple-600 dark:text-purple-400">{key}:</span>
							<span class="font-mono text-zinc-500 dark:text-zinc-400">{value}</span>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'timing'}
			<div class="space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-zinc-500 dark:text-zinc-400">Total Duration</span>
					<span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">{result.duration}ms</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
					<div
						class="h-full rounded-full {result.duration < 500 ? 'bg-emerald-500' : result.duration < 2000 ? 'bg-amber-500' : 'bg-red-500'}"
						style="width: {Math.min(100, (result.duration / 5000) * 100)}%"
					></div>
				</div>
				{#if result.requestSize !== undefined}
					<div class="flex items-center justify-between text-sm">
						<span class="text-zinc-500 dark:text-zinc-400">Request Size</span>
						<span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">
							{result.requestSize < 1024
								? `${result.requestSize} B`
								: `${(result.requestSize / 1024).toFixed(1)} KB`}
						</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
