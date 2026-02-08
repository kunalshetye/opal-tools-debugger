<script lang="ts">
	import AbdRenderer from './AbdRenderer.svelte';

	interface Props {
		node: unknown;
		depth?: number;
	}

	let { node, depth = 0 }: Props = $props();

	const MAX_DEPTH = 10;

	function isBlock(val: unknown): val is Record<string, unknown> {
		return val !== null && typeof val === 'object' && !Array.isArray(val) && '$type' in val;
	}

	function getType(block: Record<string, unknown>): string {
		return String(block.$type ?? '');
	}

	function getShortType(fullType: string): string {
		return fullType.replace('Block.', '');
	}

	function getChildren(block: Record<string, unknown>): unknown[] {
		const children = block.children;
		if (children === undefined || children === null) return [];
		if (Array.isArray(children)) return children;
		return [children];
	}

	function getStringContent(block: Record<string, unknown>): string {
		const children = block.children;
		if (typeof children === 'string') return children;
		if (typeof children === 'number' || typeof children === 'boolean') return String(children);
		return '';
	}

	function getOptions(block: Record<string, unknown>): { label: string; value: string }[] {
		const options = block.options;
		if (!Array.isArray(options)) return [];
		return options.filter(
			(o) => o !== null && typeof o === 'object' && 'label' in o && 'value' in o
		) as { label: string; value: string }[];
	}

	function getAlertClasses(intent: unknown): {
		bg: string;
		border: string;
		text: string;
	} {
		switch (intent) {
			case 'danger':
				return {
					bg: 'bg-red-50 dark:bg-red-950/30',
					border: 'border-red-300 dark:border-red-700',
					text: 'text-red-800 dark:text-red-300'
				};
			case 'success':
				return {
					bg: 'bg-emerald-50 dark:bg-emerald-950/30',
					border: 'border-emerald-300 dark:border-emerald-700',
					text: 'text-emerald-800 dark:text-emerald-300'
				};
			case 'warning':
				return {
					bg: 'bg-amber-50 dark:bg-amber-950/30',
					border: 'border-amber-300 dark:border-amber-700',
					text: 'text-amber-800 dark:text-amber-300'
				};
			case 'info':
				return {
					bg: 'bg-blue-50 dark:bg-blue-950/30',
					border: 'border-blue-300 dark:border-blue-700',
					text: 'text-blue-800 dark:text-blue-300'
				};
			default:
				return {
					bg: 'bg-zinc-50 dark:bg-zinc-800',
					border: 'border-zinc-300 dark:border-zinc-600',
					text: 'text-zinc-700 dark:text-zinc-300'
				};
		}
	}

	function getBadgeClasses(intent: unknown): string {
		switch (intent) {
			case 'danger':
				return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
			case 'success':
				return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
			case 'warning':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
			case 'info':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
			default:
				return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300';
		}
	}

	function getHeadingLevel(block: Record<string, unknown>): number {
		const level = Number(block.level);
		if (level >= 1 && level <= 4) return level;
		return 3;
	}
</script>

