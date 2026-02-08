<script lang="ts">
	import { fetchDiscovery } from '$lib/api/discovery';
	import { connect } from '$lib/stores/connection.svelte';
	import { setTools, setLoading, setError } from '$lib/stores/tools.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		initialDiscoveryUrl?: string;
		initialBearerToken?: string;
	}

	let { initialDiscoveryUrl = '', initialBearerToken = '' }: Props = $props();

	let discoveryUrl = $state('');
	let bearerToken = $state('');
	let showToken = $state(false);
	let loading = $state(false);
	let error = $state('');

	$effect(() => {
		if (initialDiscoveryUrl && !discoveryUrl) discoveryUrl = initialDiscoveryUrl;
		if (initialBearerToken && !bearerToken) bearerToken = initialBearerToken;
	});

	async function handleConnect() {
		if (!discoveryUrl.trim()) return;

		loading = true;
		error = '';
		setLoading();

		try {
			const data = await fetchDiscovery(discoveryUrl.trim(), bearerToken.trim() || undefined);
			connect(discoveryUrl.trim(), bearerToken.trim());
			setTools(data.functions);
			goto('/tools');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to connect';
			error = msg;
			setError(msg);
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={handleConnect} class="w-full max-w-lg space-y-5">
	<div>
		<label for="discovery-url" class="mb-1.5 block text-sm font-medium text-zinc-700">
			Discovery URL <span class="text-red-500">*</span>
		</label>
		<input
			id="discovery-url"
			type="url"
			bind:value={discoveryUrl}
			placeholder="https://your-opal-tools.example.com/discovery"
			required
			class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
		/>
	</div>

	<div>
		<label for="bearer-token" class="mb-1.5 block text-sm font-medium text-zinc-700">
			Bearer Token
			<span class="text-zinc-400">(optional)</span>
		</label>
		<div class="relative">
			<input
				id="bearer-token"
				type={showToken ? 'text' : 'password'}
				bind:value={bearerToken}
				placeholder="Enter bearer token"
				class="w-full rounded-md border border-zinc-300 px-3 py-2 pr-16 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
			/>
			<button
				type="button"
				onclick={() => (showToken = !showToken)}
				class="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
			>
				{showToken ? 'Hide' : 'Show'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	<button
		type="submit"
		disabled={loading || !discoveryUrl.trim()}
		class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{#if loading}
			Connecting...
		{:else}
			Connect
		{/if}
	</button>
</form>
