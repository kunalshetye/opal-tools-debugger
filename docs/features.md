# Features Guide

Opal Tools Debugger (OTD) is a fully client-side SvelteKit application for testing Opal tools locally. This document covers all major features, starting with the core functionality and then detailing the 16 enhanced capabilities.

---

## Core Features

These are the foundational features that OTD ships with:

- **Discovery** -- Connect to a discovery endpoint to fetch the list of available tools and their parameter schemas.
- **Tool Execution** -- Fill in parameters via an auto-generated form and execute any discovered tool directly from the browser.
- **Parameter Presets** -- Save, load, update, and delete named parameter presets per tool. Presets are persisted in IndexedDB, scoped by discovery URL and tool name.
- **Execution History** -- Each tool retains its recent execution results in memory, displayed in a collapsible list with full response details.
- **Connection History** -- The 10 most recent connections (URL + token) are stored in localStorage and shown on the home page for quick reconnection.
- **Connection Switcher** -- Switch between previously used discovery endpoints from the header dropdown without navigating away from the tools page.
- **Dark / Light Theme** -- Toggle between dark and light modes. Preference is persisted in localStorage and applied via a `.dark` class on the `<html>` element.
- **Search** -- Filter the tool sidebar by name or description using the search input at the top of the sidebar.
- **JSON Viewer** -- Response bodies that are valid JSON are rendered as a collapsible, syntax-highlighted tree.
- **CLI Pre-fill** -- When launched via the CLI (`npx @kunalshetye/otd`), the discovery URL and bearer token are passed as query parameters (`?d=...&t=...`) and pre-filled into the connection form.

---

## HTTP Method Support

The executor respects the `http_method` field from the discovery schema. Each tool declares its HTTP method (GET, POST, PUT, PATCH, DELETE), and the executor adjusts its behavior accordingly:

- **GET / DELETE** -- Parameters are encoded as URL query string parameters. No request body is sent.
- **POST / PUT / PATCH** -- Parameters are serialized as a JSON request body with a `Content-Type: application/json` header.

A color-coded **method badge** is displayed in two places:
- In the **sidebar** next to each tool name (inside `ToolListItem`)
- In the **tool detail header** above the tool description

Method badge colors:
| Method | Color |
|--------|-------|
| GET | Sky blue |
| POST | Emerald green |
| PUT | Amber |
| PATCH | Orange |
| DELETE | Red |

**Relevant files:**
- `/src/lib/api/executor.ts` -- `executeTool()` switches behavior based on `isBodyMethod`
- `/src/lib/components/ToolListItem.svelte` -- sidebar method badge
- `/src/lib/components/ToolDetailPanel.svelte` -- detail header method badge

---

## cURL Export

A **cURL** button appears in two locations:

1. **Response status bar** -- After executing a tool, the status bar includes a "cURL" button that copies the equivalent `curl` command to the clipboard.
2. **Activity log entries** -- Execution log entries that contain request metadata also show a "cURL" button.

The generated cURL command:
- Includes the HTTP method (`-X POST`, etc.; omitted for GET since curl defaults to it)
- Includes all request headers (`-H 'Header: value'`)
- Includes the JSON body (`-d '...'`) for POST/PUT/PATCH methods
- Properly escapes single quotes in URLs, header values, and body content using the `'\\''` shell escaping pattern
- Multi-line format with backslash continuations for readability

**Relevant files:**
- `/src/lib/utils/curl-export.ts` -- `generateCurl()` and `generateCurlFromResult()` functions
- `/src/lib/components/ResponseViewer.svelte` -- cURL button in status bar
- `/src/lib/components/ActivityLogEntry.svelte` -- cURL button in log entries

---

## Keyboard Shortcuts

