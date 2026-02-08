#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
	.name('opal-tools-debugger')
	.description('Local debugger for Opal tools — test and execute tools without deploying')
	.version('0.0.1')
	.option('-d, --discovery-url <url>', 'Opal tools discovery endpoint URL')
	.option('-t, --bearer-token <token>', 'Bearer token for authentication')
	.option('-p, --port <number>', 'Port to run the server on', '4873')
	.parse();

const opts = program.opts();

if (opts.discoveryUrl) {
	process.env.OPAL_DISCOVERY_URL = opts.discoveryUrl;
}
if (opts.bearerToken) {
	process.env.OPAL_BEARER_TOKEN = opts.bearerToken;
}
process.env.PORT = opts.port;

console.log('');
console.log(`  Opal Tools Debugger v0.0.1`);
console.log(`  Running at: http://localhost:${opts.port}`);
console.log('');
if (opts.discoveryUrl) {
	console.log(`  Discovery URL: ${opts.discoveryUrl}`);
} else {
	console.log(`  Discovery URL: (not set — enter in UI)`);
}
console.log(`  Bearer Token: ${opts.bearerToken ? '(set)' : '(not set)'}`);
console.log('');
console.log('  Press Ctrl+C to stop');
console.log('');

await import(join(__dirname, '..', 'build', 'index.js'));
