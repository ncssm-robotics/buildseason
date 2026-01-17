# BuildSeason

**Agent-first platform for FTC robotics teams.** GLaDOS handles the operational grind so your team can focus on building robots.

> "Machines do machine work so humans can do human work."

## The Agent IS the Product

BuildSeason isn't a web app with an AI assistant. The agent IS the interface. Discord is primary, web is secondary.

- **Talk, don't click.** Ask GLaDOS about parts, orders, and team status in Discord.
- **Proactive, not reactive.** GLaDOS alerts you about low stock, delayed orders, and upcoming deadlines.
- **Context-aware.** The agent knows your team's state and speaks your language.

## Capabilities

- **Inventory Management** - Track parts through conversation
- **Order Tracking** - GLaDOS monitors and alerts on order status
- **BOM Management** - Manage bills of materials for each robot
- **Team Coordination** - Agent-assisted task and role management
- **Proactive Monitoring** - Automated alerts before problems become urgent

## Tech Stack

- **Agent:** [Claude Agent SDK](https://docs.anthropic.com) running in Convex actions
- **Backend:** [Convex](https://convex.dev) (database, functions, real-time sync)
- **Runtime:** [Bun](https://bun.sh)
- **Frontend:** [React](https://react.dev) with [TanStack Router](https://tanstack.com/router) (secondary interface)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Auth:** [Convex Auth](https://labs.convex.dev/auth) (GitHub, Google OAuth)

## Project Structure

```
buildseason/
├── convex/            # Convex backend
│   ├── agent/         # Claude agent (primary interface)
│   ├── schema.ts      # Database schema
│   └── http.ts        # HTTP endpoints (Discord webhook)
├── src/               # React frontend (secondary interface)
│   ├── routes/        # TanStack Router pages
│   ├── components/    # UI components
│   └── lib/           # Utilities
└── docs/
    ├── PHILOSOPHY.md  # Agent-first philosophy
    └── ARCHITECTURE.md # Technical architecture
```

## Quick Start

```bash
# Install dependencies
bun install

# Start development (Vite + Convex dev servers)
bun run dev
```

**Frontend:** http://localhost:5173

On first run, you'll be prompted to log in to Convex and create a project.

## Documentation

- [Philosophy](docs/PHILOSOPHY.md) - Agent-first design philosophy
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture and patterns
- [Deployment Guide](docs/deployment.md) - Local dev, Convex, Vercel deployment
- [Agent Instructions](CLAUDE.md) - For AI assistants working on this codebase

## Project Management

This project uses [beads](https://github.com/beads-project/beads) for issue tracking:

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
```

## Development

```bash
# Start development server
bun run dev           # Vite + Convex dev servers

# Testing & Linting
bun run typecheck     # TypeScript type checking
bun run lint          # ESLint
bun run test          # Run tests in watch mode
bun run test:run      # Run tests once

# Build for production
bun run build         # Build frontend for production
```

### Convex Commands

```bash
npx convex dev        # Start Convex dev server (included in bun run dev)
npx convex deploy     # Deploy Convex functions to production
npx convex dashboard  # Open Convex dashboard
```

## License

MIT
