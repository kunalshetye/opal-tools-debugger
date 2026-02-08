import type { OpalFunction } from '$lib/types';

export const SANDBOX_TOOLS: OpalFunction[] = [
	{
		name: 'hello-world',
		description: 'A simple greeting tool. Returns a personalised hello message.',
		endpoint: '/sandbox/hello-world',
		http_method: 'POST',
		parameters: [
			{
				name: 'name',
				type: 'string',
				required: true,
				description: 'The name to greet'
			},
			{
				name: 'greeting',
				type: 'string',
				required: false,
				description: 'Custom greeting phrase (defaults to "Hello")'
			}
		]
	},
	{
		name: 'abd-demo',
		description:
			'Returns an Adaptive Block Document exercising all supported block types (Heading, Text, Input, Textarea, Checkbox, Switch, Select, Range, Field, Group, Box, Alert, Badge, Code, Link, Separator, Action, CancelAction).',
		endpoint: '/sandbox/abd-demo',
		http_method: 'POST',
		parameters: [
			{
				name: 'title',
				type: 'string',
				required: false,
				description: 'Custom document title (defaults to "ABD Demo")'
			},
			{
				name: 'show_error',
				type: 'boolean',
				required: false,
				description: 'Include an error section in the response'
			},
			{
				name: 'show_data',
				type: 'boolean',
				required: false,
				description: 'Include a data section in the response'
			}
		]
	}
];
