# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Overview

BuildSeason is an open-source team management platform for FTC robotics teams.

**Stack:**

- Runtime: Bun
- Server: Hono with JSX templates (NO React)
- Database: Turso (libSQL) + Drizzle ORM
- Interactivity: HTMX + Alpine.js (via CDN)
- Styling: Tailwind CSS (via CDN)
- Auth: Better-Auth

**Key principle:** Server-side rendering only. No client-side build step. HTMX swaps HTML fragments for interactivity.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Environment Setup

Before starting work, ensure your environment is ready:

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

## Development Workflow

**CRITICAL: All work MUST go through beads. Create beads BEFORE writing code.**

1. **Pick a task:** `bd ready` to find unblocked work
2. **Claim it:** `bd update <id> --status in_progress`
3. **Do the work:** Write code, following existing patterns
4. **Verify:** `bun run typecheck && bun run lint && bun test` (all must pass)
5. **Complete:** `bd close <id> -r "Brief summary"`

### Beads-First Rule

- **NEVER** start coding without a bead to track the work
- If no bead exists, create one first: `bd create "Description" -t task`
- This ensures all work is tracked, discoverable, and can be parallelized
- Even small fixes should have beads - it takes 5 seconds to create one

## Code Patterns

### Adding a new page

```typescript
// src/routes/example.tsx
import { Hono } from "hono";
import { Layout } from "../components/Layout";
import { requireAuth } from "../middleware/auth";

const app = new Hono();

app.use("*", requireAuth);

app.get("/", (c) => {
  const user = c.get("user");
  return c.html(
    <Layout title="Example">
      <div>Hello {user?.name}</div>
    </Layout>
  );
});

export default app;
```

### HTMX patterns

```tsx
// Trigger partial reload
<button hx-get="/api/items" hx-target="#item-list" hx-swap="innerHTML">
  Refresh
</button>

// Form submission
<form hx-post="/api/items" hx-target="#result" hx-swap="innerHTML">
  <input name="name" />
  <button type="submit">Add</button>
</form>
```

### Database queries

```typescript
import { db } from "../db";
import { parts } from "../db/schema";
import { eq } from "drizzle-orm";

// Query with relations
const items = await db.query.parts.findMany({
  where: eq(parts.teamId, teamId),
  with: { vendor: true },
});
```

## Testing Approach

### Philosophy

- **Test behavior, not implementation** - Tests should verify what the code does, not how it does it
- **Fast feedback** - Unit tests run in milliseconds, integration tests in seconds
- **Realistic data** - Use factories to create realistic test fixtures
- **Isolated tests** - Each test should be independent and repeatable

### Test Structure

```
src/
├── __tests__/           # Test files mirror src/ structure
│   ├── unit/            # Pure function tests, no I/O
│   ├── integration/     # Database and API tests
│   └── fixtures/        # Test data factories
```

### Running Tests

```bash
bun test                 # Run all tests
bun test --watch         # Watch mode for development
bun test src/__tests__/unit  # Run only unit tests
```

### Writing Tests

**Unit tests** for pure functions and utilities:

```typescript
import { describe, expect, test } from "bun:test";
import { calculateOrderTotal } from "../lib/orders";

describe("calculateOrderTotal", () => {
  test("sums line item prices", () => {
    const items = [
      { quantity: 2, unitPriceCents: 1000 },
      { quantity: 1, unitPriceCents: 500 },
    ];
    expect(calculateOrderTotal(items)).toBe(2500);
  });
});
```

**Integration tests** for routes and database:

```typescript
import { describe, expect, test, beforeEach } from "bun:test";
import { testDb, createTestUser } from "../fixtures";
import app from "../../index";

describe("GET /api/parts", () => {
  beforeEach(async () => {
    await testDb.reset();
  });

  test("returns team parts for authenticated user", async () => {
    const user = await createTestUser();
    const res = await app.request("/api/parts", {
      headers: { Cookie: user.sessionCookie },
    });
    expect(res.status).toBe(200);
  });
});
```

### What to Test

| Layer      | What to Test     | Example                             |
| ---------- | ---------------- | ----------------------------------- |
| Utils      | Pure functions   | `formatCurrency(1234)` → `"$12.34"` |
| Schema     | Validation logic | Required fields, constraints        |
| Middleware | Auth, RBAC       | Redirect when unauthorized          |
| Routes     | HTTP behavior    | Status codes, response shape        |
| DB queries | Data integrity   | Relations, cascades                 |

### What NOT to Test

- CDN libraries (Tailwind, HTMX, Alpine)
- Better-Auth internals
- Drizzle ORM internals
- Third-party API behavior

## Model Recommendations (Labels)

Use labels to specify which model should handle a bead. This helps route simple work to faster/cheaper models and complex work to more capable ones.

