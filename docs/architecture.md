# Architecture

## Overview

Opal Tools Debugger (OTD) is a fully client-side SvelteKit application built with `@sveltejs/adapter-static` that runs as an NPX-executable local tool. It connects to Opal discovery endpoints, lists available tools, and lets users execute them with a form-based UI. There is no server-side code -- the CLI simply serves pre-built static files and opens the browser.

## System Diagram

```
┌─────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│   CLI        │────>│   Static File Server      │────>│   Browser Client         │
│  bin/cli.js  │     │   (Node http module)      │     │   (Svelte 5 SPA)         │
│              │     │                            │     │                          │
│  Parses args │     │  Serves build output from  │     │  Reads ?d=...&t=... from │
│  Opens URL:  │     │  adapter-static            │     │  URL query params        │
│  ?d=url&t=   │     │  (no SvelteKit server)     │     │  All fetches client-side  │
└─────────────┘     └──────────────────────────┘     └──────┬──────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────────┐
                                                    │  Opal Tool Endpoints │
                                                    │  /discovery          │
                                                    │  /tool-endpoint-1    │
                                                    │  /tool-endpoint-2    │
                                                    └─────────────────────┘
```

## Key Design Decisions

### Fully Static Architecture

The app is built with `@sveltejs/adapter-static` producing a fully static SPA with `fallback: 'index.html'` for client-side routing. The CLI (`bin/cli.js`) starts a plain Node `http` module file server pointing at the build output directory. It opens a browser to `http://localhost:{port}?d={url}&t={token}`, and the client reads those URL query params on mount to pre-fill the connection form. There is no SvelteKit server, no `/api/` routes, and no `process.env` relay -- everything happens in the browser.

### Client-Side Fetching

All requests to Opal endpoints happen from the browser, not a server. This avoids CORS proxy complexity and keeps the architecture stateless. The trade-off is that the target endpoints must have CORS open for the debugger's origin.

### localStorage for State

Connection info, connection history, theme preference, execution history, favorites, environments, and activity log preferences are stored in localStorage. This means:
- No database or server-side persistence needed
- State survives page refreshes but is per-browser
- The server is completely stateless (just serves static files)

**Exception:** Parameter presets use IndexedDB instead of localStorage (see below).

### Parameter Presets (IndexedDB)

Tool parameter presets are stored in IndexedDB rather than localStorage for several reasons:
- **Structured data** -- presets contain nested objects (values map, headers map) that benefit from IndexedDB's native object storage vs. JSON serialization
- **Compound indexes** -- presets are scoped by `[discoveryUrl, toolName]` using a compound index, enabling efficient lookups without scanning all records
- **Growth potential** -- localStorage has a ~5MB limit; IndexedDB can store significantly more data as presets accumulate across many tools and endpoints

The database (`opal-debugger`, version 1) has a single `presets` object store with:
- `id` as the key path (crypto.randomUUID)
- `by-tool` compound index on `[discoveryUrl, toolName]`

The reactive store (`presets.svelte.ts`) uses optimistic updates: `$state` is updated immediately on save/delete/update, and the async IndexedDB write happens in the background. This keeps the UI responsive while ensuring durability.

### Svelte 5 Runes

All state management uses Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of Svelte 4 stores. Store files use the `.svelte.ts` extension to enable rune syntax outside components.

### Dark/Light Theme

The theme system uses Tailwind CSS 4's class-based dark mode strategy:
- `layout.css` declares `@custom-variant dark (&:where(.dark, .dark *));` to enable the `dark:` variant
- `theme.svelte.ts` manages state: reads from localStorage on init, falls back to OS `prefers-color-scheme`, and toggles the `.dark` class on `<html>`
- All components use paired classes (e.g., `bg-white dark:bg-zinc-900`, `text-zinc-700 dark:text-zinc-300`)
- localStorage key: `opal-debugger-theme`, values: `'light'` or `'dark'`

### Connection Switcher

The header connection indicator is a dropdown that enables seamless endpoint switching:
- Shows all connections from history except the current one
- Clicking an entry performs the full connection flow (fetch discovery -> connect -> refresh tools -> clear selected tool) without leaving the tools page
- During a switch, the status indicator pulses amber to show loading
- If the switch fails, the user stays on the current connection
- Disconnect is available at the bottom of the dropdown

### HTTP Method Dispatch

The executor (`executor.ts`) dispatches requests based on `OpalFunction.http_method`. The method is normalized to uppercase before dispatch:
- **GET / DELETE** -- parameters are encoded as URL query string parameters
- **POST / PUT / PATCH** -- parameters are sent as a JSON request body

This ensures each tool is called with the correct HTTP semantics as declared in its discovery metadata.

### Activity Log

