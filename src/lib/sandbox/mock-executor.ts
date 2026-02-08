import type { ToolExecutionResult } from '$lib/types';
import { SANDBOX_URL } from './constants';

function randomDelay(): number {
	return 200 + Math.random() * 300;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		if (signal) {
			if (signal.aborted) {
				clearTimeout(timer);
				reject(new DOMException('The operation was aborted.', 'AbortError'));
				return;
			}
			signal.addEventListener(
				'abort',
				() => {
					clearTimeout(timer);
					reject(new DOMException('The operation was aborted.', 'AbortError'));
				},
				{ once: true }
			);
		}
	});
}

function buildAbdBody(params: Record<string, unknown>): unknown {
	const title = typeof params.title === 'string' && params.title ? params.title : 'ABD Demo';

	const children: unknown[] = [
		{ $type: 'Block.Heading', level: 1, children: title },
		{
			$type: 'Block.Text',
			children: [
				'This Adaptive Block Document exercises every supported block type. It is generated entirely client-side by the sandbox mock executor.'
			]
		},
		{ $type: 'Block.Separator' },

		// Heading levels
		{ $type: 'Block.Heading', level: 2, children: 'Typography' },
		{ $type: 'Block.Heading', level: 3, children: 'Level 3 Heading' },
		{ $type: 'Block.Heading', level: 4, children: 'Level 4 Heading' },
		{
			$type: 'Block.Text',
			children: ['A paragraph of regular text demonstrating the ', 'Text block type.']
		},

		// Badge
		{
			$type: 'Block.Group',
			flexDirection: 'row',
			gap: 2,
			children: [
				{ $type: 'Block.Badge', intent: 'success', children: ['Active'] },
				{ $type: 'Block.Badge', intent: 'warning', children: ['Pending'] },
				{ $type: 'Block.Badge', intent: 'danger', children: ['Error'] },
				{ $type: 'Block.Badge', intent: 'info', children: ['Info'] }
			]
		},

		{ $type: 'Block.Separator' },

		// Form controls
		{ $type: 'Block.Heading', level: 2, children: 'Form Controls' },
		{
			$type: 'Block.Field',
			label: 'Username',
			required: true,
			description: 'Enter your username',
			children: [{ $type: 'Block.Input', name: 'username', placeholder: 'john.doe' }]
		},
		{
			$type: 'Block.Field',
			label: 'Email Address',
			description: 'A text-type input',
			children: [
				{ $type: 'Block.Input', name: 'email', type: 'email', placeholder: 'user@example.com' }
			]
		},
		{
			$type: 'Block.Field',
			label: 'Bio',
			description: 'A multi-line textarea',
			children: [{ $type: 'Block.Textarea', name: 'bio', placeholder: 'Tell us about yourself…' }]
		},
		{
			$type: 'Block.Field',
			label: 'Priority',
			description: 'A dropdown selector',
			children: [
				{
					$type: 'Block.Select',
					name: 'priority',
					options: [
						{ label: 'Low', value: 'low' },
						{ label: 'Medium', value: 'medium' },
						{ label: 'High', value: 'high' }
					]
				}
			]
		},
		{
			$type: 'Block.Field',
			label: 'Volume',
			description: 'A range slider from 0 to 100',
			children: [{ $type: 'Block.Range', name: 'volume', min: 0, max: 100, step: 5 }]
		},
		{ $type: 'Block.Checkbox', children: ['I agree to the terms and conditions'] },
		{ $type: 'Block.Switch', children: ['Enable notifications'] },

		{ $type: 'Block.Separator' },

		// Layout
		{ $type: 'Block.Heading', level: 2, children: 'Layout' },
		{
			$type: 'Block.Group',
			flexDirection: 'row',
			gap: 3,
			children: [
				{
					$type: 'Block.Box',
					children: [{ $type: 'Block.Text', children: ['Box A content'] }]
				},
				{
					$type: 'Block.Box',
					children: [{ $type: 'Block.Text', children: ['Box B content'] }]
				}
			]
		},

		{ $type: 'Block.Separator' },

		// Alerts
		{ $type: 'Block.Heading', level: 2, children: 'Alerts' },
		{ $type: 'Block.Alert', intent: 'info', children: ['This is an informational alert.'] },
		{ $type: 'Block.Alert', intent: 'success', children: ['Operation completed successfully.'] },
		{ $type: 'Block.Alert', intent: 'warning', children: ['Proceed with caution.'] },
		{ $type: 'Block.Alert', intent: 'danger', children: ['Something went wrong!'] },

		{ $type: 'Block.Separator' },

		// Code
		{ $type: 'Block.Heading', level: 2, children: 'Code' },
		{
			$type: 'Block.Code',
			children: 'const greeting = "Hello from ABD!";\nconsole.log(greeting);'
		},

		// Link
		{
			$type: 'Block.Link',
			href: 'https://example.com',
			children: ['Visit example.com']
		}
	];

	const response: Record<string, unknown> = {
		content: {
			$type: 'Block.Document',
			children,
			actions: [
				{ $type: 'Block.Action', children: ['Submit'] },
				{ $type: 'Block.CancelAction', children: ['Cancel'] }
			]
		}
	};

	if (params.show_data) {
		response.data = {
			generated_at: new Date().toISOString(),
			block_count: children.length,
			sandbox: true
		};
	}

	if (params.show_error) {
		response.error = {
			code: 'SANDBOX_ERROR',
			message: 'This is a simulated error for testing purposes.'
		};
	}

	return response;
}

function buildHelloBody(params: Record<string, unknown>): unknown {
	const name = typeof params.name === 'string' && params.name ? params.name : 'World';
	const greeting =
		typeof params.greeting === 'string' && params.greeting ? params.greeting : 'Hello';

	return {
		message: `${greeting}, ${name}!`,
		greeting
	};
}

export async function executeSandboxTool(
	toolName: string,
	params: Record<string, unknown>,
	signal?: AbortSignal
): Promise<ToolExecutionResult> {
	const start = performance.now();
	const delay = randomDelay();

	try {
		await sleep(delay, signal);
	} catch {
		const duration = Math.round(performance.now() - start);
		return {
			status: 0,
			headers: {},
			body: null,
			duration,
			error: 'Request cancelled',
			requestParams: params,
			requestUrl: `${SANDBOX_URL}/${toolName}`,
			requestMethod: 'POST',
			requestHeaders: { 'Content-Type': 'application/json' }
		};
	}

	const duration = Math.round(performance.now() - start);

	if (toolName === 'hello-world') {
		const body = buildHelloBody(params);
		return {
			status: 200,
			headers: { 'content-type': 'application/json' },
			body,
			duration,
			requestParams: params,
			requestUrl: `${SANDBOX_URL}/sandbox/hello-world`,
			requestMethod: 'POST',
			requestHeaders: { 'Content-Type': 'application/json' }
		};
	}

	if (toolName === 'abd-demo') {
		const body = buildAbdBody(params);
		return {
			status: 200,
			headers: { 'content-type': 'application/vnd.opal.block+json' },
			body,
			duration,
			requestParams: params,
			requestUrl: `${SANDBOX_URL}/sandbox/abd-demo`,
			requestMethod: 'POST',
			requestHeaders: { 'Content-Type': 'application/json' }
		};
	}

	// Unknown tool
	return {
		status: 404,
		headers: { 'content-type': 'application/json' },
		body: { error: `Unknown sandbox tool: ${toolName}` },
		duration,
		requestParams: params,
		requestUrl: `${SANDBOX_URL}/${toolName}`,
		requestMethod: 'POST',
		requestHeaders: { 'Content-Type': 'application/json' }
	};
}
