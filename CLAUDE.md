# CLAUDE.md

Instructions for Claude Code when working on this project.

## Critical Rules

1. **Always use `bun`** as the package manager. Never use `yarn` or `npm`, even if other project-level CLAUDE.md files say otherwise. This project uses `bun` exclusively.
2. **100% Client-Side Rendering (CSR) only.** This is a fully static SPA. Never introduce server-side rendering, server routes, server-side `load` functions, `+page.server.ts`, `+server.ts`, or any SSR logic. All code runs in the browser. `+layout.ts` enforces `ssr = false` and `prerender = false`.
3. **Every new feature must have tests.** When implementing a new feature, utility, or store, write accompanying unit tests in a co-located `.test.ts` file. Features without tests are incomplete. Run `bun run test` to verify before considering work done.

## Project Overview

OTD (Opal Tools Debugger) is an NPX-executable, fully client-side SvelteKit app for testing Opal tools locally. Users connect to a discovery endpoint, browse available tools, fill in parameters, and execute them — all from the browser.

## Package Manager

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Build static SPA
bun run test         # Run all tests
bun run check        # Type-check the project
```

## Tech Stack

- **SvelteKit** with `@sveltejs/adapter-static` — builds to a fully static SPA with `fallback: 'index.html'` for client-side routing. No server-side code whatsoever.
- **Svelte 5** — uses runes (`$state`, `$derived`, `$effect`), NOT legacy stores or `let` bindings
- **Tailwind CSS 4** — utility-first, configured via `@tailwindcss/vite` plugin, class-based dark mode via `@custom-variant dark`
- **Commander** — CLI argument parsing in `bin/cli.js`
- **idb** — IndexedDB wrapper for parameter presets
- **Vitest** — unit testing framework (all tests run in server environment with mocked browser APIs)
- **TypeScript** throughout

## Architecture

**This app is 100% client-side.** There are no server routes, no SSR, no `+page.server.ts` files, no `+server.ts` endpoints. SvelteKit is used purely as a build tool and client-side router. The `+layout.ts` file sets `ssr = false` and `prerender = false` to enforce full SPA mode. All data fetching, state management, and rendering happens in the browser.

### State Management

All client state uses Svelte 5 `$state()` runes with localStorage persistence:

- `connection.svelte.ts` — current connection (URL, token, connected flag)
- `history.svelte.ts` — recent connections (max 10, deduped by URL)
- `tools.svelte.ts` — discovered tools list
- `theme.svelte.ts` — dark/light mode preference
- `ui.svelte.ts` — UI state (selected tool, sidebar, search, execution results per tool)
- `presets.svelte.ts` — parameter presets per tool (persisted to IndexedDB, not localStorage)
- `activity-log.svelte.ts` — activity log entries, panel state, filtering, search
- `favorites.svelte.ts` — pinned/favorite tools per discovery URL (localStorage)
- `environments.svelte.ts` — named environments with key-value vars (localStorage)

Pattern for localStorage stores:
1. `loadFromStorage()` reads from localStorage (with `browser` guard)
2. `$state(initial)` initializes reactive state
3. Mutation functions update state and call `saveToStorage()`

Pattern for the presets store (IndexedDB):
1. `$state(initial)` initializes reactive state
2. `loadPresets(discoveryUrl, toolName)` async-fetches from IndexedDB → updates `$state`
3. Mutation functions (`addPreset`, `removePreset`, `overwritePreset`) do optimistic `$state` updates + async IndexedDB writes

### Dark/Light Theme

Theme is managed in `theme.svelte.ts`. Uses Tailwind CSS 4's class-based dark mode:
- `layout.css` declares `@custom-variant dark (&:where(.dark, .dark *));`
- `initTheme()` reads localStorage, falls back to `prefers-color-scheme`, applies `.dark` class on `<html>`
- `toggleTheme()` switches mode, persists to localStorage, updates `<html>` class
- All components use `dark:` variant classes alongside light-mode defaults

### Client-Side Fetching

Discovery and tool execution happen client-side via the browser's `fetch()` API directly. CORS is assumed open on the target endpoints. Never proxy requests through SvelteKit server routes — all network calls originate from the browser.

### CLI → UI Flow

`bin/cli.js` starts a static file server → opens `http://localhost:{port}?d={url}&t={token}` → client reads URL query params on mount → pre-fills the connection form. No server-side code involved.

