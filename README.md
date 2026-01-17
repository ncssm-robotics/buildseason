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

- **Runtime:** [Bun](https://bun.sh)
- **Backend:** [Convex](https://convex.dev) (database, functions, real-time sync)
- **Frontend:** [React](https://react.dev) with [TanStack Router](https://tanstack.com/router)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Auth:** [Convex Auth](https://labs.convex.dev/auth) (GitHub, Google OAuth)

## Project Structure

```
buildseason/
├── convex/            # Convex backend (schema, functions, auth)
├── src/               # React frontend
│   ├── routes/        # TanStack Router pages
│   ├── components/    # UI components
│   └── lib/           # Utilities
└── docs/              # Documentation
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
