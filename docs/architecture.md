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

Connection info, connection history, and execution history are stored in localStorage. This means:
- No database or server-side persistence needed
- State survives page refreshes but is per-browser
- The server is completely stateless (just serves the app)

### Svelte 5 Runes

All state management uses Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of Svelte 4 stores. Store files use the `.svelte.ts` extension to enable rune syntax outside components.

### CLI → Environment → Config Endpoint

The CLI sets `process.env` variables before importing the built SvelteKit server. The `/api/config` endpoint reads these via `$env/dynamic/private` (not `process.env`, which Vite replaces at build time) and returns them as JSON. The client fetches this on mount to pre-fill the connection form.

## Data Flow

### Connection Flow

1. User enters discovery URL (+ optional bearer token) or clicks a history entry
2. Client fetches the discovery endpoint directly
3. Discovery response is validated (must contain `functions` array)
4. Connection state is saved to localStorage
5. Connection is added to history (deduped by URL, max 10 entries)
6. Tools are set in the tools store
7. User is navigated to `/tools`

### Tool Execution Flow

1. User fills in parameters via the auto-generated form
2. Client sends a POST request to `{baseUrl}{tool.endpoint}` with JSON body
3. Response status, headers, body, and timing are captured
4. Result is prepended to the execution history (max 10 per tool)
5. Execution history is persisted to localStorage per tool name

### Page Refresh Recovery

When a user refreshes any page:
- Connection state is loaded from localStorage
- If on `/tools` or `/tools/[name]` and connected, discovery is re-fetched to rebuild the tools list
- If not connected, the user is redirected to `/`
- Execution history for tool pages is loaded from localStorage

## Stores

| Store | Key | Persisted | Content |
|-------|-----|-----------|---------|
| `connection.svelte.ts` | `opal-debugger-connection` | Yes | URL, token, baseUrl, connected flag |
| `history.svelte.ts` | `opal-debugger-history` | Yes | Array of {discoveryUrl, bearerToken, connectedAt} |
| `tools.svelte.ts` | — | No | Array of OpalFunction objects |

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
  error?: string;
}
```
