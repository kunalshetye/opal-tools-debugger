<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initTheme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	const isToolsPage = $derived($page.url.pathname.startsWith('/tools'));

	onMount(() => {
		initTheme();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
	<Header />
	{#if isToolsPage}
		<main class="flex-1 overflow-hidden">
			{@render children()}
		</main>
	{:else}
		<main class="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
			{@render children()}
		</main>
	{/if}
</div>
