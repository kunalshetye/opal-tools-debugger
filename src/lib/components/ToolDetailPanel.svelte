<script lang="ts">
	import { connectionState } from '$lib/stores/connection.svelte';
	import { getToolByName } from '$lib/stores/tools.svelte';
	import { uiState, getResultsForTool, addResultForTool, toggleSidebar } from '$lib/stores/ui.svelte';
	import { presetsState, loadPresets, addPreset, removePreset, overwritePreset } from '$lib/stores/presets.svelte';
	import { executeTool } from '$lib/api/executor';
	import { mergePresetWithParameters } from '$lib/utils/preset-merge';
	import { logInfo, logSuccess, logWarning, logError } from '$lib/stores/activity-log.svelte';
	import type { ToolPreset } from '$lib/types';
	import ToolForm from './ToolForm.svelte';
	import ResponseViewer from './ResponseViewer.svelte';
	import PresetBar from './PresetBar.svelte';

	const tool = $derived(uiState.selectedToolName ? getToolByName(uiState.selectedToolName) : null);
	const results = $derived(uiState.selectedToolName ? getResultsForTool(uiState.selectedToolName) : []);

	let loading = $state(false);
	let currentFormValues: Record<string, string | number | boolean> = $state({});
	let initialValues: Record<string, string | number | boolean> | null = $state(null);

	const methodColors: Record<string, string> = {
		POST: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
		GET: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
		PUT: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
		DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400'
	};

	// Load presets when selected tool changes
	$effect(() => {
		if (uiState.selectedToolName && connectionState.discoveryUrl) {
			loadPresets(connectionState.discoveryUrl, uiState.selectedToolName);
			initialValues = null;
		}
	});

	function handleValuesChange(values: Record<string, string | number | boolean>) {
		currentFormValues = values;
	}

	function handleLoadPreset(preset: ToolPreset) {
		if (!tool) return;
		presetsState.selectedPresetId = preset.id;
		initialValues = mergePresetWithParameters(preset.values, tool.parameters);
	}

	async function handleSavePreset(name: string) {
		if (!connectionState.discoveryUrl || !uiState.selectedToolName) return;
		await addPreset(
			connectionState.discoveryUrl,
			uiState.selectedToolName,
			name,
			currentFormValues
		);
	}

	async function handleUpdatePreset(preset: ToolPreset) {
		await overwritePreset(preset.id, currentFormValues);
	}

	async function handleDeletePreset(preset: ToolPreset) {
		await removePreset(preset.id);
		initialValues = null;
	}

	async function handleExecute(params: Record<string, unknown>) {
		if (!tool || !uiState.selectedToolName) return;
		loading = true;
		logInfo('execution', `Executing ${tool.name} (${tool.http_method} ${tool.endpoint})...`, params);

		const result = await executeTool(
			connectionState.baseUrl,
			tool.endpoint,
			params,
			connectionState.bearerToken || undefined
		);

		addResultForTool(uiState.selectedToolName, result);

		if (result.error) {
			logError('execution', `${tool.name} failed: ${result.error}`, result);
		} else if (result.status >= 400) {
			logWarning('execution', `${tool.name} returned ${result.status} (${result.duration}ms)`, result);
		} else {
			logSuccess('execution', `${tool.name} returned ${result.status} (${result.duration}ms)`, result);
		}

		loading = false;
	}
</script>

<div class="flex h-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-850">
	{#if tool}
		<!-- Tool header -->
		<div class="shrink-0 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900">
			<div class="flex items-center gap-3">
				<!-- Mobile menu button -->
				<button
					onclick={toggleSidebar}
					class="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					aria-label="Open tool list"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>

				<span class="shrink-0 rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase {methodColors[tool.http_method.toUpperCase()] || 'bg-zinc-500/20 text-zinc-500 dark:text-zinc-400'}">
					{tool.http_method}
				</span>
				<h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{tool.name}</h2>
			</div>
			{#if tool.description}
				<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tool.description}</p>
			{/if}
			<div class="mt-1.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">
				{connectionState.baseUrl}{tool.endpoint}
			</div>
		</div>

		<!-- Form + Response -->
		<div class="flex-1 overflow-y-auto">
			<div class="grid gap-6 p-5 lg:grid-cols-2">
				<div>
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
						Parameters
					</h3>
					<PresetBar
						presets={presetsState.presets}
						loading={presetsState.loading}
						selectedPresetId={presetsState.selectedPresetId}
						onsave={handleSavePreset}
						onload={handleLoadPreset}
						onupdate={handleUpdatePreset}
						ondelete={handleDeletePreset}
					/>
					<ToolForm
						parameters={tool.parameters}
						onexecute={handleExecute}
						{loading}
						{initialValues}
						onvalueschange={handleValuesChange}
					/>
				</div>

				<div>
					<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
						Response
						{#if results.length > 0}
							<span class="ml-1 font-normal normal-case text-zinc-400 dark:text-zinc-600">
								({results.length} execution{results.length !== 1 ? 's' : ''})
							</span>
						{/if}
					</h3>

					{#if results.length === 0}
						<div class="flex items-center justify-center rounded-lg border border-zinc-200 bg-white/50 py-12 dark:border-zinc-700 dark:bg-zinc-800/50">
							<p class="text-sm text-zinc-500 italic">Execute the tool to see the response here.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each results as result, i}
								{#if i > 0}
									<details class="group">
										<summary class="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
											Previous execution ({result.status}, {result.duration}ms)
										</summary>
										<div class="mt-2">
											<ResponseViewer {result} />
										</div>
									</details>
								{:else}
									<ResponseViewer {result} />
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Empty state -->
		<div class="flex flex-1 flex-col items-center justify-center">
			<!-- Mobile menu button -->
			<button
				onclick={toggleSidebar}
				class="mb-4 rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 md:hidden dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
			>
				Browse tools
			</button>
			<svg class="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<p class="text-sm text-zinc-500">Select a tool from the sidebar</p>
		</div>
	{/if}
</div>
