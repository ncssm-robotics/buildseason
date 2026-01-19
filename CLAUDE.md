# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Overview

BuildSeason is an **agent-first platform** for FTC robotics teams. The agent IS the product. Discord is primary, web is secondary.

> "Machines do machine work so humans can do human work."

**Philosophy:** See [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md)
**Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

**Stack:**

- Runtime: Bun
- Agent: Claude Agent SDK (runs in Convex actions)
- Backend: Convex (database, functions, real-time sync)
- Frontend: React with TanStack Router (secondary interface)
- UI: shadcn/ui + Tailwind CSS
- Auth: Convex Auth (GitHub, Google OAuth)

**Architecture:** Agent-first with Convex backend. Agent in `convex/agent/`, frontend in `src/`, backend in `convex/`.

## Project Structure

```
buildseason/
├── convex/               # Convex backend
│   ├── agent/            # Claude agent (primary interface)
│   │   ├── handler.ts    # Main agent action
│   │   ├── context.ts    # Team context loader
│   │   └── tools/        # Agent tool definitions
│   ├── schema.ts         # Database schema
│   ├── http.ts           # HTTP endpoints (Discord webhook)
│   ├── auth.ts           # Auth configuration
│   └── _generated/       # Auto-generated types
├── src/                  # React frontend (secondary interface)
│   ├── routes/           # TanStack Router pages
│   ├── components/       # UI components
│   └── lib/              # Utilities
└── docs/
    ├── PHILOSOPHY.md     # Agent-first philosophy
    └── ARCHITECTURE.md   # Technical architecture
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

# Verify everything works
bun run typecheck
bun run dev
```

**Development URL:** http://localhost:5173 (Vite dev server)

## Core Rules

1. **All work through beads** - Never code without a bead to track it
2. **Verify before closing** - Tests or Chrome MCP evidence required
3. **Commit after each bead** - Creates recovery checkpoints
4. **Ask on ambiguity** - Stop and ask if spec is unclear

## Skills

Detailed patterns and workflows are in `.claude/skills/`:

| Skill                     | Use When                                            |
| ------------------------- | --------------------------------------------------- |
| `agent-first-development` | Planning features, deciding UI vs agent approach    |
| `convex-agent-patterns`   | Building agent actions, tools, context loaders      |
| `bead-workflow`           | Working with beads, verification, claiming tasks    |
| `api-patterns`            | Creating Convex queries and mutations               |
| `testing-guide`           | Writing tests, test philosophy                      |
| `chrome-mcp-testing`      | UI validation, browser automation                   |
| `code-review`             | Code quality audits, patterns, test coverage        |
| `security-review`         | Security audits, OWASP, auth, injection checks      |
| `ui-design-review`        | Visual UI reviews with Chrome MCP                   |
| `brand-guidelines`        | Colors, fonts, design patterns (Workshop Blueprint) |
| `navigation-patterns`     | TanStack Router, sidebar structure, routes          |
| `discord-bot-patterns`    | Discord.js, GLaDOS agent, message handling          |
| `session-completion`      | Ending sessions, handoff protocol                   |
| `parallel-execution`      | Dispatching multiple agents                         |
| `skill-building`          | Creating new skills                                 |

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

## Running Tests (CRITICAL)

This project uses **vitest**, NOT bun's built-in test runner.

```bash
# CORRECT - uses vitest
bun run test:run      # Run all tests once
bun run test          # Run tests in watch mode

# WRONG - DO NOT USE
bun test              # This uses bun's test runner, NOT vitest
```

**NEVER claim test failures are "pre-existing" or "unrelated to your changes."** This is unacceptable. If tests fail:

1. You probably ran `bun test` instead of `bun run test:run`
2. Or you actually broke something - fix it

There is no such thing as "pre-existing test failures" in this codebase. All tests pass on main. If tests fail, you either ran the wrong command or you broke something.

## Quality Gates

Before completing work:

```bash
bun run typecheck     # Type checking
bun run lint          # ESLint
bun run test:run      # All tests (vitest)
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
