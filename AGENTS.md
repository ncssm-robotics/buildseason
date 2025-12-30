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
6. **CHECKPOINT:** Commit immediately after closing each bead (see below)

### Git Checkpoint Rule (MANDATORY)

**After each bead is verified and closed, immediately commit to git as a checkpoint.**

```bash
# After closing a bead
git add -A
git commit -m "Complete <bead-id>: <brief description>"
```

This creates recovery points. If something goes wrong later, you can revert to the last known-good state.

### Recovery from Mistakes

**If you get into a bad state, DO NOT thrash. Stop and recover:**

1. **Assess the damage:**
   ```bash
   git diff                    # See what changed
   git status                  # See untracked/modified files
   ```

2. **Revert to last checkpoint:**
   ```bash
   git checkout -- .           # Discard all uncommitted changes
   git clean -fd               # Remove untracked files/directories
   ```

3. **Start fresh from the last working state**

**NEVER** try to fix a mess by making more changes. Revert first, then proceed carefully.

### Beads-First Rule

- **NEVER** start coding without a bead to track the work
- If no bead exists, create one first: `bd create "Description" -t task`
- This ensures all work is tracked, discoverable, and can be parallelized
- Even small fixes should have beads - it takes 5 seconds to create one

### Verification-Required Rule (MANDATORY)

**You CANNOT close a bead without clear, unquestionable evidence of completion.**

#### Acceptable Verification Methods

| Method | When to Use | Evidence Required |
|--------|-------------|-------------------|
| **Unit tests passing** | API routes, utilities, business logic | `bun test` output showing relevant tests pass |
| **Playwright verification** | UI components, pages, forms | `browser_snapshot` or screenshot proving functionality |
| **Both** | Full-stack features | Tests + Playwright |

#### Verification Process

1. **Before starting**: Check if bead has verification criteria. If missing, add them:
   ```bash
   bd update <id> -d "Added verification: [describe how to verify]"
   ```

2. **After implementing**: Run verification and capture evidence:
   - For tests: Include test output in close reason
   - For UI: Take Playwright snapshot/screenshot

3. **When closing**: Include verification evidence in close reason:
   ```bash
   bd close <id> -r "Implemented X. Verified: bun test shows 5/5 tests passing for order routes"
   ```

### Spec Ambiguity Rule (MANDATORY)

**If the spec is ambiguous or contradictory, STOP and ask the user before writing code.**

This includes:
- Multiple valid approaches mentioned without a clear decision
- Contradictory requirements in different sections
- Missing details that affect implementation choices
- Any uncertainty about what "correct" means

**DO NOT:**
- Pick an approach and hope it's right
- "Validate" against an inconsistent spec
- Add features not explicitly specified
- Make design decisions without confirmation

**Example:** If the spec mentions "OAuth (Google, Discord) or email" in one place but only "GitHub and Google OAuth" in another, STOP and ask: "The spec has contradictory auth requirements. Which should I implement?"

#### When You Cannot Verify

If you cannot provide clear verification evidence:

1. **DO NOT close the bead**
2. Assign to human for verification:
   ```bash
   bd update <id> --labels human-verify -d "Implementation complete. Needs human verification because: [reason]"
   ```
3. Common reasons requiring human verification:
   - OAuth flows (need real credentials)
   - Visual design review
   - Performance/load testing
   - External service integrations

#### Well-Formed Beads

Every bead SHOULD include verification criteria in its description. When creating beads:

```bash
bd create "Add pagination to parts list" -t task -d "Add pagination controls to /teams/:id/parts.

Verification:
- Unit test: GET /api/teams/:id/parts?page=2&limit=10 returns correct slice
- Playwright: Navigate to parts page, verify pagination controls visible and functional"
```

If you encounter a bead without verification criteria, add them before starting work.

## Code Patterns

### Adding an API Route

API routes use the chained Hono pattern for RPC type inference:

```typescript
// apps/api/src/routes/api.tsx
const exampleRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const items = await db.query.items.findMany();
    return c.json(items);
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    // ... create item
    return c.json({ id: newId });
  });

// Compose into main apiRoutes
const apiRoutes = new Hono()
  .route("/api/example", exampleRoutes);

export type ApiRoutes = typeof apiRoutes;
```

### Adding a Frontend Route

Frontend uses TanStack Router with file-based routing:

