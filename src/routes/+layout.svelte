<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import ActivityLogPanel from '$lib/components/ActivityLogPanel.svelte';
	import { page } from '$app/stores';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { activityLogState, togglePanel, closePanel } from '$lib/stores/activity-log.svelte';
	import { closeSidebar, uiState } from '$lib/stores/ui.svelte';

	let { children } = $props();

	const isToolsPage = $derived($page.url.pathname.startsWith('/tools'));

	// Apply theme immediately at module level to prevent flash of wrong theme
	initTheme();

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.ctrlKey || e.metaKey;

		// Cmd/Ctrl+Shift+L: Toggle activity log
		if (mod && e.shiftKey && e.key === 'L') {
			e.preventDefault();
			togglePanel();
			return;
		}

		// Cmd/Ctrl+Enter: Execute current tool
		if (mod && e.key === 'Enter' && isToolsPage) {
			e.preventDefault();
			document.querySelector<HTMLFormElement>('form')?.requestSubmit();
			return;
		}

		// Cmd/Ctrl+K: Focus sidebar search
		if (mod && e.key === 'k' && isToolsPage) {
			e.preventDefault();
			const input = document.querySelector<HTMLInputElement>('[data-sidebar-search]');
			input?.focus();
			return;
		}

		// Escape: Close activity log, then sidebar
		if (e.key === 'Escape') {
			if (activityLogState.panelOpen) {
				closePanel();
				return;
			}
			if (uiState.sidebarOpen) {
				closeSidebar();
				return;
			}
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