A global logging system for tracking all operations across the application. Each log entry has:
- **level** -- `info`, `success`, `warning`, or `error`
- **category** -- `connection`, `discovery`, `execution`, or `app`
- **message** -- human-readable description
- **details** -- optional structured data (request/response objects, error details)
- **toolName** -- optional tool reference for navigation from log entries

Features:
- Resizable panel (drag-to-resize handle, min 100px / max 600px, height persisted to localStorage)
- Auto-scroll to newest entries (toggleable)
- Filtering by level and/or category
- Text search across messages
- Export filtered entries as JSON download
- Error-level entries are highlighted with a red left border
- The toggle button shows an error count badge (red) when errors exist, or total entry count (indigo) otherwise
- Entries with a `toolName` render as clickable badges for quick tool navigation

### Request Lifecycle

1. `ToolDetailPanel` creates an `AbortController` with a 30-second timeout. A Cancel button replaces the Execute button during loading.
2. Environment variables resolve `{{varName}}` tokens in parameter values using the currently selected environment.
3. The executor builds the request: method-aware URL construction (query string for GET/DELETE, JSON body for POST/PUT/PATCH), header merging (default headers + custom headers from the headers editor).
4. Request metadata (params, URL, method, headers) is stored in `ToolExecutionResult` for later inspection and cURL export.
5. The result is prepended to the execution history (max 10 per tool) and logged to the activity log with the tool name for navigation.

### cURL Export

The utility (`curl-export.ts`) generates cURL commands from execution results. It reconstructs the full command including method, URL, headers, and request body with proper single-quote escaping. The copy-to-clipboard button is available in:
- `ResponseViewer` status bar
- `ActivityLogEntry` context actions

### Response Diff

A recursive JSON diff engine (`json-diff.ts`) compares two execution results and produces a list of path-level changes:
- **Added** paths (green) -- present in the new result but not the old
- **Removed** paths (red) -- present in the old result but not the new
- **Changed** paths (amber) -- present in both but with different values

The `ResponseDiff.svelte` component renders a color-coded diff view. It is accessible via a Compare toggle when two or more execution results exist for the current tool.

### Preset Export/Import

Presets can be exported as versioned JSON files and imported with duplicate detection:
- **Export** -- `preset-io.ts` generates a JSON download with format `{ version: 1, tool: string, presets: Array<{ name, values, headers? }> }`
- **Import** -- reads a JSON file, validates the format, and performs case-insensitive name matching to detect duplicates before inserting into IndexedDB
- Custom headers are included in the export/import format

### Environment Variables

Named environments with key-value pairs provide templating support:
- `environments.svelte.ts` stores an array of named environments, each with a set of key-value pairs, plus the currently selected environment name
- `template.ts` resolves `{{varName}}` tokens in string parameter values before execution by looking up the variable in the selected environment
- The environment selector dropdown appears in the header when environments are configured
- Environments are persisted to localStorage under `opal-debugger-environments`

### Connection Health

Periodic HEAD requests every 60 seconds assess the current discovery endpoint's health:
- **Green dot** -- healthy (response received within 2 seconds)
- **Amber dot** -- slow (response received but took longer than 2 seconds)
- **Red dot** -- unreachable (request failed or timed out)

State changes are logged to the activity log with the `connection` category.

### Favorites

Tools can be pinned per discovery URL for quick access:
- A star icon on each `ToolListItem` toggles the favorite state
- Pinned tools appear in a separate "Pinned" section at the top of the sidebar, above the full tool list
- State is persisted to localStorage under `opal-debugger-favorites` as a set of tool names keyed by discovery URL

### Bulk Execution

The `BulkExecutor.svelte` modal allows selecting multiple presets for a tool and running them sequentially. Results are collected and displayed after all executions complete.

### Custom Request Headers

The `HeadersEditor.svelte` component provides a collapsible key-value pair editor for adding custom HTTP headers to tool requests. Custom headers are:
- Merged with default headers (Authorization, Content-Type) in the executor
- Saved alongside preset values when a preset is saved or updated

### Keyboard Shortcuts

| Key | Action | Scope |
|-----|--------|-------|
| `Cmd/Ctrl+Enter` | Execute current tool | Tools page |
| `Cmd/Ctrl+K` | Focus sidebar search | Tools page |
| `Escape` | Close activity log / sidebar | Global |
| `Cmd/Ctrl+Shift+L` | Toggle activity log | Global |

## Data Flow

### Connection Flow

1. User enters discovery URL (+ optional bearer token) or clicks a history entry
2. Client fetches the discovery endpoint directly
3. Discovery response is validated (must contain `functions` array)
4. Connection state is saved to localStorage
5. Connection is added to history (deduped by URL, max 10 entries)
6. Tools are set in the tools store
7. User is navigated to `/tools`
8. Connection is logged to the activity log

### Connection Switch Flow (from header)

