# Products Admin

Interview starter project: a products table for an internal back office.

Stack: React 19, TypeScript, Vite, UI components from [MUI v9](https://mui.com/material-ui/all-components/) (`@mui/material`). No other libraries.

Up-to-date MUI docs for AI agents: https://mui.com/material-ui/llms.txt (an index of Markdown docs pages).

## Getting started

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
```

Requires Node.js 20.19+ or 22.12+.

## Docs

- [`docs/API.md`](docs/API.md) — endpoints and data models.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture and decision log, filled in as the work goes.
- [`AGENTS.md`](AGENTS.md) — rules for the AI agent. `CLAUDE.md` imports the same file.
