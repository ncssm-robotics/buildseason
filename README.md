# BuildSeason

Open-source team management platform for FTC robotics teams. Track parts, manage orders, coordinate with vendors, and build better robots.

## Features

- **Team Management** - Create teams, invite members, assign roles
- **Parts Inventory** - Track parts, quantities, locations, and costs
- **Vendor Directory** - Browse FTC-approved vendors with contact info
- **Bill of Materials** - Create BOMs for robot subsystems
- **Order Management** - Track orders from request to delivery
- **Dashboard** - Team overview with key metrics

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) with Workspaces
- **Server:** [Hono](https://hono.dev) with Hono RPC for type-safe API
- **Frontend:** [React](https://react.dev) with [TanStack Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Database:** [Turso](https://turso.tech) (libSQL) + [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [Better-Auth](https://better-auth.com)

## Project Structure

```
buildseason/
├── apps/
│   ├── api/           # Hono backend API
│   └── web/           # React frontend
├── packages/          # Shared packages (future)
├── drizzle/           # Database migrations
└── docs/              # Documentation
```

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
bun run db:push
bun run db:seed  # optional sample data

# Start development (run in separate terminals)
bun run dev:api   # Terminal 1: API + local Turso DB (port 3000)
bun run dev:web   # Terminal 2: React frontend with HMR (port 5173)
```

**Frontend:** http://localhost:5173 (proxies `/api` calls to the API)
**API directly:** http://localhost:3000

## Documentation

- [Deployment Guide](docs/deployment.md) - Local dev, Turso, Fly.io, domain setup
- [Agent Instructions](AGENTS.md) - For AI assistants working on this codebase

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
# Start servers (use separate terminals)
bun run dev:api       # API server + embedded Turso dev database
bun run dev:web       # React frontend with hot reload

# Testing & Linting
bun run typecheck     # TypeScript type checking (all apps)
bun run lint          # ESLint (all apps)
bun run test          # Run all tests
bun run test:api      # Run API tests only

# Database (runs in apps/api context)
bun run db:push       # Push schema changes to local DB
bun run db:generate   # Generate Drizzle migrations
bun run db:studio     # Open Drizzle Studio GUI
bun run db:seed       # Seed sample data

# Build for production
bun run build         # Build all apps
```

### App-specific commands

You can also run commands directly in each app:

```bash
cd apps/api && bun run dev:app   # API only (no Turso, uses existing DB)
cd apps/web && bun run dev       # Frontend only
```

## License

MIT