1. User clicks the connection indicator in the header to open the dropdown
2. User clicks a different connection from the history list
3. Discovery is fetched for the new endpoint
4. Connection state is updated, tools are refreshed, selected tool is cleared
5. User stays on the tools page with the new endpoint's tools loaded
6. If not on `/tools`, user is navigated there

### Tool Execution Flow

1. User fills in parameters via the auto-generated form
2. An `AbortController` is created with a 30-second timeout; the Cancel button appears
3. Environment variables resolve any `{{varName}}` tokens in parameter values
4. The executor dispatches the request based on `http_method`:
   - **GET / DELETE** -- parameters are encoded as URL query string on `{baseUrl}{tool.endpoint}`
   - **POST / PUT / PATCH** -- parameters are sent as JSON body to `{baseUrl}{tool.endpoint}`
5. Custom headers from the headers editor are merged with defaults (Authorization, Content-Type)
6. Response status, headers, body, timing, and request metadata (params, URL, method, headers) are captured in `ToolExecutionResult`
7. Result is prepended to the execution history (max 10 per tool)
8. Execution history is persisted to localStorage per tool name
9. Result is logged to the activity log with tool name for navigation

### Preset Flow

1. User selects a tool -> `ToolDetailPanel` calls `loadPresets(discoveryUrl, toolName)` to fetch presets from IndexedDB
2. `PresetBar` displays a dropdown of available presets for this tool
3. User picks a preset -> `mergePresetWithParameters()` coerces saved values to match the current tool schema (handles added/removed params, type changes)
4. Merged values are passed to `ToolForm` via `initialValues` prop -> form fields are populated
5. Custom headers from the preset are loaded into the `HeadersEditor`
6. User can modify values and either:
   - **Save** -- enters a name, creates a new preset in IndexedDB (includes current custom headers)
   - **Update** -- overwrites the currently selected preset's values and headers
   - **Delete** -- removes the selected preset from IndexedDB
   - **Export** -- downloads presets as a versioned JSON file
   - **Import** -- uploads a JSON file with duplicate detection
7. All mutations use optimistic `$state` updates + async IndexedDB writes

### Page Refresh Recovery

When a user refreshes any page:
- Connection state is loaded from localStorage
- Theme preference is loaded from localStorage (or falls back to OS preference)
- Activity log panel preferences are loaded from localStorage
- Favorites and environments are loaded from localStorage
- If on `/tools` and connected, discovery is re-fetched to rebuild the tools list
- If not connected, the user is redirected to `/`
- Execution history for tool pages is loaded from localStorage

## Stores

| Store | Key | Persisted | Content |
|-------|-----|-----------|---------|
| `connection.svelte.ts` | `opal-debugger-connection` | Yes | URL, token, baseUrl, connected flag |
| `history.svelte.ts` | `opal-debugger-history` | Yes | Array of {discoveryUrl, bearerToken, connectedAt} |
| `theme.svelte.ts` | `opal-debugger-theme` | Yes | `'light'` or `'dark'` |
| `tools.svelte.ts` | -- | No | Array of OpalFunction objects |
| `ui.svelte.ts` | `opal-debugger-history-{toolName}` | Yes (per tool) | Selected tool, sidebar state, execution results |
| `presets.svelte.ts` | IndexedDB `opal-debugger.presets` | Yes | Parameter presets per tool, scoped by discoveryUrl + toolName |
| `activity-log.svelte.ts` | `opal-debugger-activity-log` | Yes (prefs only) | Log entries (in-memory), panel state, filters, search |
| `favorites.svelte.ts` | `opal-debugger-favorites` | Yes | Pinned tool names per discovery URL |
| `environments.svelte.ts` | `opal-debugger-environments` | Yes | Named environments with key-value vars |

## Types

```typescript
interface OpalParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

interface OpalFunction {
  name: string;
  description: string;
  endpoint: string;
  http_method: string;
  parameters: OpalParameter[];
}

interface DiscoveryResponse {
  functions: OpalFunction[];
}

interface ToolExecutionResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  requestSize?: number;
  error?: string;
  requestParams?: Record<string, unknown>;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string>;
}

interface ToolPreset {
  id: string;
  toolName: string;
  discoveryUrl: string;
  presetName: string;
  values: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

type LogLevel = 'info' | 'success' | 'warning' | 'error';
type LogCategory = 'connection' | 'discovery' | 'execution' | 'app';

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: unknown;
  toolName?: string;
}
```

## UI Layout

### Home Page (`/`)

Centered connection form with:
- Discovery URL input (required)
- Bearer token input (optional, with show/hide toggle)
- Connect button
- Recent connections list (from history store)

### Tools Page (`/tools`)