### Model Labels

| Label          | Model         | Use For                                                      |
| -------------- | ------------- | ------------------------------------------------------------ |
| `model:haiku`  | Claude Haiku  | Simple, mechanical tasks (rename, add comment, minor fix)    |
| `model:sonnet` | Claude Sonnet | Standard feature work, bug fixes, most development           |
| `model:opus`   | Claude Opus   | Architecture planning, security reviews, complex refactoring |

### Examples

```bash
# Simple mechanical task
bd create "Rename getUserById to findUserById" -t task -p 3 --labels model:haiku

# Standard feature work (default, label optional)
bd create "Add pagination to parts list" -t task -p 2 --labels model:sonnet

# Complex review requiring deep analysis
bd create "Security review: auth flows" -t task -p 2 --labels model:opus,review:security
```

When dispatching bead-workers, check for model labels and pass the appropriate model to the Task tool.

## Scheduled Reviews (Security & Code Quality)

**Always keep review beads "on the horizon."** These are scheduled checkpoints that ensure security and code quality don't drift as features accumulate.

### Review Philosophy

**Reviews are discovery tasks, not fix-everything tasks.**

- Audit the codebase against a checklist
- Create new beads for each finding with appropriate priority
- Use `discovered-from` relationship to link findings to the review
- Close the review with a **full audit report** in the close reason

This keeps reviews focused and fast, while ensuring findings are properly tracked and prioritized.

### Review Labels

Always label review beads for easy querying later:

- `review:security` - Security audits
- `review:code` - Code quality reviews

Query past reviews:

```bash
bd list --label review:security --status closed
bd list --label review:code --status closed
bd show <review-id>  # See full audit report in close reason
```

### When to Schedule Reviews

Create or refresh review beads after:

- **Security review** - After auth changes, new API endpoints, input handling, or every ~10-15 feature beads
- **Code review** - After major refactoring, new patterns, or every ~15-20 beads

### Review Bead Templates

**Security Review:**

```bash
bd create "Security review: [area]" -t task -p 2 --labels model:opus,review:security -d "Security audit - DO NOT FIX directly, create beads for findings.

Checklist:
- OWASP Top 10 check
- Auth flow (OAuth state, CSRF, session cookies)
- RBAC enforcement on all endpoints
- Input validation (forms, query params)
- SQL injection (parameterized queries)
- XSS prevention in templates
- HTMX endpoint authorization
- Rate limiting status

For each finding:
  bd create \"Fix: [issue]\" -t bug -p [priority]
  bd dep add [new-bead] [this-review] -t discovered-from"
```

**Code Quality Review:**

```bash
bd create "Code review: [area]" -t task -p 2 --labels model:opus,review:code -d "Code audit - DO NOT FIX directly, create beads for findings.

Checklist:
- Pattern consistency across routes
- Dead code and unused imports
- Error handling completeness
- Type safety (no any, missing types)
- Component reusability
- Query efficiency (N+1 detection)
- Code duplication
- Test coverage gaps

For each finding:
  bd create \"Refactor: [issue]\" -t task -p [priority]
  bd dep add [new-bead] [this-review] -t discovered-from"
```

### Audit Report Format

When closing a review bead, include a **full audit report** in the close reason. This is the audit trail - no separate markdown files needed.

**Report structure:**

```
## Files Reviewed
- src/routes/auth.tsx
- src/routes/orders.tsx
- src/middleware/auth.ts
- [list all files checked]

## Checklist Results

### [Category 1: e.g., SQL Injection]
- Reviewed: [files]
- Result: PASS (all queries use Drizzle ORM parameterized queries)

### [Category 2: e.g., XSS Prevention]
- Reviewed: [files]
- Result: 2 ISSUES FOUND
- Created: buildseason-abc (P1), buildseason-def (P2)

### [Category 3: e.g., RBAC Enforcement]
- Reviewed: [files]
- Result: PASS (all protected routes use requireAuth/teamMiddleware)

[...continue for each checklist item...]

## Summary
- Total checks: 8
- Passed: 5
- Issues found: 3 (created 9 beads)
- P1: 3, P2: 4, P3: 2

## Created Beads
- buildseason-abc: Fix: [issue] (P1)
- buildseason-def: Fix: [issue] (P1)
[...list all created beads...]
```

This format provides:

- **Positive proof** - "we checked X and found nothing" is documented
- **Full audit trail** - every check, every result
- **Queryable history** - `bd list --label review:security` finds all past security reviews
- **No file sprawl** - everything lives in the bead

### Dependency Chains

Reviews should depend on the work they're reviewing:

```bash
# Security review depends on auth/security changes
bd dep add security-review-bead auth-change-bead

# Code review depends on security review (security first)
bd dep add code-review-bead security-review-bead
```