```typescript
// apps/web/src/routes/example.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/example")({
  component: ExamplePage,
});

function ExamplePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["example"],
    queryFn: () => api.get("/api/example"),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
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
apps/api/src/
└── __tests__/           # Backend tests (Bun test runner)
    ├── unit/            # Pure function tests, no I/O
    ├── integration/     # Database and API tests
    └── fixtures/        # Test data factories

apps/web/src/
└── __tests__/           # Frontend tests (Vitest)
```

### Running Tests

```bash
bun run test             # Run all tests
bun run test:api         # Run API tests only
bun run test:web         # Run frontend tests only
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

### What to Test

| Layer      | What to Test     | Example                             |
| ---------- | ---------------- | ----------------------------------- |
| Utils      | Pure functions   | `formatCurrency(1234)` → `"$12.34"` |
| Schema     | Validation logic | Required fields, constraints        |
| Middleware | Auth, RBAC       | Redirect when unauthorized          |
| Routes     | HTTP behavior    | Status codes, response shape        |
| DB queries | Data integrity   | Relations, cascades                 |

### What NOT to Test

- shadcn/ui component internals
- Better-Auth internals
- Drizzle ORM internals
- Third-party API behavior

## UI Validation with Playwright

**All UI beads must be tested with Playwright before closing.**

The Playwright MCP server is available for browser automation. Use it to validate UI changes actually work in the browser.

### When to Use Playwright

- Any bead that adds/modifies UI components
- Form submissions and validation
- Navigation flows
- React component interactions
- Visual layout verification

### Playwright Testing Checklist

Before closing a UI bead:

1. Navigate to the affected page(s)
2. Verify elements render correctly (`browser_snapshot`)
3. Test interactive elements (clicks, form fills)
4. Verify navigation works as expected
5. Check for console errors (`browser_console_messages`)

### Example Workflow

```
# Navigate to the page
browser_navigate -> http://localhost:5173/teams/xxx/parts

# Take accessibility snapshot (better than screenshot for verification)
browser_snapshot

# Test form interaction
browser_click -> "Add Part" button
browser_fill_form -> fill part details
browser_click -> Submit

# Verify success
browser_snapshot -> confirm redirect/success message
```

### Authentication Note

Playwright runs in its own browser context without your session cookies. For testing authenticated routes:

- Public routes can be tested directly
- Protected routes will redirect to login (this verifies auth middleware works)
- For full authenticated testing, log in via the OAuth flow in the Playwright browser first

### Playwright Tools Available

| Tool                       | Use For                            |
| -------------------------- | ---------------------------------- |
| `browser_navigate`         | Go to URL                          |
| `browser_snapshot`         | Get accessibility tree (preferred) |
| `browser_take_screenshot`  | Visual screenshot                  |
| `browser_click`            | Click elements                     |
| `browser_type`             | Type text                          |
| `browser_fill_form`        | Fill multiple form fields          |
| `browser_select_option`    | Select dropdown options            |
| `browser_console_messages` | Check for JS errors                |

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
- XSS prevention in React components
- API endpoint authorization
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
- apps/api/src/routes/api.tsx
- apps/api/src/middleware/auth.ts
- apps/web/src/lib/api.ts
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
2. Check verification criteria - if missing, add them before starting
3. Update status: `bd update [ID] --status in_progress`
4. Write tests FIRST in apps/api/src/__tests__/ for API features
5. Implement the feature to make tests pass
6. Verify with EVIDENCE:
   - For API/logic: `bun test` must pass, include output
   - For UI: Use Playwright browser_snapshot to verify
7. Close ONLY with verification evidence:
   `bd close [ID] -r "Summary. VERIFIED: [test output or Playwright evidence]"`

VERIFICATION IS MANDATORY:
- You CANNOT close a bead without clear evidence of completion
- If you cannot verify (OAuth, external services, visual design), DO NOT close:
  `bd update [ID] --labels human-verify -d "Needs human verification: [reason]"`

If you discover additional work needed, create new beads with:
`bd create "Description" -t task`

WAKE CONDITIONS (signal completion immediately):
- Task completed successfully WITH verification evidence
- Blocked by missing dependency or unclear requirements
- Cannot verify - needs human
- Test failures that need human decision

IMPORTANT: Never close without verification. Unverified closes waste human time.
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
