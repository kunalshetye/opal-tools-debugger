<script lang="ts">
	import { onMount } from 'svelte';
	import ConnectionForm from '$lib/components/ConnectionForm.svelte';
	import { connectionState } from '$lib/stores/connection.svelte';
	import { toolsState } from '$lib/stores/tools.svelte';
	import { goto } from '$app/navigation';

	let configUrl = $state('');
	let configToken = $state('');

	onMount(async () => {
		// If already connected with tools loaded, go to tools page
		if (connectionState.connected && toolsState.functions.length > 0) {
			goto('/tools');
			return;
		}

		// Fetch CLI-provided defaults
		try {
			const res = await fetch('/api/config');
			const data = await res.json();
			if (data.discoveryUrl) configUrl = data.discoveryUrl;
			if (data.bearerToken) configToken = data.bearerToken;
		} catch {
			// CLI config not available (e.g., in dev mode), ignore
		}
	});
</script>

<svelte:head>
	<title>Opal Tools Debugger</title>
</svelte:head>

<div class="flex flex-col items-center pt-16">
	<div class="mb-8 text-center">
		<h2 class="mb-2 text-2xl font-bold text-zinc-900">Connect to Opal Tools</h2>
		<p class="text-sm text-zinc-500">
			Enter your discovery endpoint URL to list and test your Opal tools locally.
		</p>
	</div>

	<ConnectionForm initialDiscoveryUrl={configUrl} initialBearerToken={configToken} />
</div>
