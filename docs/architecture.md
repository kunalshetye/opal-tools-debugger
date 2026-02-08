# Architecture

## Overview

Opal Tools Debugger is a SvelteKit application built with adapter-node that runs as an NPX-executable local server. It connects to Opal discovery endpoints, lists available tools, and lets users execute them with a form-based UI.

## System Diagram

```
┌─────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│   CLI        │────▶│   SvelteKit Server        │────▶│   Browser Client     │
│  bin/cli.js  │     │   (adapter-node)          │     │   (Svelte 5)         │
│              │     │                            │     │                      │
│  Sets env    │     │  /api/config returns       │     │  Fetches discovery   │
│  vars, starts│     │  CLI-provided defaults     │     │  directly (CORS)     │
│  server      │     │                            │     │                      │
└─────────────┘     └──────────────────────────┘     └──────┬──────────────┘
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

### Client-Side Fetching

All requests to Opal endpoints happen from the browser, not the SvelteKit server. This avoids CORS proxy complexity and keeps the server stateless. The trade-off is that the target endpoints must have CORS open for the debugger's origin.

### localStorage for State

Connection info, connection history, theme preference, and execution history are stored in localStorage. This means:
- No database or server-side persistence needed
- State survives page refreshes but is per-browser
- The server is completely stateless (just serves the app)

**Exception:** Parameter presets use IndexedDB instead of localStorage (see below).

### Parameter Presets (IndexedDB)

Tool parameter presets are stored in IndexedDB rather than localStorage for several reasons:
- **Structured data** — presets contain nested objects (values map) that benefit from IndexedDB's native object storage vs. JSON serialization
- **Compound indexes** — presets are scoped by `[discoveryUrl, toolName]` using a compound index, enabling efficient lookups without scanning all records
- **Growth potential** — localStorage has a ~5MB limit; IndexedDB can store significantly more data as presets accumulate across many tools and endpoints

The database (`opal-debugger`, version 1) has a single `presets` object store with:
- `id` as the key path (crypto.randomUUID)
- `by-tool` compound index on `[discoveryUrl, toolName]`

The reactive store (`presets.svelte.ts`) uses optimistic updates: `$state` is updated immediately on save/delete/update, and the async IndexedDB write happens in the background. This keeps the UI responsive while ensuring durability.

### Svelte 5 Runes

All state management uses Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of Svelte 4 stores. Store files use the `.svelte.ts` extension to enable rune syntax outside components.

### CLI → Environment → Config Endpoint

The CLI sets `process.env` variables before importing the built SvelteKit server. The `/api/config` endpoint reads these via `$env/dynamic/private` (not `process.env`, which Vite replaces at build time) and returns them as JSON. The client fetches this on mount to pre-fill the connection form.

### Dark/Light Theme

The theme system uses Tailwind CSS 4's class-based dark mode strategy:
- `layout.css` declares `@custom-variant dark (&:where(.dark, .dark *));` to enable the `dark:` variant
- `theme.svelte.ts` manages state: reads from localStorage on init, falls back to OS `prefers-color-scheme`, and toggles the `.dark` class on `<html>`
- All components use paired classes (e.g., `bg-white dark:bg-zinc-900`, `text-zinc-700 dark:text-zinc-300`)
- localStorage key: `opal-debugger-theme`, values: `'light'` or `'dark'`

### Connection Switcher

The header connection indicator is a dropdown that enables seamless endpoint switching:
- Shows all connections from history except the current one
- Clicking an entry performs the full connection flow (fetch discovery → connect → refresh tools → clear selected tool) without leaving the tools page
- During a switch, the status indicator pulses amber to show loading
- If the switch fails, the user stays on the current connection
- Disconnect is available at the bottom of the dropdown

## Data Flow

### Connection Flow

1. User enters discovery URL (+ optional bearer token) or clicks a history entry
2. Client fetches the discovery endpoint directly
3. Discovery response is validated (must contain `functions` array)
4. Connection state is saved to localStorage
5. Connection is added to history (deduped by URL, max 10 entries)
6. Tools are set in the tools store
7. User is navigated to `/tools`

### Connection Switch Flow (from header)

1. User clicks the connection indicator in the header to open the dropdown
2. User clicks a different connection from the history list
3. Discovery is fetched for the new endpoint
4. Connection state is updated, tools are refreshed, selected tool is cleared
5. User stays on the tools page with the new endpoint's tools loaded
6. If not on `/tools`, user is navigated there

### Tool Execution Flow

1. User fills in parameters via the auto-generated form
2. Client sends a request to `{baseUrl}{tool.endpoint}` with JSON body
3. Response status, headers, body, and timing are captured
4. Result is prepended to the execution history (max 10 per tool)
5. Execution history is persisted to localStorage per tool name

### Preset Flow

1. User selects a tool → `ToolDetailPanel` calls `loadPresets(discoveryUrl, toolName)` to fetch presets from IndexedDB
2. `PresetBar` displays a dropdown of available presets for this tool
3. User picks a preset → `mergePresetWithParameters()` coerces saved values to match the current tool schema (handles added/removed params, type changes)
4. Merged values are passed to `ToolForm` via `initialValues` prop → form fields are populated
5. User can modify values and either:
   - **Save** — enters a name, creates a new preset in IndexedDB
   - **Update** — overwrites the currently selected preset's values
   - **Delete** — removes the selected preset from IndexedDB
6. All mutations use optimistic `$state` updates + async IndexedDB writes

### Page Refresh Recovery

When a user refreshes any page:
- Connection state is loaded from localStorage
- Theme preference is loaded from localStorage (or falls back to OS preference)
- If on `/tools` and connected, discovery is re-fetched to rebuild the tools list
- If not connected, the user is redirected to `/`
- Execution history for tool pages is loaded from localStorage

## Stores

| Store | Key | Persisted | Content |
|-------|-----|-----------|---------|
| `connection.svelte.ts` | `opal-debugger-connection` | Yes | URL, token, baseUrl, connected flag |
| `history.svelte.ts` | `opal-debugger-history` | Yes | Array of {discoveryUrl, bearerToken, connectedAt} |
| `theme.svelte.ts` | `opal-debugger-theme` | Yes | `'light'` or `'dark'` |
| `tools.svelte.ts` | — | No | Array of OpalFunction objects |
| `ui.svelte.ts` | `opal-debugger-history-{toolName}` | Yes (per tool) | Selected tool, sidebar state, execution results |
| `presets.svelte.ts` | IndexedDB `opal-debugger.presets` | Yes | Parameter presets per tool, scoped by discoveryUrl + toolName |

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
}

interface ToolPreset {
  id: string;
  toolName: string;
  discoveryUrl: string;
  presetName: string;
  values: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
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

Two-panel layout:
- **Left sidebar** — Search input + scrollable tool list. Each item shows HTTP method badge, tool name, and endpoint path.
- **Right detail panel** — Tool header (method, name, description, endpoint), preset bar (dropdown + save/update/delete), parameter form, and response viewer side by side on large screens.
- **Mobile** — Sidebar is an overlay toggled via a hamburger button in the detail panel.

### Header

Present on all pages:
- Logo + app name (links to home)
- Connection switcher dropdown (when connected) — shows current endpoint, lists other history entries for quick switching, disconnect at bottom
- Theme toggle button (sun/moon icon)
