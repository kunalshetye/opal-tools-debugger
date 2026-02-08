#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { lookup } from 'node:dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
	.name('otd')
	.description('OTD (Opal Tools Debugger) — test and execute tools without deploying')
	.version('0.0.2')
	.option('-d, --discovery-url <url>', 'Opal tools discovery endpoint URL')
	.option('-t, --bearer-token <token>', 'Bearer token for authentication')
	.option('-p, --port <number>', 'Port to run the server on', '4873')
	.parse();

const opts = program.opts();
const port = parseInt(opts.port, 10);
const buildDir = join(__dirname, '..', 'build');

// Build the URL with query params for pre-filling the UI
let appUrl = `http://localhost:${port}`;
const params = new URLSearchParams();
if (opts.discoveryUrl) params.set('d', opts.discoveryUrl);
if (opts.bearerToken) params.set('t', opts.bearerToken);
const qs = params.toString();
if (qs) appUrl += `?${qs}`;

// MIME type map for static file serving
const mimeTypes = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.webp': 'image/webp',
	'.webm': 'video/webm',
	'.mp4': 'video/mp4',
	'.txt': 'text/plain',
	'.xml': 'application/xml',
	'.wasm': 'application/wasm'
};

function getMime(filePath) {
	const ext = filePath.slice(filePath.lastIndexOf('.'));
	return mimeTypes[ext] || 'application/octet-stream';
}

// Static file server
const server = createServer((req, res) => {
	const url = new URL(req.url, `http://localhost:${port}`);
	let filePath = join(buildDir, url.pathname);

	// Try to serve the exact file, or index.html inside a directory
	if (existsSync(filePath) && statSync(filePath).isFile()) {
		res.writeHead(200, { 'Content-Type': getMime(filePath) });
		res.end(readFileSync(filePath));
		return;
	}

	// Try with .html extension
	if (existsSync(filePath + '.html')) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(readFileSync(filePath + '.html'));
		return;
	}

	// Try directory/index.html
	const indexPath = join(filePath, 'index.html');
	if (existsSync(indexPath)) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(readFileSync(indexPath));
		return;
	}

	// SPA fallback — serve index.html for all unmatched routes
	const fallback = join(buildDir, 'index.html');
	if (existsSync(fallback)) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(readFileSync(fallback));
		return;
	}

	res.writeHead(404, { 'Content-Type': 'text/plain' });
	res.end('Not Found');
});

server.listen(port, () => {
	console.log('');
	console.log(`  OTD (Opal Tools Debugger) v0.0.2`);
	console.log(`  Running at: ${appUrl}`);
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
});
