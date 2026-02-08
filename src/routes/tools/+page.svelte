<script lang="ts">
	import { onMount } from 'svelte';
	import { connectionState, disconnect } from '$lib/stores/connection.svelte';
	import { toolsState, setTools, setLoading, clearTools } from '$lib/stores/tools.svelte';
	import { uiState, closeSidebar } from '$lib/stores/ui.svelte';
	import { fetchDiscovery } from '$lib/api/discovery';
	import { goto } from '$app/navigation';
	import ToolSidebar from '$lib/components/ToolSidebar.svelte';
	import ToolDetailPanel from '$lib/components/ToolDetailPanel.svelte';

	let refreshing = $state(false);

	async function refreshDiscovery() {
		refreshing = true;
		try {
			const data = await fetchDiscovery(
				connectionState.discoveryUrl,
				connectionState.bearerToken || undefined
			);
			setTools(data.functions);
		} catch {
			// silently fail on refresh
		} finally {
			refreshing = false;
		}
	}

	onMount(async () => {
		if (!connectionState.connected) {
			goto('/');
			return;
		}

		// Re-fetch tools from discovery if they're not in memory (e.g. after page refresh)
		if (toolsState.functions.length === 0) {
			setLoading();
			try {
				const data = await fetchDiscovery(
					connectionState.discoveryUrl,
					connectionState.bearerToken || undefined
				);
				setTools(data.functions);
			} catch {
				clearTools();
				disconnect();
				goto('/');
			}
		}
	});
</script>

<svelte:head>
	<title>Tools - Opal Tools Debugger</title>
</svelte:head>

<div class="flex h-[calc(100vh-41px)]">
	<!-- Sidebar: hidden on mobile unless open -->
	<!-- Mobile overlay backdrop -->
	{#if uiState.sidebarOpen}
		<button
			class="fixed inset-0 z-30 bg-black/50 md:hidden"
			onclick={closeSidebar}
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Sidebar -->
	<div class="
		{uiState.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
		fixed inset-y-[41px] left-0 z-40 w-72 transition-transform duration-200 ease-in-out
		md:relative md:inset-y-0 md:z-0 md:translate-x-0 md:transition-none
	">
		<ToolSidebar onrefresh={refreshDiscovery} {refreshing} />
	</div>

	<!-- Detail panel -->
	<div class="flex-1 overflow-hidden">
		<ToolDetailPanel />
	</div>
</div>
