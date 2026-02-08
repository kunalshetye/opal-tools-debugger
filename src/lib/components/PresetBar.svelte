<script lang="ts">
	import type { ToolPreset } from '$lib/types';
	import { exportPresets, importPresets } from '$lib/utils/preset-io';
	import { connectionState } from '$lib/stores/connection.svelte';
	import { uiState } from '$lib/stores/ui.svelte';
	import BulkExecutor from './BulkExecutor.svelte';

	interface Props {
		presets: ToolPreset[];
		loading: boolean;
		selectedPresetId: string | null;
		onsave: (name: string) => void;
		onload: (preset: ToolPreset) => void;
		onupdate: (preset: ToolPreset) => void;
		ondelete: (preset: ToolPreset) => void;
		onbulkexecute?: (presets: ToolPreset[]) => void;
	}

	let { presets, loading, selectedPresetId, onsave, onload, onupdate, ondelete, onbulkexecute }: Props = $props();

	let saving = $state(false);
	let presetName = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	const selectedPreset = $derived(
		selectedPresetId ? presets.find((p) => p.id === selectedPresetId) ?? null : null
	);

	function handleSelectChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		if (!value) return;
		const preset = presets.find((p) => p.id === value);
		if (preset) onload(preset);
	}

	function handleSaveClick() {
		saving = true;
		presetName = '';
	}

	function handleConfirmSave() {
		const name = presetName.trim();
		if (!name) return;
		onsave(name);
		saving = false;
		presetName = '';
	}

	function handleCancelSave() {
		saving = false;
		presetName = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirmSave();
		else if (e.key === 'Escape') handleCancelSave();
	}

	function handleExport() {
		if (presets.length === 0) return;
		exportPresets(presets, uiState.selectedToolName ?? 'tool');
	}

	function handleImportClick() {
		fileInput?.click();
	}

	async function handleFileSelected(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file || !connectionState.discoveryUrl || !uiState.selectedToolName) return;
		try {
			await importPresets(file, connectionState.discoveryUrl, uiState.selectedToolName, presets);
		} catch {
			// ignore invalid files
		}
		if (fileInput) fileInput.value = '';
	}

	function handleBulkExecute(selectedPresets: ToolPreset[]) {
		onbulkexecute?.(selectedPresets);
	}
</script>

<input
	type="file"
	accept=".json"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileSelected}
/>

<div class="mb-3 flex flex-wrap items-center gap-2">
	{#if loading}
		<span class="text-xs text-zinc-400 italic">Loading presets...</span>
	{:else if saving}
		<input
			type="text"
			bind:value={presetName}
			onkeydown={handleKeydown}
			placeholder="Preset name"
			class="h-7 rounded border border-zinc-300 bg-white px-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
		/>
		<button
			onclick={handleConfirmSave}
			disabled={!presetName.trim()}
			class="h-7 rounded bg-indigo-500 px-2.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
		>
			Confirm
		</button>
		<button
			onclick={handleCancelSave}
			class="h-7 rounded border border-zinc-300 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
		>
			Cancel
		</button>
	{:else}
		<select
			onchange={handleSelectChange}
			value={selectedPresetId ?? ''}
			class="h-7 rounded border border-zinc-300 bg-white pr-6 pl-2 text-xs text-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
		>
			<option value="">
				{presets.length === 0 ? 'No presets' : 'Select preset...'}
			</option>
			{#each presets as preset (preset.id)}
				<option value={preset.id}>{preset.presetName}</option>
			{/each}
		</select>

		<button
			onclick={handleSaveClick}
			class="h-7 rounded border border-zinc-300 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
			title="Save current values as preset"
		>
			Save
		</button>

		{#if selectedPreset}
			<button
				onclick={() => onupdate(selectedPreset)}
				class="h-7 rounded border border-zinc-300 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
				title="Update selected preset with current values"
			>
				Update
			</button>
			<button
				onclick={() => ondelete(selectedPreset)}
				class="h-7 rounded border border-red-300 px-2.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
				title="Delete selected preset"
			>
				Delete
			</button>
		{/if}

		{#if presets.length > 0}
			<button
				onclick={handleExport}
				class="h-7 rounded border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
				title="Export presets"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
			</button>
		{/if}

		<button
			onclick={handleImportClick}
			class="h-7 rounded border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
			title="Import presets"
		>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
		</button>

		{#if onbulkexecute}
			<BulkExecutor {presets} onexecute={handleBulkExecute} />
		{/if}
	{/if}
</div>
