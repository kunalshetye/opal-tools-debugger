<script lang="ts">
	import { onMount } from 'svelte';
	import ConnectionForm from '$lib/components/ConnectionForm.svelte';
	import { connectionState, connectSandbox } from '$lib/stores/connection.svelte';
	import { setTools } from '$lib/stores/tools.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { logInfo } from '$lib/stores/activity-log.svelte';
	import { SANDBOX_TOOLS } from '$lib/sandbox/mock-tools';

	let configUrl = $state('');
	let configToken = $state('');

	onMount(() => {
		// If already connected, go straight to tools page
		if (connectionState.connected) {
			goto('/tools');
			return;
		}

		// Read CLI-provided defaults from URL query params
		const d = page.url.searchParams.get('d');
		const t = page.url.searchParams.get('t');
		if (d) configUrl = d;
		if (t) configToken = t;
	});

	function enterSandbox() {
		connectSandbox();
		setTools(SANDBOX_TOOLS);
		logInfo('connection', 'Entered sandbox mode with mock tools');
		goto('/tools');
	}
</script>

<svelte:head>
	<title>Opal Tools Debugger</title>
</svelte:head>

<div class="flex flex-col items-center pt-16">
	<div class="mb-8 text-center">
		<h2 class="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Connect to Opal Tools</h2>
		<p class="text-sm text-zinc-500 dark:text-zinc-400">
			Enter your discovery endpoint URL to list and test your Opal tools locally.
		</p>
	</div>

	<ConnectionForm initialDiscoveryUrl={configUrl} initialBearerToken={configToken} />

	<!-- Sandbox divider -->
	<div class="mt-6 flex w-full max-w-md items-center gap-3 px-4">
		<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
		<span class="text-xs text-zinc-400 dark:text-zinc-500">or</span>
		<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
	</div>

	<!-- Sandbox button -->
	<button
		onclick={enterSandbox}
		class="mt-4 flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-amber-500 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
		</svg>
		Try Sandbox Mode
	</button>
	<p class="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
		Explore the app with mock tools — no endpoint needed.
	</p>
</div>