Global keyboard shortcuts are registered on the `<svelte:window>` element in the root layout.

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd/Ctrl + Enter` | Execute the current tool (submits the parameter form) | Tools page |
| `Cmd/Ctrl + K` | Focus the sidebar search input | Tools page |
| `Escape` | Close the activity log panel; if already closed, close the mobile sidebar | Global |
| `Cmd/Ctrl + Shift + L` | Toggle the activity log panel open/closed | Global |

The modifier key detection uses `e.ctrlKey || e.metaKey` to work on both macOS (Cmd) and Windows/Linux (Ctrl).

**Relevant file:**
- `/src/routes/+layout.svelte` -- `handleKeydown()` function

---

## Quick Replay

A **Replay** button appears in the response status bar for any execution result that has stored request parameters (`requestParams`).

Clicking Replay:
- Re-executes the tool with the exact same parameters from that execution
- The result is added to the execution history as a new entry
- Environment variable resolution is applied again at execution time

This is useful for quickly re-running a request after making server-side changes without needing to re-fill the form.

**Relevant files:**
- `/src/lib/components/ResponseViewer.svelte` -- Replay button and `handleReplay()`
- `/src/lib/components/ToolDetailPanel.svelte` -- `handleReplay()` delegates to `handleExecute()`

---

## Activity Log

### Overview

The activity log provides a global, chronological record of all significant events in the application. Events are categorized by level and category:

- **Levels:** Info, Success, Warning, Error
- **Categories:** Connection, Discovery, Execution, App

The log stores up to **500 entries** in memory (newest first). Entries are not persisted across page reloads; only the panel height preference is saved to localStorage.

### Panel

The activity log is rendered as a **bottom panel** that can be toggled open/closed. Key panel behaviors:
- **Resizable** -- Drag the handle at the top of the panel to resize (min 100px, max 600px, clamped to 50% of viewport height)
- **Panel height** is persisted in localStorage so it survives page reloads
- **Auto-scroll** is on by default; the panel scrolls to show the latest entries. Scrolling up disables auto-scroll; scrolling back to the bottom re-enables it.

### Filtering and Search

The panel toolbar provides three filtering mechanisms that can be combined:

1. **Category filter** -- Dropdown to show only Connection, Discovery, Execution, or App entries
2. **Level filter** -- Dropdown to show only Info, Success, Warning, or Error entries
3. **Free-text search** -- Case-insensitive search across log entry messages

The toolbar shows a count of filtered entries vs. total entries (e.g., "12 / 45").

### Error Badge

When the panel is **closed**, the activity log toggle button in the header shows a badge:
- **Red badge** with error count if any error-level entries exist
- **Indigo badge** with total entry count otherwise
- Badge shows "99+" if the count exceeds 99
- No badge is shown when there are zero entries

Error-level entries in the log list are visually distinguished with:
- A **red left border** (2px)
- A subtle **red background tint**

### Export

The **Export** button in the toolbar downloads the currently filtered entries (respecting active filters) as a JSON file named `otd-activity-log.json`.

### Entry Navigation

Execution log entries that have an associated `toolName` display a clickable **tool name badge** (indigo-colored). Clicking the badge:
- Selects that tool in the sidebar
- Navigates to the tools page if not already there

### cURL in Log Entries

Execution log entries whose details contain request metadata (`requestUrl`, `requestMethod`, etc.) show a **cURL** button. Clicking it copies the reconstructed cURL command to the clipboard.

### Clear

The **Clear** button removes all log entries from memory.

**Relevant files:**
- `/src/lib/stores/activity-log.svelte.ts` -- State management, filtering, entry limit
- `/src/lib/components/ActivityLogPanel.svelte` -- Panel UI, drag-to-resize, toolbar, export
- `/src/lib/components/ActivityLogEntry.svelte` -- Individual entry rendering, tool navigation, cURL
- `/src/lib/components/ActivityLogToggle.svelte` -- Toggle button with error/total badge

---

## Request Timeout and Cancellation

All tool executions are subject to a **30-second timeout**. The timeout is implemented via `AbortController`:

- When execution starts, a new `AbortController` is created and its `signal` is passed to `fetch()`
- A `setTimeout` of 30,000ms calls `controller.abort()` if the request hasn't completed
- During execution, the **Execute button transforms into a Cancel button**
- Clicking Cancel manually aborts the in-flight request
- Aborted requests (whether by timeout or manual cancellation) return with `status: 0` and `error: 'Request cancelled'`
- The abort error is detected by checking for `DOMException` with `name === 'AbortError'`

**Relevant files:**
- `/src/lib/components/ToolDetailPanel.svelte` -- `handleExecute()` creates the controller and timeout; `handleCancel()` aborts
- `/src/lib/api/executor.ts` -- `signal` parameter on `fetch()`, abort error handling

---

## Custom Request Headers

A collapsible **Custom Headers** section appears below the parameter form for each tool.

- Click the "Custom Headers" toggle to expand/collapse the editor
- Add key-value header pairs using the "+ Add header" button
- Remove individual headers with the X button on each row
- A badge next to the toggle shows the count of configured headers

Custom headers are **merged with default headers** at execution time. The default headers are:
- `Accept: application/json`
- `Content-Type: application/json` (for POST/PUT/PATCH only)
- `Authorization: Bearer {token}` (if a bearer token is configured)

If a custom header shares a key with a default header, the **custom header takes precedence** (since custom headers are spread after defaults in the headers object).

Custom headers are:
- **Included in presets** -- When saving a preset, any configured custom headers are stored alongside parameter values. Loading a preset restores both values and headers.
- **Included in cURL exports** -- All headers (default + custom) appear in the generated cURL command.

**Relevant files:**
- `/src/lib/components/HeadersEditor.svelte` -- Header editor UI
- `/src/lib/components/ToolDetailPanel.svelte` -- Integrates headers with execution and presets
- `/src/lib/api/executor.ts` -- `customHeaders` parameter merged into request headers

---

## Preset Export / Import

### Export

When a tool has one or more presets, an **export button** (download arrow icon) appears in the preset toolbar. Clicking it downloads a JSON file named `{toolName}-presets.json` containing all presets for that tool.

### Import

An **import button** (upload arrow icon) is always visible in the preset toolbar. Clicking it opens a file picker filtered to `.json` files. The selected file is parsed and its presets are imported.

- **Duplicate detection** -- Presets with names matching existing presets (case-insensitive comparison) are skipped
- **Import count** -- The function returns the number of newly imported presets

### File Format

```json
{
  "version": 1,
  "tool": "tool-name",
  "presets": [
    {
      "name": "My Preset",
      "values": { "param1": "value1", "param2": 42 },
      "headers": { "X-Custom": "value" }
    }
  ]
}
```

The `headers` field is optional and only included if the preset had custom headers configured.

**Relevant files:**
- `/src/lib/utils/preset-io.ts` -- `exportPresets()` and `importPresets()` functions
- `/src/lib/components/PresetBar.svelte` -- Export/import buttons and file input handling

---

## Response Diff

When a tool has **2 or more execution results**, a **Compare** toggle button appears next to the "Response" heading.

Clicking Compare:
- Switches the response area from the normal execution history view to a **diff view**
- Compares the **most recent result** (index 0) with the **previous result** (index 1)
- The diff is computed recursively on the response bodies using `jsonDiff()`

### Diff Display

Each difference is displayed as a card showing:
- The **JSON path** to the changed value (e.g., `data.items[0].name`, `[2].id`)
- A **type badge** indicating the kind of change

Color coding:
| Change Type | Badge Color | Background |
|-------------|-------------|------------|
| Added | Emerald green | Light green tint |
| Removed | Red | Light red tint |
| Changed | Amber | Light amber tint |

For **changed** values, a side-by-side comparison shows:
- "Previous" value in red
- "Current" value in green

The diff header shows the status and duration of both compared results, plus the total number of differences found. If the responses are identical, a message reading "Responses are identical." is displayed.

**Relevant files:**
- `/src/lib/utils/json-diff.ts` -- `jsonDiff()` recursive diff algorithm
- `/src/lib/components/ResponseDiff.svelte` -- Diff visualization UI
- `/src/lib/components/ToolDetailPanel.svelte` -- Compare toggle and conditional rendering

---

## Bulk Execution

A **Bulk** button appears in the preset toolbar when the current tool has at least one preset.

Clicking Bulk opens a **modal dialog** with:
- A checkbox list of all presets for the current tool
- **Select all** / **None** shortcut links
- A **Run** button showing the count of selected presets (e.g., "Run 3 presets")
- A **Cancel** button to dismiss the modal

Behavior:
- Selected presets are executed **sequentially** (one after another, not in parallel)
- Each execution result is added to the tool's normal execution history
- The modal shows "Running..." while execution is in progress
- The modal closes automatically when all executions complete
- Clicking the backdrop or pressing Escape also closes the modal

**Relevant files:**
- `/src/lib/components/BulkExecutor.svelte` -- Modal UI with preset selection
- `/src/lib/components/PresetBar.svelte` -- Renders the Bulk button and passes the `onbulkexecute` callback
- `/src/lib/components/ToolDetailPanel.svelte` -- `handleBulkExecute()` iterates through selected presets

---

## Environment Variables / Templating

### Environments

Named environments allow you to define sets of key-value variables that can be referenced in parameter values using template syntax.

- Environments are stored in localStorage and persist across sessions
- Each environment has a **name** and a **vars** object (`Record<string, string>`)
- A **selectedIndex** tracks which environment is active (-1 means none)

### Environment Selector

A **gear icon dropdown** appears in the header (next to the connection switcher) when connected. It provides:
- A list of all configured environments with variable counts (e.g., "Production (3 vars)")
- A **None** option to deselect all environments
- A **+ New environment** button that reveals an inline name input
- A **remove button** (X) that appears on hover for each environment

### Template Syntax

Use `{{varName}}` in parameter values to reference environment variables. For example:
- Parameter value: `{{API_KEY}}`
- Environment variable: `API_KEY = "sk-abc123"`
- Resolved value at execution time: `"sk-abc123"`

Template resolution:
- Variables are resolved **just before execution**, not when typing
- Only string parameter values are processed; non-string values pass through unchanged
- If no environment is selected or a referenced variable does not exist in the current environment, the `{{token}}` is **left as-is** in the value
- The `{{varName}}` pattern matches word characters only (`\w+`)
- The `hasTemplateTokens()` utility detects whether a string contains any template tokens, which can be used to display visual indicators in form fields

**Relevant files:**
- `/src/lib/stores/environments.svelte.ts` -- Environment state, CRUD operations, selection
- `/src/lib/utils/template.ts` -- `resolveTemplate()`, `resolveAllTemplates()`, `hasTemplateTokens()`
- `/src/lib/components/Header.svelte` -- Environment selector dropdown UI
- `/src/lib/components/ToolDetailPanel.svelte` -- Template resolution in `handleExecute()`

---

## Connection Health Indicator

After connecting to a discovery endpoint, OTD runs a periodic health check to monitor endpoint availability.

### How It Works

- A **HEAD request** is sent to the discovery URL every **60 seconds**
- The first check runs immediately upon connection
- Each request has a **5-second timeout** via `AbortController`
- Health checks stop automatically on disconnect or component destruction

### Health Status

The health status is displayed as a **colored dot** inside the connection button in the header:

| Status | Dot Color | Condition |
|--------|-----------|-----------|
| Healthy | Green (`bg-emerald-500`) | Response received in under 2 seconds |
| Slow | Amber (`bg-amber-500`) | Response received but took more than 2 seconds |
| Unreachable | Red (`bg-red-500`) | Request failed or timed out |
| Switching | Amber (pulsing) | Connection switch in progress |

### Activity Log Integration

Health state transitions are logged to the activity log:
- **Warning** when the connection becomes slow (includes duration in ms)
- **Error** when the endpoint becomes unreachable
- **Info** when the connection is restored after being slow or unreachable

Repeated checks that return the same status do not generate additional log entries.

**Relevant file:**
- `/src/lib/components/Header.svelte` -- `checkHealth()`, `startHealthCheck()`, `stopHealthCheck()`, `healthDotColor` derived state

---

## Favorites / Pinned Tools

Tools can be pinned to the top of the sidebar for quick access.

### How to Pin

- **Hover** over any tool in the sidebar to reveal a star icon on the right side
- **Click the star** to toggle the pin state
- Pinned tools show a **filled amber star**; unpinned tools show an outline star that only appears on hover

### Sidebar Organization

When any tools are pinned:
- A **"Pinned"** section header (amber text, uppercase) appears at the top of the sidebar
- Pinned tools are listed first, above a divider line
- Unpinned tools appear below the divider in their original order
- The search filter applies to both pinned and unpinned tools

### Persistence

- Favorites are stored in localStorage under the key `opal-debugger-favorites`
- Favorites are **scoped per discovery URL** -- each endpoint has its own independent set of pinned tools
- The data structure is `{ [discoveryUrl: string]: string[] }` where the array contains tool names

**Relevant files:**
- `/src/lib/stores/favorites.svelte.ts` -- `favoritesState`, `toggleFavorite()`, scoped by discovery URL
- `/src/lib/components/ToolSidebar.svelte` -- Splits tools into `pinnedTools` and `unpinnedTools` derived arrays
- `/src/lib/components/ToolListItem.svelte` -- Star icon with hover reveal and click handler
