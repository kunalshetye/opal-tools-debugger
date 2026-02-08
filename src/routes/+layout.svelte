<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import ActivityLogPanel from '$lib/components/ActivityLogPanel.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { togglePanel } from '$lib/stores/activity-log.svelte';

	let { children } = $props();

	const isToolsPage = $derived($page.url.pathname.startsWith('/tools'));

	onMount(() => {
		initTheme();
	});

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
			e.preventDefault();
			togglePanel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
	<Header />
	{#if isToolsPage}
		<main class="min-h-0 flex-1 overflow-hidden">
			{@render children()}
		</main>
	{:else}
		<main class="mx-auto w-full max-w-6xl min-h-0 flex-1 overflow-auto px-6 py-8">
			{@render children()}
		</main>
	{/if}
	<ActivityLogPanel />
</div>
