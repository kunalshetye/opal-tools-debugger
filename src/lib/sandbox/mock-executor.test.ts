import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSandboxTool } from './mock-executor';

beforeEach(() => {
	vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
});

describe('executeSandboxTool', () => {
	describe('hello-world', () => {
		it('returns a greeting with the provided name', async () => {
			const result = await executeSandboxTool('hello-world', { name: 'Alice' });
			expect(result.status).toBe(200);
			expect(result.body).toEqual({
				message: 'Hello, Alice!',
				greeting: 'Hello'
			});
		});

		it('uses custom greeting when provided', async () => {
			const result = await executeSandboxTool('hello-world', {
				name: 'Bob',
				greeting: 'Hi'
			});
			expect(result.status).toBe(200);
			expect(result.body).toEqual({
				message: 'Hi, Bob!',
				greeting: 'Hi'
			});
		});

		it('defaults name to World when empty', async () => {
			const result = await executeSandboxTool('hello-world', {});
			expect(result.status).toBe(200);
			expect(result.body).toEqual({
				message: 'Hello, World!',
				greeting: 'Hello'
			});
		});

		it('returns application/json content-type', async () => {
			const result = await executeSandboxTool('hello-world', { name: 'Test' });
			expect(result.headers['content-type']).toBe('application/json');
		});

		it('populates request metadata', async () => {
			const result = await executeSandboxTool('hello-world', { name: 'Test' });
			expect(result.requestParams).toEqual({ name: 'Test' });
			expect(result.requestUrl).toBe('sandbox://local/sandbox/hello-world');
			expect(result.requestMethod).toBe('POST');
			expect(result.requestHeaders).toEqual({ 'Content-Type': 'application/json' });
		});
	});

	describe('abd-demo', () => {
		it('returns a Block.Document response', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			expect(result.status).toBe(200);
			const body = result.body as Record<string, unknown>;
			const content = body.content as Record<string, unknown>;
			expect(content.$type).toBe('Block.Document');
		});

		it('uses custom title when provided', async () => {
			const result = await executeSandboxTool('abd-demo', { title: 'My Custom Title' });
			const body = result.body as Record<string, unknown>;
			const content = body.content as Record<string, unknown>;
			const children = content.children as Array<Record<string, unknown>>;
			// First child is the heading
			expect(children[0].$type).toBe('Block.Heading');
			expect(children[0].children).toBe('My Custom Title');
		});

		it('defaults title to ABD Demo', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			const body = result.body as Record<string, unknown>;
			const content = body.content as Record<string, unknown>;
			const children = content.children as Array<Record<string, unknown>>;
			expect(children[0].children).toBe('ABD Demo');
		});

		it('includes error section when show_error is true', async () => {
			const result = await executeSandboxTool('abd-demo', { show_error: true });
			const body = result.body as Record<string, unknown>;
			expect(body.error).toBeDefined();
			expect((body.error as Record<string, unknown>).code).toBe('SANDBOX_ERROR');
		});

		it('does not include error section by default', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			const body = result.body as Record<string, unknown>;
			expect(body.error).toBeUndefined();
		});

		it('includes data section when show_data is true', async () => {
			const result = await executeSandboxTool('abd-demo', { show_data: true });
			const body = result.body as Record<string, unknown>;
			expect(body.data).toBeDefined();
			expect((body.data as Record<string, unknown>).sandbox).toBe(true);
		});

		it('does not include data section by default', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			const body = result.body as Record<string, unknown>;
			expect(body.data).toBeUndefined();
		});

		it('returns application/vnd.opal.block+json content-type', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			expect(result.headers['content-type']).toBe('application/vnd.opal.block+json');
		});

		it('includes actions in the document', async () => {
			const result = await executeSandboxTool('abd-demo', {});
			const body = result.body as Record<string, unknown>;
			const content = body.content as Record<string, unknown>;
			const actions = content.actions as Array<Record<string, unknown>>;
			expect(actions).toBeDefined();
			expect(actions.length).toBe(2);
			expect(actions[0].$type).toBe('Block.Action');
			expect(actions[1].$type).toBe('Block.CancelAction');
		});
	});

	describe('unknown tool', () => {
		it('returns 404 for an unknown tool', async () => {
			const result = await executeSandboxTool('nonexistent-tool', {});
			expect(result.status).toBe(404);
		});
	});

	describe('timing', () => {
		it('has a duration of at least 200ms', async () => {
			const start = Date.now();
			const result = await executeSandboxTool('hello-world', { name: 'Test' });
			const elapsed = Date.now() - start;
			// The simulated delay is 200-500ms, so the real wall time should be >= 200ms
			expect(elapsed).toBeGreaterThanOrEqual(190); // small tolerance
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
	});

	describe('cancellation', () => {
		it('returns "Request cancelled" when aborted', async () => {
			const controller = new AbortController();
			// Abort immediately
			controller.abort();
			const result = await executeSandboxTool('hello-world', { name: 'Test' }, controller.signal);
			expect(result.error).toBe('Request cancelled');
			expect(result.status).toBe(0);
		});
	});
});
