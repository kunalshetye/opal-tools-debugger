<script lang="ts">
	import type { OpalFunction } from '$lib/types';

	interface Props {
		tool: OpalFunction;
	}

	let { tool }: Props = $props();

	const methodColors: Record<string, string> = {
		POST: 'bg-green-100 text-green-700',
		GET: 'bg-blue-100 text-blue-700',
		PUT: 'bg-yellow-100 text-yellow-700',
		DELETE: 'bg-red-100 text-red-700'
	};

	const methodColor = $derived(methodColors[tool.http_method.toUpperCase()] || 'bg-zinc-100 text-zinc-700');
</script>

<a
	href="/tools/{tool.name}"
	class="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
>
	<div class="mb-2 flex items-center gap-2">
		<span class="rounded px-2 py-0.5 text-xs font-semibold uppercase {methodColor}">
			{tool.http_method}
		</span>
		<h3 class="font-semibold text-zinc-900">{tool.name}</h3>
	</div>
	<p class="mb-3 text-sm text-zinc-500 leading-relaxed">{tool.description}</p>
	<div class="flex items-center gap-3 text-xs text-zinc-400">
		<span>{tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}</span>
		<span class="truncate font-mono">{tool.endpoint}</span>
	</div>
</a>
