# Connection History

## Overview

The connection history feature stores recent Opal discovery endpoint connections in localStorage, allowing users to reconnect to previous endpoints with a single click.

## How It Works

### Storage

- **localStorage key**: `opal-debugger-history`
- **Max entries**: 10 (most recent first)
- **Deduplication**: By discovery URL (case-insensitive). Connecting to the same URL again moves it to the top with updated token and timestamp.

### Entry Structure

Each history entry contains:

```typescript
{
  discoveryUrl: string;   // The full discovery endpoint URL
  bearerToken: string;    // Bearer token used (may be empty)
  connectedAt: string;    // ISO 8601 timestamp of last connection
}
```

### When Entries Are Created

History entries are added inside the `connect()` function in `connection.svelte.ts`. This means history is only recorded for **successful** connections — if the discovery fetch fails, nothing is saved.

### Auto-Connect

Clicking a history entry triggers the full connection flow:
1. Fetches the discovery endpoint
2. Saves the connection state
3. Sets the tools list
4. Navigates to `/tools`

If the connection fails (e.g., endpoint is down), an error message is shown inline.

## UI

The history list appears below the connection form on the home page, only when there are entries.

Each entry shows:
- **Discovery URL** — full URL, truncated with ellipsis if too long
- **Masked token** — first 4 + `****` + last 4 characters (or `****` for short tokens)
- **Relative time** — "just now", "5m ago", "3h ago", "2d ago", or a date for older entries

Hovering over an entry reveals an X button to remove it.

## Store API

```typescript
import { historyState, addToHistory, removeFromHistory } from '$lib/stores/history.svelte';

// Read history entries (reactive)
historyState // HistoryEntry[]

// Add or update an entry (called automatically by connect())
addToHistory(discoveryUrl: string, bearerToken: string)

// Remove an entry by index
removeFromHistory(index: number)
```
