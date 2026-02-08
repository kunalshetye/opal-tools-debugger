# OTD (Opal Tools Debugger)

A local debugger for [Opal tools](https://opal.dev) — test and execute tools from your browser without deploying.

## Quick Start

```bash
npx @kunalshetye/otd
```

Or install globally:

```bash
npm i -g @kunalshetye/otd
otd -d http://localhost:3000/discovery
```

The debugger opens at `http://localhost:4873`. Enter your discovery endpoint URL in the UI and start testing.

### CLI Options

```bash
npx @kunalshetye/otd \
  --discovery-url https://your-opal-tools.example.com/discovery \
  --bearer-token YOUR_TOKEN \
  --port 4873
```

| Flag                         | Description                               | Default |
| ---------------------------- | ----------------------------------------- | ------- |
| `-d, --discovery-url <url>`  | Discovery endpoint URL (pre-fills the UI) | —       |
| `-t, --bearer-token <token>` | Bearer token for authentication           | —       |
| `-p, --port <number>`        | Port for the debugger server              | `4873`  |

## Features

### Core

- **Discovery** — Connects to your Opal discovery endpoint and lists all available tools with their parameters, HTTP methods, and endpoints.
- **HTTP Method Support** — Executor respects `http_method` from discovery. GET/DELETE use query params; POST/PUT/PATCH use JSON body.
- **Tool Execution** — Fill in parameters via auto-generated forms and execute tools directly. Responses show status, headers, body, and timing.
- **Request Metadata** — Execution results store `requestParams`, `requestUrl`, `requestMethod`, and `requestHeaders` for full request introspection.
- **Request Timeout + Cancel** — 30-second timeout with AbortController. A cancel button is shown during execution.
- **Custom Request Headers** — Collapsible key-value editor below parameters. Custom headers merge with defaults and are saved with presets.
- **Bulk Execution** — Select multiple presets and run them sequentially. Shows results per preset.

### Presets & Environments

- **Parameter Presets** — Save named parameter presets per tool, scoped by discovery endpoint. Load a preset to pre-fill the form, update it with new values, or delete it. Stored in IndexedDB for structured, high-capacity browser storage.
- **Preset Export/Import** — Export presets as JSON, import from file. Deduplicates by name on import.
- **Environment Variables / Templating** — Named environments with key-value variables. Use `{{varName}}` in parameters; values are resolved before execution. Environment selector in the header.

### Response & Comparison

- **Execution History** — Each tool keeps the last 10 execution results in localStorage so you can compare responses across runs.
- **Response Diff** — Compare toggle when 2+ results exist. Side-by-side diff with color-coded added/removed/changed lines.
- **Quick Replay** — Replay button in the response status bar re-executes with the same parameters.
- **cURL Export** — Copy any request as a cURL command from the response status bar or activity log entries.
- **JSON Viewer** — Collapsible, syntax-highlighted JSON tree for response bodies.

### Activity Log

- **Activity Log** — Collapsible panel that records all tool executions, connections, and errors in a timestamped log.
- **Activity Log Search** — Text search in the activity log toolbar filters entries by message content.
- **Activity Log Export + Entry Navigation** — Export filtered log as JSON. Tool names in log entries are clickable, navigating to that tool.
- **Activity Log Error Badge** — Red badge with error count when the panel is closed. Error entries get a red left border and tint.

### Navigation & UI

- **Connection History** — Recent connections are saved locally. One-click reconnect to any previous endpoint without retyping URLs and tokens.
- **Connection Switcher** — Switch between discovery endpoints directly from the header dropdown without disconnecting first. The dropdown lists all connections from history and performs a seamless switch in place.
- **Connection Health Indicator** — Periodic HEAD request every 60 seconds. Green/amber/red dot in the header. State changes are logged.
- **Favorites / Pinned Tools** — Star icon on tool list items. Pinned tools are shown at the top of the sidebar in a separate section.
- **Dark/Light Theme** — Toggle between dark and light mode via the header button. Defaults to your OS preference and persists across sessions.
- **Search** — Filter tools by name or description in the sidebar.
- **Keyboard Shortcuts** — Cmd/Ctrl+Enter executes, Cmd/Ctrl+K focuses search, Escape closes panels, and more. See the [Keyboard Shortcuts](#keyboard-shortcuts) table below.
- **CLI Pre-fill** — Pass `--discovery-url` and `--bearer-token` via CLI to skip manual entry.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + Enter` | Execute current tool |
| `Cmd/Ctrl + K` | Focus sidebar search |
| `Escape` | Close open panels |
| `Cmd/Ctrl + Shift + L` | Toggle activity log |

## Integrating Into Your Opal Tools Project

Add a script to your project's `package.json` so your team can launch the debugger with a single command — no global install needed.

> **One-off usage without a script** — you can run the debugger directly without adding it to `package.json`:
>
> ```bash
> npx @kunalshetye/otd                          # npm
> yarn dlx @kunalshetye/otd                     # yarn
> pnpm dlx @kunalshetye/otd                     # pnpm
> bunx @kunalshetye/otd                         # bun
> ```

### Basic — just launch the debugger

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/otd"
	}
}
```

```bash
npm run debugger       # npm
yarn debugger          # yarn
pnpm run debugger      # pnpm
bun run debugger       # bun
```

Opens at `http://localhost:4873`. Enter your discovery URL manually in the UI.

### Pre-filled — point at your local dev server

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery"
	}
}
```

```bash
npm run debugger       # npm
yarn debugger          # yarn
pnpm run debugger      # pnpm
bun run debugger       # bun
```

The discovery URL is pre-filled in the UI on launch — just click Connect.

### With authentication

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery -t $OPAL_TOKEN"
	}
}
```