### Tracking Discovered Issues

When a review finds issues, link them back:

```bash
# Create finding with priority based on severity
bd create "Fix: XSS in order notes field" -t bug -p 1

# Link it to the review that discovered it
bd dep add new-finding-bead review-bead -t discovered-from
```

This creates an audit trail: you can see what issues came from which review, and the review bead documents the scope of what was checked.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed):
   ```bash
   bun run typecheck     # Type checking
   bun run lint          # ESLint
   bun test              # All tests
   ```
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Parallel Session Guidelines

Multiple agents may work on this project simultaneously. To avoid conflicts:

1. **Always claim work first:** `bd update <id> --status in_progress` before starting
2. **Pull before starting:** `git pull --rebase` at session start
3. **Stay in your lane:** Only modify files related to your claimed issue
4. **Small, focused commits:** Commit and push frequently
5. **Check for conflicts:** If you see merge conflicts, resolve them carefully

### Recommended parallel work streams

These epic areas are designed to be worked on independently:

- **Vendor Directory** - Mostly read-only, isolated
- **Parts Inventory** - After vendors, can be isolated
- **BOM** - Depends on parts, but separate pages
- **Dashboard** - Aggregates data, minimal write conflicts
- **Deployment** - Infrastructure, no code conflicts

## Parallel Bead Execution (Async Subagents)

This project supports parallel bead processing using Claude Code's async Task tool with `run_in_background`.

### Quick Start - Parallel Dispatch

To work on multiple beads simultaneously:

```
User: Work on the top 3 ready beads in parallel

Agent: [Runs `bd ready --limit 5 --json` to find independent work]
Agent: [Dispatches 3 bead-worker Tasks with run_in_background=true]
Agent: [Continues with other work or monitors progress]
```

Or explicitly:

```
User: Run bead-worker on buildseason-abc, buildseason-def, and buildseason-ghi in the background

Agent: [Launches 3 parallel Task agents, each handling one bead]
Agent: [Uses TaskOutput to check progress or wait for completion]
```

### Available Subagent Patterns

| Pattern            | Model  | Purpose                                 | When to Use                        |
| ------------------ | ------ | --------------------------------------- | ---------------------------------- |
| `bead-worker`      | sonnet | Completes a single bead task            | Parallel task execution            |
| `bead-reviewer`    | sonnet | Reviews completed bead work (read-only) | After bead-worker completes        |
| `bead-coordinator` | haiku  | Monitors progress, suggests dispatches  | Long-running background monitoring |

### Bead-Worker Prompt Template

When dispatching a bead-worker, use this prompt structure:

```
You are a bead-worker agent. Complete the bead [ID] autonomously.

1. Query bead details: `bd show [ID]`
2. Update status: `bd update [ID] --status in_progress`
3. Write tests FIRST in src/__tests__/ for the feature
4. Implement the feature to make tests pass
5. Verify: `bun test && bun run typecheck && bun run lint`
6. Close with summary: `bd close [ID] -r "Brief summary of what was done"`

If you discover additional work needed, create new beads with:
`bd create "Description" -t task`

WAKE CONDITIONS (signal completion immediately):
- Task completed successfully
- Blocked by missing dependency or unclear requirements
- Critical cross-bead issue discovered
- Test failures that need human decision

IMPORTANT: You MUST call `bd close [ID]` when done - do not skip this step.
```

### Orchestration Pattern

1. **Start session**: Run `bd ready --json` to see available work
2. **Identify independent beads**: Check that beads don't modify the same files
3. **Dispatch workers**: Send bead-workers to independent beads using Task with `run_in_background: true`
4. **Monitor or continue**: Use TaskOutput to check progress, or continue with other work
5. **Handle wake-ups**: Workers signal on completion or blockers
6. **Review cycle**: Optionally dispatch bead-reviewer on completed work
7. **Sync before ending**: Run `bd sync && git push` to ensure all updates are committed

### Rules for Parallel Dispatch

- **File independence**: Only dispatch beads that don't modify the same files
- **Dependency check**: Run `bd dep tree <id>` to avoid dispatching blocked beads
- **Max concurrency**: Limit to 3-4 concurrent workers (context/resource limits)
- **Hash-based IDs**: bd uses hash IDs that handle concurrent updates safely
- **Flat delegation**: Keep main -> workers only (no workers spawning sub-workers)
- **Discovered work**: New beads filed by workers appear in `bd ready` automatically

### Ending a Parallel Session

Before ending any session with parallel workers:

1. Ensure all background workers have completed (use `TaskOutput` with `block: true`)
2. Run `bd sync` to flush all bead updates
3. Run `bd list --status in_progress` to verify no orphaned work
4. Commit and push any pending changes
5. Verify: `git status` should show clean working tree