### Connection Switcher

The header dropdown allows switching between discovery endpoints without disconnecting:
- Shows other connections from history (excluding current)
- Clicking an entry fetches discovery, connects, refreshes tools, clears selected tool — all in place
- If not on `/tools`, navigates there after switching
- Disconnect is at the bottom of the dropdown

### Parameter Presets (IndexedDB)

Tool parameter presets are stored in IndexedDB (`opal-debugger` database, `presets` object store) via the `idb` library:
- Presets are scoped by `[discoveryUrl, toolName]` (compound index) so different endpoints have separate presets
- `src/lib/db/presets.ts` — plain `.ts` data access layer (no runes): `getPresetsForTool()`, `savePreset()`, `deletePreset()`, `updatePreset()`
- `src/lib/stores/presets.svelte.ts` — reactive `$state()` store with optimistic updates + async IndexedDB writes
- `src/lib/utils/preset-merge.ts` — merges saved preset values with the current tool schema (handles type coercion, new params, removed params)
- `src/lib/components/PresetBar.svelte` — compact toolbar with dropdown, Save (inline name input), Update, Delete buttons
- `ToolForm.svelte` accepts `initialValues` and `onvalueschange` props to support preset loading and value tracking
- `ToolDetailPanel.svelte` orchestrates preset loading, saving, and form population

### Activity Log

- Stores log entries with level (info/success/warning/error), category (connection/discovery/execution/app), message, details, and optional toolName
- Panel with drag-to-resize, auto-scroll, filtering by level/category, text search, export as JSON
- Error count badge on toggle button when panel is closed
- Log entries with toolName render as clickable badges for tool navigation

### HTTP Method Support

- `executor.ts` respects `OpalFunction.http_method` (GET/DELETE → query string, POST/PUT/PATCH → JSON body)
- Execution results store requestParams, requestUrl, requestMethod, requestHeaders

### cURL Export

- `curl-export.ts` generates cURL commands from execution results
- Available in ResponseViewer status bar and ActivityLogEntry

### Keyboard Shortcuts

| Key | Action | Scope |
|-----|--------|-------|
| `Cmd/Ctrl+Enter` | Execute current tool | Tools page |
| `Cmd/Ctrl+K` | Focus sidebar search | Tools page |
| `Escape` | Close activity log / sidebar | Global |
| `Cmd/Ctrl+Shift+L` | Toggle activity log | Global |

### Request Timeout + Cancellation

- 30s timeout via AbortController in ToolDetailPanel
- Cancel button replaces Execute during loading

### Custom Request Headers

- `HeadersEditor.svelte` — collapsible key-value pair editor
- Headers merged with defaults in executor, saved with presets

### Preset Export/Import

- `preset-io.ts` — export as JSON download, import from file with deduplication
- Format: `{ version: 1, tool: string, presets: Array<{ name, values, headers? }> }`

### Response Diff

- `json-diff.ts` — recursive diff engine returning added/removed/changed entries
- `ResponseDiff.svelte` — color-coded diff view when ≥2 results exist

### Bulk Execution

- `BulkExecutor.svelte` — modal for selecting presets and running sequentially

### Environment Variables / Templating

- `environments.svelte.ts` — named sets of key-value pairs
- `template.ts` — resolves `{{varName}}` tokens in parameter values before execution
- Environment selector in header

### Connection Health Indicator

- Periodic HEAD request every 60s to discovery URL
- Green/amber/red dot in header connection button
- State changes logged to activity log

### Favorites / Pinned Tools

- `favorites.svelte.ts` — Set of tool names per discovery URL (localStorage)
- Star icon on tool list items, pinned section at top of sidebar

## Key Files

