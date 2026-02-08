<script lang="ts">
	import {
		activityLogState,
		getFilteredEntries,
		setFilterLevel,
		setFilterCategory,
		setSearchQuery,
		clearLog,
		closePanel,
		setPanelHeight,
		toggleAutoScroll,
		setAutoScroll
	} from '$lib/stores/activity-log.svelte';
	import type { LogLevel, LogCategory } from '$lib/types';
	import ActivityLogEntry from './ActivityLogEntry.svelte';

	let scrollContainer: HTMLDivElement | undefined = $state();
	let dragging = $state(false);
	let dragStartY = 0;
	let dragStartHeight = 0;

	const filteredEntries = $derived(getFilteredEntries());
	const clampedHeight = $derived(Math.min(activityLogState.panelHeight, window?.innerHeight ? window.innerHeight * 0.5 : 600));

	// Auto-scroll when new entries arrive
	$effect(() => {
		const _len = filteredEntries.length;
		if (activityLogState.autoScroll && scrollContainer) {
			requestAnimationFrame(() => {
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight;
				}
			});
		}
	});

	function handleScroll() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const atBottom = scrollHeight - scrollTop - clientHeight < 20;
		if (!atBottom && activityLogState.autoScroll) {
			setAutoScroll(false);
		} else if (atBottom && !activityLogState.autoScroll) {
			setAutoScroll(true);
		}
	}

	function handleDragStart(e: PointerEvent) {
		dragging = true;
		dragStartY = e.clientY;
		dragStartHeight = activityLogState.panelHeight;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handleDragMove(e: PointerEvent) {
		if (!dragging) return;
		const delta = dragStartY - e.clientY;
		setPanelHeight(dragStartHeight + delta);
	}

	function handleDragEnd() {
		dragging = false;
	}

	function handleLevelChange(e: Event) {
		setFilterLevel((e.target as HTMLSelectElement).value as LogLevel | 'all');
	}

	function handleCategoryChange(e: Event) {
		setFilterCategory((e.target as HTMLSelectElement).value as LogCategory | 'all');
	}

	function handleSearchInput(e: Event) {
		setSearchQuery((e.target as HTMLInputElement).value);
	}

	function exportLog() {
		const data = JSON.stringify(filteredEntries, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'otd-activity-log.json';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if activityLogState.panelOpen}
	<div
		class="shrink-0 border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
		style="height: {clampedHeight}px"
	>
		<!-- Drag handle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex h-1.5 cursor-row-resize items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 {dragging ? 'bg-indigo-100 dark:bg-indigo-500/10' : ''}"
			onpointerdown={handleDragStart}
			onpointermove={handleDragMove}
			onpointerup={handleDragEnd}
			onpointercancel={handleDragEnd}
		>
			<div class="h-0.5 w-8 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
		</div>

		<!-- Toolbar -->
		<div class="flex items-center gap-2 border-b border-zinc-100 px-3 py-1 dark:border-zinc-800">
			<span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Activity Log</span>

			<select
				value={activityLogState.filterCategory}
				onchange={handleCategoryChange}
				class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
			>
				<option value="all">All categories</option>
				<option value="connection">Connection</option>
				<option value="discovery">Discovery</option>
				<option value="execution">Execution</option>
				<option value="app">App</option>
			</select>

			<select
				value={activityLogState.filterLevel}
				onchange={handleLevelChange}
				class="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
			>
				<option value="all">All levels</option>
				<option value="info">Info</option>
				<option value="success">Success</option>
				<option value="warning">Warning</option>
				<option value="error">Error</option>
			</select>

			<input
				type="text"
				value={activityLogState.searchQuery}
				oninput={handleSearchInput}
				placeholder="Search..."
				class="h-5 w-28 rounded border border-zinc-200 bg-white px-1.5 text-[11px] text-zinc-600 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
			/>

			<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
				{filteredEntries.length} / {activityLogState.entries.length}
			</span>

			<div class="flex-1"></div>

			<button
				type="button"
				onclick={toggleAutoScroll}
				class="rounded px-1.5 py-0.5 text-[11px] transition {activityLogState.autoScroll ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}"
				title="Auto-scroll to latest"
			>
				Auto-scroll
			</button>

			<button
				type="button"
				onclick={exportLog}
				class="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
				title="Export log as JSON"
			>
				Export
			</button>

			<button
				type="button"
				onclick={clearLog}
				class="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
				title="Clear log"
			>
				Clear
			</button>

			<button
				type="button"
				onclick={closePanel}
				class="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
				title="Close panel"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Entries -->
		<div
			bind:this={scrollContainer}
			onscroll={handleScroll}
			class="overflow-y-auto"
			style="height: calc(100% - 40px)"
		>
			{#if filteredEntries.length === 0}
				<div class="flex items-center justify-center py-8 text-xs text-zinc-400 italic dark:text-zinc-500">
					No log entries yet.
				</div>
			{:else}
				{#each filteredEntries as entry (entry.id)}
					<ActivityLogEntry {entry} />
				{/each}
			{/if}
		</div>
	</div>
{/if}