Reads the token from an environment variable. You can also hardcode a dev token if it's a non-sensitive local environment:

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery -t dev-token-123"
	}
}
```

```bash
npm run debugger       # npm
yarn debugger          # yarn
pnpm run debugger      # pnpm
bun run debugger       # bun
```

### Multiple environments

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery",
		"debugger:staging": "npx @kunalshetye/otd -d https://staging.example.com/discovery -t $STAGING_TOKEN",
		"debugger:prod": "npx @kunalshetye/otd -d https://api.example.com/discovery -t $PROD_TOKEN -p 4874"
	}
}
```

```bash
# npm
npm run debugger           # Local dev
npm run debugger:staging   # Staging environment
npm run debugger:prod      # Production (read-only) on a different port

# yarn
yarn debugger
yarn debugger:staging
yarn debugger:prod

# pnpm
pnpm run debugger
pnpm run debugger:staging
pnpm run debugger:prod

# bun
bun run debugger
bun run debugger:staging
bun run debugger:prod
```

### Custom port — avoid conflicts

```json
{
	"scripts": {
		"dev": "node server.js",
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery -p 9000"
	}
}
```

Runs the debugger on port 9000 so it doesn't clash with your dev server.

### Alongside your dev server (concurrent)

If you use a tool like [concurrently](https://www.npmjs.com/package/concurrently):

```json
{
	"scripts": {
		"dev": "node server.js",
		"debugger": "npx @kunalshetye/otd -d http://localhost:3000/discovery",
		"dev:debug": "concurrently \"npm run dev\" \"npm run debugger\""
	}
}
```

```bash
npm run dev:debug      # npm
yarn dev:debug         # yarn
pnpm run dev:debug     # pnpm
bun run dev:debug      # bun
```

## How It Works

1. The CLI (`bin/cli.js`) starts a lightweight static file server and opens the app with query parameters (`?d=...&t=...`) for pre-filling.
2. The client reads query params on mount and pre-fills the connection form.
3. The client calls your discovery endpoint directly (CORS must be open) and renders the tool list.
4. Tool execution sends requests from the browser to your Opal tool endpoints.

The app is **100% client-side** — built with `adapter-static`, no server-side code. All state (connection, tools, history, theme) lives in the browser's localStorage. Parameter presets use IndexedDB for structured storage.

## Development

```bash
bun install
bun run dev        # Start dev server at http://localhost:5173
bun run build      # Production build
bun run preview    # Preview production build
bun run check      # Type-check
bun run lint       # Lint + format check
bun run test       # Run unit tests
```

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) with adapter-static (fully client-side SPA)
- [Svelte 5](https://svelte.dev/docs/svelte) runes (`$state`, `$derived`, `$effect`)
- [Tailwind CSS 4](https://tailwindcss.com) with class-based dark mode (`@custom-variant dark`)
- [Commander](https://github.com/tj/commander.js) for the CLI
- [idb](https://github.com/jakearchibald/idb) for IndexedDB (parameter presets)
- [Vitest](https://vitest.dev) + Playwright for testing

## Project Structure

```
bin/cli.js                          # CLI entry point (npx executable)
src/
  lib/
    api/
      discovery.ts                  # Fetch discovery endpoint
      executor.ts                   # Execute tool requests (supports all HTTP methods, timeout, cancel)
    components/
      ActivityLogEntry.svelte       # Single entry in the activity log
      ActivityLogPanel.svelte       # Collapsible activity log panel
      ActivityLogToggle.svelte      # Toggle button with error badge for the activity log
      BulkExecutor.svelte           # Multi-preset sequential execution UI
      ConnectionForm.svelte         # URL/token form + connection history
      Header.svelte                 # App header with connection switcher, env selector, health indicator
      HeadersEditor.svelte          # Key-value editor for custom request headers
      JsonViewer.svelte             # Collapsible JSON tree viewer
      PresetBar.svelte              # Preset toolbar (save/load/update/delete/export/import)
      ResponseDiff.svelte           # Side-by-side response comparison with color-coded diff
      ResponseViewer.svelte         # Response display (status, headers, body, timing, cURL export, replay)
      ToolDetailPanel.svelte        # Tool detail — form + response side by side
      ToolForm.svelte               # Parameter form for tool execution
      ToolListItem.svelte           # Single tool item in sidebar list (with favorite star)
      ToolSidebar.svelte            # Sidebar with search + tool list + pinned section
    db/
      presets.ts                    # IndexedDB access layer for presets
    stores/
      activity-log.svelte.ts        # Activity log state (entries, search, error count)
      connection.svelte.ts          # Connection state (URL, token, connected, health)
      environments.svelte.ts        # Named environments with key-value variables
      favorites.svelte.ts           # Pinned/favorite tools state + persistence
      history.svelte.ts             # Connection history (recent endpoints)
      presets.svelte.ts             # Preset state + async IndexedDB persistence
      theme.svelte.ts               # Dark/light theme state + persistence
      tools.svelte.ts               # Tools state (functions list)
      ui.svelte.ts                  # UI state (selection, sidebar, execution results)
    types.ts                        # TypeScript interfaces
    utils/
      curl-export.ts                # Generate cURL commands from request metadata
      http-status.ts                # HTTP status code labels and colors
      json-diff.ts                  # JSON diff algorithm for response comparison
      preset-io.ts                  # Preset export/import (JSON file I/O, deduplication)
      preset-merge.ts               # Merge preset values with tool parameters
      template.ts                   # {{varName}} template resolution with environment variables
  routes/
    +layout.svelte                  # App layout with header + theme init
    +layout.ts                      # SPA config (ssr=false, prerender=false)
    +page.svelte                    # Home — connection form
    layout.css                      # Global styles + Tailwind config
    tools/
      +page.svelte                  # Tools page — sidebar + detail panel
```

## License

MIT