| Path | Purpose |
|------|---------|
| `bin/cli.js` | CLI entry point, serves static files, opens URL with query params |
| `src/lib/types.ts` | Shared TypeScript interfaces |
| `src/lib/api/discovery.ts` | Fetch and validate discovery endpoint |
| `src/lib/api/executor.ts` | Execute tool with params, measure timing |
| `src/lib/stores/connection.svelte.ts` | Connection state + persistence |
| `src/lib/stores/history.svelte.ts` | Connection history + persistence |
| `src/lib/stores/theme.svelte.ts` | Dark/light theme state + DOM sync |
| `src/lib/stores/tools.svelte.ts` | Tools state (no persistence) |
| `src/lib/stores/ui.svelte.ts` | UI state (selection, sidebar, execution results) |
| `src/lib/stores/activity-log.svelte.ts` | Activity log entries + panel state |
| `src/lib/stores/favorites.svelte.ts` | Pinned tools per discovery URL |
| `src/lib/stores/environments.svelte.ts` | Named environments with variables |
| `src/lib/utils/http-status.ts` | HTTP status code labels and colors |
| `src/lib/utils/curl-export.ts` | Generate cURL commands from results |
| `src/lib/utils/json-diff.ts` | Recursive JSON diff engine |
| `src/lib/utils/preset-io.ts` | Preset export/import (JSON file) |
| `src/lib/utils/template.ts` | Template variable resolution |
| `src/lib/components/Header.svelte` | App header with connection switcher, theme toggle, environment selector + health indicator |
| `src/lib/components/ConnectionForm.svelte` | Connection form + history UI |
| `src/lib/components/ToolSidebar.svelte` | Sidebar with search + tool list |
| `src/lib/components/ToolListItem.svelte` | Single tool item in sidebar |
| `src/lib/components/ToolDetailPanel.svelte` | Tool detail — form + response |
| `src/lib/components/ToolForm.svelte` | Parameter form for tool execution |
| `src/lib/components/ResponseViewer.svelte` | Response display (status, headers, body, timing) |
| `src/lib/components/JsonViewer.svelte` | Collapsible syntax-highlighted JSON tree |
| `src/lib/components/HeadersEditor.svelte` | Custom request headers editor |
| `src/lib/components/ResponseDiff.svelte` | Response comparison view |
| `src/lib/components/BulkExecutor.svelte` | Bulk preset execution modal |
| `src/lib/components/ActivityLogPanel.svelte` | Activity log panel with toolbar |
| `src/lib/components/ActivityLogEntry.svelte` | Single log entry with actions |
| `src/lib/components/ActivityLogToggle.svelte` | Toggle button with error badge |
| `src/routes/+layout.svelte` | App layout with header + theme init |
| `src/routes/+layout.ts` | SPA config (ssr=false, prerender=false) |
| `src/routes/+page.svelte` | Home page (connect), reads URL query params |
| `src/routes/tools/+page.svelte` | Tools page — sidebar + detail panel |
| `netlify.toml` | Netlify build config with SPA redirect |

## Svelte 5 Gotchas

- Use `$state('')` + `$effect()` for props that update, not `$state(propValue)` (warns about capturing initial value)
- Stores export plain `$state()` objects, not Svelte 4 stores — import and use directly
- `.svelte.ts` extension is required for files that use runes outside components

## Testing

Tests are a required part of every feature. A feature is not complete without tests.

```bash
bun run test          # Run all tests (single run)
bun run test:unit     # Run unit tests in watch mode
bun run check         # Type-check the project (zero errors/warnings expected)
```

**Testing conventions:**
- Test files are co-located next to the module they test (e.g., `executor.ts` → `executor.test.ts`)
- Tests run in Vitest's `server` environment — browser globals like `fetch`, `document`, `localStorage` must be mocked via `vi.stubGlobal()`
- Svelte rune-based stores (`.svelte.ts` files) need `vi.mock('$app/environment', ...)` to stub the `browser` check
- After implementing a feature, always run `bun run check` (zero errors/warnings) and `bun run test` (all pass) before finishing

## Common Tasks

- **Add a new store**: Create `src/lib/stores/name.svelte.ts`, follow the `loadFromStorage`/`$state`/`saveToStorage` pattern. Write a matching `.test.ts` file.
- **Add a new utility**: Create in `src/lib/utils/`, export pure functions. Write a matching `.test.ts` file.
- **Add a new component**: Create in `src/lib/components/`, use Svelte 5 runes syntax with `dark:` variants for all color classes. No SSR — use `onMount` for browser-only init.
- **Add a new route**: Create under `src/routes/`. Never create `+page.server.ts` or `+server.ts` files. Use `onMount` for client-side init with connection guards.
