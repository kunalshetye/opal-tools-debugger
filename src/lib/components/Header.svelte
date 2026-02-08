<script lang="ts">
	import { connectionState, disconnect } from '$lib/stores/connection.svelte';
	import { clearTools } from '$lib/stores/tools.svelte';
	import { goto } from '$app/navigation';

	function handleDisconnect() {
		clearTools();
		disconnect();
		goto('/');
	}
</script>

<header class="border-b border-zinc-200 bg-white px-6 py-4">
	<div class="mx-auto flex max-w-6xl items-center justify-between">
		<a href="/" class="flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
				O
			</div>
			<h1 class="text-lg font-semibold text-zinc-900">Opal Tools Debugger</h1>
		</a>

		{#if connectionState.connected}
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-2 text-sm text-zinc-500">
					<span class="h-2 w-2 rounded-full bg-green-500"></span>
					{connectionState.baseUrl}
				</span>
				<button
					onclick={handleDisconnect}
					class="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
				>
					Disconnect
				</button>
			</div>
		{/if}
	</div>
</header>
