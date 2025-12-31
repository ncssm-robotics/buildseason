# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Overview

BuildSeason is an open-source team management platform for FTC robotics teams.

**Stack:**

- Runtime: Bun with Workspaces
- API: Hono with Hono RPC for type-safe endpoints
- Frontend: React with TanStack Router & TanStack Query
- UI: shadcn/ui + Tailwind CSS
- Database: Turso (libSQL) + Drizzle ORM
- Auth: Better-Auth (GitHub, Google OAuth)

**Architecture:** Monorepo with Bun workspaces. API and frontend are separate apps with end-to-end type safety via Hono RPC.

## Project Structure

```
buildseason/
├── apps/
│   ├── api/              # Hono backend API
│   │   └── src/
│   │       ├── routes/   # API route handlers
│   │       ├── db/       # Drizzle schema and queries
│   │       ├── lib/      # Auth, utilities
│   │       ├── middleware/
│   │       └── client.ts # Type exports for RPC
│   └── web/              # React frontend
│       └── src/
│           ├── routes/   # TanStack Router pages
│           ├── components/
│           └── lib/      # API client, utilities
├── packages/             # Shared packages (future)
├── drizzle/              # Database migrations
└── docs/
```

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Bash Command Rules (MANDATORY)

**NEVER chain bd commands or other commands with `&&` or `;`.**

The allowlist uses patterns like `Bash(bd:*)` which only matches single commands. Chained commands trigger approval prompts and block autonomous operation.

**BAD:**

```bash
bd update foo --status in_progress && bd close foo
git add -A && git commit -m "message"
```

**GOOD:**

```bash
# Make separate Bash calls for each command
bd update foo --status in_progress
# (separate call)
bd close foo
```

This applies to ALL command-line tools. One command per Bash call.

## Environment Setup

```bash
# Install dependencies
bun install

# Set up local database
cp .env.example .env
bun run db:push
bun run db:seed

# Verify everything works
bun run typecheck
bun run dev
```

**Development URLs:**

- Frontend: http://localhost:5173 (Vite dev server)
- API: http://localhost:3000 (use 5173 for UI testing)

## Core Rules

1. **All work through beads** - Never code without a bead to track it
2. **Verify before closing** - Tests or Chrome MCP evidence required
3. **Commit after each bead** - Creates recovery checkpoints
4. **Ask on ambiguity** - Stop and ask if spec is unclear

## Skills

Detailed patterns and workflows are in `.claude/skills/`:

| Skill                | Use When                                         |
| -------------------- | ------------------------------------------------ |
| `bead-workflow`      | Working with beads, verification, claiming tasks |
| `api-patterns`       | Creating API endpoints, database queries         |
| `testing-guide`      | Writing tests, test philosophy                   |
| `chrome-mcp-testing` | UI validation, browser automation                |
| `code-review`        | Security/code reviews, audit reports             |
| `session-completion` | Ending sessions, handoff protocol                |
| `parallel-execution` | Dispatching multiple agents                      |
| `skill-building`     | Creating new skills                              |

Skills load automatically when context matches their description.

## Model Labels

Use labels to route work to appropriate models:

| Label          | Model  | Use For                        |
| -------------- | ------ | ------------------------------ |
| `model:haiku`  | Haiku  | Simple mechanical tasks        |
| `model:sonnet` | Sonnet | Standard feature work          |
| `model:opus`   | Opus   | Architecture, security reviews |

```bash
bd create "Rename function" -t task --labels model:haiku
bd create "Security review" -t task --labels model:opus,review:security
```

## Quality Gates

Before completing work:

```bash
bun run typecheck     # Type checking
bun run lint          # ESLint
bun test              # All tests
```

## Session End Checklist

```
[ ] git status              (check changes)
[ ] git add <files>         (stage code)
[ ] bd sync                 (commit beads)
[ ] git commit -m "..."     (commit code)
[ ] git push                (MANDATORY - work not done until pushed)
```

Work is NOT complete until `git push` succeeds.
