# CLAUDE.md

Instructions for Claude Code when working on this project.

## Project Overview

OTD (Opal Tools Debugger) is an NPX-executable, fully client-side SvelteKit app for testing Opal tools locally. Users connect to a discovery endpoint, browse available tools, fill in parameters, and execute them — all from the browser. No server-side code.

## Package Manager

Use `bun` (not yarn or npm) for this project.

```bash
bun install
bun run dev
bun run build
bun run test
```

## Tech Stack

- **SvelteKit** with `@sveltejs/adapter-static` — builds to a fully static SPA (no server-side code)
- **Svelte 5** — uses runes (`$state`, `$derived`, `$effect`), NOT legacy stores or `let` bindings
- **Tailwind CSS 4** — utility-first, configured via `@tailwindcss/vite` plugin, class-based dark mode via `@custom-variant dark`
- **Commander** — CLI argument parsing in `bin/cli.js`
- **idb** — IndexedDB wrapper for parameter presets
- **TypeScript** throughout

## Architecture

### State Management

All client state uses Svelte 5 `$state()` runes with localStorage persistence:

- `connection.svelte.ts` — current connection (URL, token, connected flag)
- `history.svelte.ts` — recent connections (max 10, deduped by URL)
- `tools.svelte.ts` — discovered tools list
- `theme.svelte.ts` — dark/light mode preference
- `ui.svelte.ts` — UI state (selected tool, sidebar, search, execution results per tool)
- `presets.svelte.ts` — parameter presets per tool (persisted to IndexedDB, not localStorage)

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

Discovery and tool execution happen client-side via `fetch()`. CORS is assumed open on the target endpoints. No SvelteKit server routes proxy these requests.

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
| `src/lib/utils/http-status.ts` | HTTP status code labels and colors |
| `src/lib/components/Header.svelte` | App header with connection switcher + theme toggle |
| `src/lib/components/ConnectionForm.svelte` | Connection form + history UI |
| `src/lib/components/ToolSidebar.svelte` | Sidebar with search + tool list |
| `src/lib/components/ToolListItem.svelte` | Single tool item in sidebar |
| `src/lib/components/ToolDetailPanel.svelte` | Tool detail — form + response |
| `src/lib/components/ToolForm.svelte` | Parameter form for tool execution |
| `src/lib/components/ResponseViewer.svelte` | Response display (status, headers, body, timing) |
| `src/lib/components/JsonViewer.svelte` | Collapsible syntax-highlighted JSON tree |
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

```bash
bun run test          # Run all tests
bun run test:unit     # Run unit tests in watch mode
bun run check         # Type-check the project
```

## Common Tasks

- **Add a new store**: Create `src/lib/stores/name.svelte.ts`, follow the `loadFromStorage`/`$state`/`saveToStorage` pattern
- **Add a new component**: Create in `src/lib/components/`, use Svelte 5 runes syntax with `dark:` variants for all color classes
- **Add a new route**: Create under `src/routes/`, use `onMount` for client-side init with connection guards