{#if depth > MAX_DEPTH}
	<div class="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
		Max depth reached
	</div>
{:else if node === null || node === undefined}
	<span class="text-xs text-zinc-400 italic dark:text-zinc-500">null</span>
{:else if typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean'}
	<span class="text-sm text-zinc-700 dark:text-zinc-300">{String(node)}</span>
{:else if isBlock(node)}
	{@const blockType = getType(node)}
	{@const shortType = getShortType(blockType)}

	{#if blockType === 'Block.Document'}
		<div class="space-y-3">
			{#if node.blocking}
				<span class="inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
					Blocking
				</span>
			{/if}
			{#each getChildren(node) as child}
				<AbdRenderer node={child} depth={depth + 1} />
			{/each}
			{#if Array.isArray(node.actions) && node.actions.length > 0}
				<div class="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
					{#each node.actions as action}
						<AbdRenderer node={action} depth={depth + 1} />
					{/each}
				</div>
			{/if}
		</div>

	{:else if blockType === 'Block.Heading'}
		{@const level = getHeadingLevel(node)}
		{@const text = getStringContent(node)}
		<div class="flex items-center gap-2">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			{#if level === 1}
				<h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{text}</h1>
			{:else if level === 2}
				<h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">{text}</h2>
			{:else if level === 3}
				<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{text}</h3>
			{:else}
				<h4 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{text}</h4>
			{/if}
		</div>

	{:else if blockType === 'Block.Text'}
		<div class="flex items-start gap-2">
			<span class="mt-0.5 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<p class="text-sm text-zinc-700 dark:text-zinc-300">
				{#each getChildren(node) as child}
					{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
						{String(child)}
					{:else}
						<AbdRenderer node={child} depth={depth + 1} />
					{/if}
				{/each}
			</p>
		</div>

	{:else if blockType === 'Block.Input'}
		<div class="space-y-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<input
				type={typeof node.type === 'string' ? node.type : 'text'}
				disabled
				placeholder={typeof node.placeholder === 'string' ? node.placeholder : ''}
				class="w-full rounded border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
			/>
			{#if typeof node.name === 'string'}
				<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">name: {node.name}</span>
			{/if}
		</div>

	{:else if blockType === 'Block.Textarea'}
		<div class="space-y-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<textarea
				disabled
				placeholder={typeof node.placeholder === 'string' ? node.placeholder : ''}
				rows="3"
				class="w-full rounded border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
			></textarea>
			{#if typeof node.name === 'string'}
				<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">name: {node.name}</span>
			{/if}
		</div>

	{:else if blockType === 'Block.Checkbox'}
		<label class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<input type="checkbox" disabled class="opacity-70" />
			{#each getChildren(node) as child}
				{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
					{String(child)}
				{:else}
					<AbdRenderer node={child} depth={depth + 1} />
				{/if}
			{/each}
		</label>

	{:else if blockType === 'Block.Switch'}
		<label class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<div class="relative inline-flex h-5 w-9 items-center rounded-full bg-zinc-300 opacity-70 dark:bg-zinc-600">
				<div class="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow dark:bg-zinc-300"></div>
			</div>
			{#each getChildren(node) as child}
				{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
					{String(child)}
				{:else}
					<AbdRenderer node={child} depth={depth + 1} />
				{/if}
			{/each}
		</label>

	{:else if blockType === 'Block.Select'}
		<div class="space-y-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<select disabled class="w-full rounded border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
				{#each getOptions(node) as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			{#if typeof node.name === 'string'}
				<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">name: {node.name}</span>
			{/if}
		</div>

	{:else if blockType === 'Block.Range'}
		<div class="space-y-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<input
				type="range"
				disabled
				min={typeof node.min === 'number' ? node.min : 0}
				max={typeof node.max === 'number' ? node.max : 100}
				step={typeof node.step === 'number' ? node.step : 1}
				class="w-full opacity-70"
			/>
			<div class="flex justify-between font-mono text-xs text-zinc-400 dark:text-zinc-500">
				<span>{typeof node.min === 'number' ? node.min : 0}</span>
				<span>{typeof node.max === 'number' ? node.max : 100}</span>
			</div>
		</div>

	{:else if blockType === 'Block.Field'}
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
				{#if typeof node.label === 'string'}
					<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						{node.label}{#if node.required}<span class="text-red-500"> *</span>{/if}
					</span>
				{/if}
			</div>
			{#if typeof node.description === 'string'}
				<p class="text-xs text-zinc-500 dark:text-zinc-400">{node.description}</p>
			{/if}
			{#each getChildren(node) as child}
				<AbdRenderer node={child} depth={depth + 1} />
			{/each}
		</div>

	{:else if blockType === 'Block.Group'}
		{@const direction = node.flexDirection === 'column' ? 'flex-col' : 'flex-row'}
		{@const gap = typeof node.gap === 'number' ? `gap-${Math.min(node.gap, 8)}` : 'gap-3'}
		<div class="flex items-start gap-2">
			<span class="mt-0.5 shrink-0 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<div class="flex flex-wrap {direction} {gap} flex-1">
				{#each getChildren(node) as child}
					<AbdRenderer node={child} depth={depth + 1} />
				{/each}
			</div>
		</div>

	{:else if blockType === 'Block.Box'}
		<div class="flex items-start gap-2">
			<span class="mt-0.5 shrink-0 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<div class="flex-1 space-y-2">
				{#each getChildren(node) as child}
					<AbdRenderer node={child} depth={depth + 1} />
				{/each}
			</div>
		</div>

	{:else if blockType === 'Block.Alert'}
		{@const classes = getAlertClasses(node.intent)}
		<div class="flex items-start gap-2">
			<span class="mt-0.5 shrink-0 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<div class="flex-1 rounded-md border px-3 py-2 text-sm {classes.bg} {classes.border} {classes.text}">
				{#each getChildren(node) as child}
					{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
						{String(child)}
					{:else}
						<AbdRenderer node={child} depth={depth + 1} />
					{/if}
				{/each}
			</div>
		</div>

	{:else if blockType === 'Block.Badge'}
		<span class="inline-flex items-center gap-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {getBadgeClasses(node.intent)}">
				{#each getChildren(node) as child}
					{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
						{String(child)}
					{:else}
						<AbdRenderer node={child} depth={depth + 1} />
					{/if}
				{/each}
			</span>
		</span>

	{:else if blockType === 'Block.Code'}
		<div class="space-y-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<pre class="overflow-x-auto rounded-md bg-zinc-900 p-3 font-mono text-sm text-zinc-100 dark:bg-zinc-950">{getStringContent(node)}</pre>
		</div>

	{:else if blockType === 'Block.Link'}
		<span class="inline-flex items-center gap-1">
			<span class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">{shortType}</span>
			<a
				href={typeof node.href === 'string' ? node.href : '#'}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
			>
				{#each getChildren(node) as child}
					{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
						{String(child)}
					{:else}
						<AbdRenderer node={child} depth={depth + 1} />
					{/if}
				{/each}
			</a>
		</span>

	{:else if blockType === 'Block.Separator'}
		<hr class="border-zinc-200 dark:border-zinc-700" />

	{:else if blockType === 'Block.Action'}
		<button
			disabled
			class="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white opacity-70 dark:bg-indigo-500"
		>
			{#each getChildren(node) as child}
				{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
					{String(child)}
				{:else}
					<AbdRenderer node={child} depth={depth + 1} />
				{/if}
			{/each}
		</button>

	{:else if blockType === 'Block.CancelAction'}
		<button
			disabled
			class="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 opacity-70 dark:border-zinc-600 dark:text-zinc-400"
		>
			{#each getChildren(node) as child}
				{#if typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean'}
					{String(child)}
				{:else}
					<AbdRenderer node={child} depth={depth + 1} />
				{/if}
			{/each}
		</button>

	{:else}
		<!-- Unknown block type -->
		<div class="rounded border border-amber-300 bg-amber-50 p-2 dark:border-amber-600 dark:bg-amber-950/30">
			<div class="flex items-center gap-2">
				<span class="rounded bg-amber-200 px-1 py-0.5 font-mono text-[10px] text-amber-700 dark:bg-amber-800 dark:text-amber-300">{blockType}</span>
				<span class="text-xs text-amber-600 dark:text-amber-400">Unknown block type</span>
			</div>
			<pre class="mt-1 overflow-x-auto text-xs text-amber-700 dark:text-amber-400">{JSON.stringify(node, null, 2)}</pre>
		</div>
	{/if}
{:else if Array.isArray(node)}
	{#each node as child}
		<AbdRenderer node={child} depth={depth + 1} />
	{/each}
{:else}
	<span class="text-xs text-zinc-400 italic dark:text-zinc-500">{String(node)}</span>
{/if}
