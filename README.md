# Opal Tools Debugger

A local debugger for [Opal tools](https://opal.dev) — test and execute tools from your browser without deploying.

## Quick Start

```bash
npx @kunalshetye/opal-tools-debugger
```

The debugger opens at `http://localhost:4873`. Enter your discovery endpoint URL in the UI and start testing.

### CLI Options

```bash
npx @kunalshetye/opal-tools-debugger \
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

- **Discovery** — Connects to your Opal discovery endpoint and lists all available tools with their parameters, HTTP methods, and endpoints.
- **Tool Execution** — Fill in parameters via auto-generated forms and execute tools directly. Responses show status, headers, body, and timing.
- **Parameter Presets** — Save named parameter presets per tool, scoped by discovery endpoint. Load a preset to pre-fill the form, update it with new values, or delete it. Stored in IndexedDB for structured, high-capacity browser storage.
- **Execution History** — Each tool keeps the last 10 execution results in localStorage so you can compare responses across runs.
- **Connection History** — Recent connections are saved locally. One-click reconnect to any previous endpoint without retyping URLs and tokens.
- **Connection Switcher** — Switch between discovery endpoints directly from the header dropdown without disconnecting first. The dropdown lists all connections from history and performs a seamless switch in place.
- **Dark/Light Theme** — Toggle between dark and light mode via the header button. Defaults to your OS preference and persists across sessions.
- **Search** — Filter tools by name or description in the sidebar.
- **JSON Viewer** — Collapsible, syntax-highlighted JSON tree for response bodies.
- **CLI Pre-fill** — Pass `--discovery-url` and `--bearer-token` via CLI to skip manual entry.

## Integrating Into Your Opal Tools Project

Add a script to your project's `package.json` so your team can launch the debugger with a single command — no global install needed.

> **One-off usage without a script** — you can run the debugger directly without adding it to `package.json`:
>
> ```bash
> npx @kunalshetye/opal-tools-debugger                          # npm
> yarn dlx @kunalshetye/opal-tools-debugger                     # yarn
> pnpm dlx @kunalshetye/opal-tools-debugger                     # pnpm
> bunx @kunalshetye/opal-tools-debugger                         # bun
> ```

### Basic — just launch the debugger

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/opal-tools-debugger"
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
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery"
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
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery -t $OPAL_TOKEN"
	}
}
```

Reads the token from an environment variable. You can also hardcode a dev token if it's a non-sensitive local environment:

```json
{
	"scripts": {
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery -t dev-token-123"
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
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery",
		"debugger:staging": "npx @kunalshetye/opal-tools-debugger -d https://staging.example.com/discovery -t $STAGING_TOKEN",
		"debugger:prod": "npx @kunalshetye/opal-tools-debugger -d https://api.example.com/discovery -t $PROD_TOKEN -p 4874"
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
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery -p 9000"
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
		"debugger": "npx @kunalshetye/opal-tools-debugger -d http://localhost:3000/discovery",
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

1. The CLI (`bin/cli.js`) sets environment variables and starts a SvelteKit (adapter-node) server.
2. On first load, the UI fetches `/api/config` to pick up CLI-provided defaults.
3. The client calls your discovery endpoint directly (CORS must be open) and renders the tool list.
4. Tool execution sends requests from the browser to your Opal tool endpoints.

All state (connection, tools, history, theme) lives in the browser's localStorage. Parameter presets use IndexedDB for structured storage. Nothing is stored server-side.

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

- [SvelteKit](https://svelte.dev/docs/kit) with adapter-node
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
      executor.ts                   # Execute tool requests
    components/
      ConnectionForm.svelte         # URL/token form + connection history
      Header.svelte                 # App header with connection switcher + theme toggle
      JsonViewer.svelte             # Collapsible JSON tree viewer
      PresetBar.svelte              # Preset toolbar (save/load/update/delete)
      ResponseViewer.svelte         # Response display (status, headers, body, timing)
      ToolDetailPanel.svelte        # Tool detail — form + response side by side
      ToolForm.svelte               # Parameter form for tool execution
      ToolListItem.svelte           # Single tool item in sidebar list
      ToolSidebar.svelte            # Sidebar with search + tool list
    db/
      presets.ts                    # IndexedDB access layer for presets
    stores/
      connection.svelte.ts          # Connection state (URL, token, connected)
      history.svelte.ts             # Connection history (recent endpoints)
      presets.svelte.ts             # Preset state + async IndexedDB persistence
      theme.svelte.ts               # Dark/light theme state + persistence
      tools.svelte.ts               # Tools state (functions list)
      ui.svelte.ts                  # UI state (selection, sidebar, execution results)
    types.ts                        # TypeScript interfaces
    utils/
      http-status.ts                # HTTP status code labels and colors
      preset-merge.ts               # Merge preset values with tool parameters
  routes/
    +layout.svelte                  # App layout with header + theme init
    +page.svelte                    # Home — connection form
    layout.css                      # Global styles + Tailwind config
    api/config/+server.ts           # Returns CLI-provided env vars
    tools/
      +page.svelte                  # Tools page — sidebar + detail panel
```

## License

MIT
