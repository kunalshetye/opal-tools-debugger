# Connection History

## Overview

The connection history feature stores recent Opal discovery endpoint connections in localStorage, allowing users to reconnect to previous endpoints with a single click — either from the home page or directly from the header dropdown.

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

### Auto-Connect from Home Page

Clicking a history entry on the home page triggers the full connection flow:
1. Fetches the discovery endpoint
2. Saves the connection state
3. Sets the tools list
4. Navigates to `/tools`

If the connection fails (e.g., endpoint is down), an error message is shown inline.

### Quick-Switch from Header

When already connected, clicking the connection indicator in the header opens a dropdown showing other connections from history. Clicking one performs a seamless switch:
1. Fetches discovery from the new endpoint
2. Updates connection state (calls `connect()`, which also updates history)
3. Refreshes the tools list
4. Clears the currently selected tool
5. Stays on the current page (navigates to `/tools` if not already there)

During the switch, the header status dot pulses amber. If the switch fails, the user stays on the current connection silently.

## UI

### Home Page

The history list appears below the connection form, only when there are entries.

Each entry shows:
- **Discovery URL** — full URL, truncated with ellipsis if too long
- **Masked token** — first 4 + `****` + last 4 characters (or `****` for short tokens)
- **Relative time** — "just now", "5m ago", "3h ago", "2d ago", or a date for older entries

Hovering over an entry reveals an X button to remove it.

### Header Dropdown

When connected, the header shows a connection indicator button that opens a dropdown:
- **Current connection** — shown as the button label (origin URL) with a green status dot and chevron
- **"Switch to" section** — lists history entries excluding the current one, each showing origin + full discovery URL
- **Disconnect button** — at the bottom of the dropdown, separated by a divider

The dropdown closes on click-outside.

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
