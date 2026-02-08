<script lang="ts">
	import type { ToolExecutionResult } from '$lib/types';

	interface Props {
		result: ToolExecutionResult;
	}

	let { result }: Props = $props();

	let activeTab: 'body' | 'headers' | 'timing' = $state('body');
	let copied = $state(false);

	const statusColor = $derived(
		result.error
			? 'text-red-600'
			: result.status >= 200 && result.status < 300
				? 'text-green-600'
				: result.status >= 400 && result.status < 500
					? 'text-yellow-600'
					: 'text-red-600'
	);

	const formattedBody = $derived(
		typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)
	);

	async function copyBody() {
		await navigator.clipboard.writeText(formattedBody);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="rounded-lg border border-zinc-200 bg-white">
	<!-- Status bar -->
	<div class="flex items-center gap-4 border-b border-zinc-200 px-4 py-3">
		{#if result.error}
			<span class="font-mono text-sm font-semibold {statusColor}">Error</span>
			<span class="text-sm text-zinc-500">{result.error}</span>
		{:else}
			<span class="font-mono text-sm font-semibold {statusColor}">{result.status}</span>
		{/if}
		<span class="text-sm text-zinc-400">{result.duration}ms</span>
	</div>

	<!-- Tabs -->
	<div class="flex border-b border-zinc-200">
		<button
			onclick={() => (activeTab = 'body')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'body' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}"
		>
			Response Body
		</button>
		<button
			onclick={() => (activeTab = 'headers')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'headers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}"
		>
			Headers
		</button>
		<button
			onclick={() => (activeTab = 'timing')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'timing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}"
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
					class="absolute top-2 right-2 rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
				>
					{copied ? 'Copied!' : 'Copy'}
				</button>
				<pre class="max-h-96 overflow-auto rounded-md bg-zinc-50 p-4 font-mono text-sm text-zinc-800 leading-relaxed">{formattedBody}</pre>
			</div>
		{:else if activeTab === 'headers'}
			{#if Object.keys(result.headers).length === 0}
				<p class="text-sm text-zinc-500 italic">No headers available.</p>
			{:else}
				<div class="space-y-1">
					{#each Object.entries(result.headers) as [key, value]}
						<div class="flex gap-2 text-sm">
							<span class="font-mono font-medium text-zinc-700">{key}:</span>
							<span class="font-mono text-zinc-500">{value}</span>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'timing'}
			<div class="space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-zinc-600">Total Duration</span>
					<span class="font-mono font-medium text-zinc-900">{result.duration}ms</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
					<div
						class="h-full rounded-full {result.duration < 500 ? 'bg-green-500' : result.duration < 2000 ? 'bg-yellow-500' : 'bg-red-500'}"
						style="width: {Math.min(100, (result.duration / 5000) * 100)}%"
					></div>
				</div>
			</div>
		{/if}
	</div>
</div>
