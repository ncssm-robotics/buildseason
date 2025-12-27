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

1. **Pick a task:** `bd ready` to find unblocked work
2. **Claim it:** `bd update <id> --status in_progress`
3. **Do the work:** Write code, following existing patterns
4. **Verify:** `bun run typecheck && bun run lint && bun test` (all must pass)
5. **Complete:** `bd close <id> --reason "Brief summary"`

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