Two-panel layout with an optional bottom panel:
- **Left sidebar** -- Search input + scrollable tool list. Pinned/favorited tools appear in a separate "Pinned" section at the top. Each item shows HTTP method badge, tool name, endpoint path, and a star icon to toggle favorites.
- **Right detail panel** -- Tool header (method, name, description, endpoint), preset bar (dropdown + save/update/delete/export/import), headers editor (collapsible key-value pairs), parameter form, and response viewer side by side on large screens. When two or more results exist, a Compare toggle shows the response diff view.
- **Bottom activity log panel** -- Resizable panel showing log entries with level/category filters, text search, auto-scroll, and JSON export. Toggle button in the footer with error/total count badge.
- **Mobile** -- Sidebar is an overlay toggled via a hamburger button in the detail panel.

### Header

Present on all pages:
- Logo + app name (links to home)
- Environment selector dropdown (when environments are configured)
- Connection switcher dropdown (when connected) -- shows current endpoint with health indicator (green/amber/red dot), lists other history entries for quick switching, disconnect at bottom
- Theme toggle button (sun/moon icon)
- Activity log toggle button with count badge

## Key Files

| Path | Purpose |
|------|---------|
| `bin/cli.js` | CLI entry point, serves static files via Node http, opens URL with query params |
| `src/lib/types.ts` | Shared TypeScript interfaces (OpalFunction, ToolExecutionResult, LogEntry, etc.) |
| `src/lib/api/discovery.ts` | Fetch and validate discovery endpoint |
| `src/lib/api/executor.ts` | Execute tool with params (method-aware dispatch), measure timing |
| `src/lib/stores/connection.svelte.ts` | Connection state + persistence |
| `src/lib/stores/history.svelte.ts` | Connection history + persistence |
| `src/lib/stores/theme.svelte.ts` | Dark/light theme state + DOM sync |
| `src/lib/stores/tools.svelte.ts` | Tools state (no persistence) |
| `src/lib/stores/ui.svelte.ts` | UI state (selection, sidebar, execution results) |
| `src/lib/stores/presets.svelte.ts` | Parameter presets (IndexedDB) |
| `src/lib/stores/activity-log.svelte.ts` | Activity log entries + panel state + filters |
| `src/lib/stores/favorites.svelte.ts` | Pinned tools per discovery URL |
| `src/lib/stores/environments.svelte.ts` | Named environments with variables |
| `src/lib/db/presets.ts` | IndexedDB data access layer for presets |
| `src/lib/utils/http-status.ts` | HTTP status code labels and colors |
| `src/lib/utils/curl-export.ts` | Generate cURL commands from execution results |
| `src/lib/utils/json-diff.ts` | Recursive JSON diff engine |
| `src/lib/utils/preset-io.ts` | Preset export/import with duplicate detection |
| `src/lib/utils/preset-merge.ts` | Merge preset values with current tool schema |
| `src/lib/utils/template.ts` | Resolve `{{varName}}` environment variable tokens |
| `src/lib/components/Header.svelte` | App header with connection switcher, environment selector, theme toggle |
| `src/lib/components/ConnectionForm.svelte` | Connection form + history UI |
| `src/lib/components/ToolSidebar.svelte` | Sidebar with search, favorites section, + tool list |
| `src/lib/components/ToolListItem.svelte` | Single tool item in sidebar with favorite star |
| `src/lib/components/ToolDetailPanel.svelte` | Tool detail -- form + response + abort handling |
| `src/lib/components/ToolForm.svelte` | Parameter form for tool execution |
| `src/lib/components/HeadersEditor.svelte` | Collapsible key-value editor for custom request headers |
| `src/lib/components/PresetBar.svelte` | Preset dropdown + save/update/delete/export/import |
| `src/lib/components/ResponseViewer.svelte` | Response display (status, headers, body, timing, cURL export) |
| `src/lib/components/ResponseDiff.svelte` | Color-coded diff view for comparing execution results |
| `src/lib/components/JsonViewer.svelte` | Collapsible syntax-highlighted JSON tree |
| `src/lib/components/ActivityLogPanel.svelte` | Resizable activity log panel with filters and search |
| `src/lib/components/ActivityLogEntry.svelte` | Single log entry with level indicator and cURL export |
| `src/lib/components/ActivityLogToggle.svelte` | Toggle button with error/total count badge |
| `src/lib/components/BulkExecutor.svelte` | Modal for selecting presets and running sequentially |
| `src/routes/+layout.svelte` | App layout with header + theme init |
| `src/routes/+layout.ts` | SPA config (ssr=false, prerender=false) |
| `src/routes/+page.svelte` | Home page (connect), reads URL query params |
| `src/routes/tools/+page.svelte` | Tools page -- sidebar + detail panel + activity log |
| `netlify.toml` | Netlify build config with SPA redirect |

## Svelte 5 Gotchas

- Use `$state('')` + `$effect()` for props that update, not `$state(propValue)` (warns about capturing initial value)
- Stores export plain `$state()` objects, not Svelte 4 stores -- import and use directly
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
