# Wave 0 Retrospective

**Date:** 2025-12-31
**Wave:** 0 (MVP Foundation)
**Duration:** ~2 sessions

## Summary

Wave 0 established the MVP foundation including sidebar navigation, robots page, and security middleware. The wave exposed several process gaps that led to the creation of the skill-based learning system.

## Metrics

| Metric              | Value                           |
| ------------------- | ------------------------------- |
| Issues reviewed     | 26                              |
| Issues fixed        | 14                              |
| Issues deferred     | 11                              |
| Questions for human | 1                               |
| Skills created      | 10                              |
| AGENTS.md reduction | 767 → 157 lines (79% reduction) |

## What Went Well

### 1. Parallel Review Pattern

Running code, security, and UI/UX reviews in parallel was effective. Each caught different issue types:

- Code review: API response patterns, test configuration
- Security review: Rate limiting, CORS configuration
- UI/UX review: Sidebar structure, accessibility gaps

### 2. Chrome MCP for UI Verification

Using Chrome MCP to actually navigate pages caught real bugs:

- Robots page crash (`seasons?.find is not a function`)
- Dev mode serving stale production build

### 3. Checkpoint Documentation

`cp1-wave0-summary.md` provided clear visibility into wave status, making handoff between sessions smooth.

## What Went Wrong

### 1. UI/UX "Review" Was Just Code Review

**Problem:** Initial UI/UX review only analyzed code, didn't actually render pages.

**Impact:** Real runtime errors weren't caught until manual Chrome MCP verification.

**Fix:** Updated army skill to require Chrome MCP visual verification for UI/UX reviews.

**Skill created:** `chrome-mcp-testing`

### 2. API Response Shape Mismatch

**Problem:** Frontend assumed raw array, API returned wrapped object.

**Pattern:**

```typescript
// API returned: { seasons: [...], activeSeasonId: "..." }
// Frontend expected: [...]
```

**Impact:** Page crash at runtime, not caught by TypeScript.

**Fix:** Added explicit type for API response, extract and map in frontend.

**Skill created:** `api-response-patterns`

### 3. Dev Mode Serving Production Build

**Problem:** API server served stale `dist/web` even when `NODE_ENV=development`.

**Impact:** User confusion when OAuth redirected to port 3000 showing old UI.

**Fix:** Check `isDevelopment` before enabling static file serving.

**Skill created:** `dev-mode-patterns`

### 4. AGENTS.md Bloat

**Problem:** AGENTS.md had grown to 767 lines, loading all context on every turn.

**Impact:** Context waste, important rules buried in noise.

**Fix:** Extracted domain expertise into 10 focused skills that load on-demand.

**Skill created:** `skill-building` (meta-skill for creating skills)

## Skills Created

### From AGENTS.md Extraction (8 skills)

| Skill                | Purpose                      | Lines Extracted |
| -------------------- | ---------------------------- | --------------- |
| `bead-workflow`      | Issue tracking, verification | ~140            |
| `api-patterns`       | Hono routes, DB queries      | ~65             |
| `testing-guide`      | Test philosophy, patterns    | ~65             |
| `chrome-mcp-testing` | UI validation workflow       | ~70             |
| `code-review`        | Security/code audit patterns | ~155            |
| `session-completion` | Handoff protocol             | ~30             |
| `parallel-execution` | Multi-agent coordination     | ~115            |
| `skill-building`     | Creating new skills          | ~350            |

### From Wave 0 Learnings (2 skills)

| Skill                   | Trigger                          | Pattern Captured                 |
| ----------------------- | -------------------------------- | -------------------------------- |
| `api-response-patterns` | API responses, data fetching     | Wrapped responses, field mapping |
| `dev-mode-patterns`     | Dev server issues, port problems | Dev vs prod mode, OAuth redirect |

## Process Improvements

### Implemented

1. **Chrome MCP required for UI/UX reviews** - Updated army skill
2. **Skill-based learning** - Created `.claude/skills/` directory structure
3. **Lean AGENTS.md** - Core context only, skills load on-demand

### Future (Beads Created)

1. `buildseason-6j56` - `/army retro` subcommand for automated retrospectives
2. `buildseason-w9fa` - `/army prepare` for forward-looking skill creation
3. `buildseason-el8f` - Skills field in bead templates

## Questions Pending Human Decision

### Vendors Scope (buildseason-kn8r)

**Question:** Should sidebar Vendors link go to global `/vendors` or team-scoped `/team/.../vendors`?

**Options:**

1. Keep global vendors directory, add team preferences
2. Move vendors entirely under team context
3. Both: global for browsing, team-scoped for favorites

**To resolve:** Update bead with decision, remove `human` label.

## Recommendations for Wave 1

1. **Start with a checkpoint** - Run `/army retro` (when implemented) to capture learnings
2. **Forward-skill creation** - Before starting work, identify anticipated patterns and pre-create skills
3. **Chrome MCP from start** - Don't wait for review phase to verify UI
4. **Type both ends** - Define API response types AND component types, map explicitly

## Files Changed This Wave

### New Skills (10 files)

```
.claude/skills/
├── skill-building/SKILL.md
├── bead-workflow/SKILL.md
├── api-patterns/SKILL.md
├── testing-guide/SKILL.md
├── chrome-mcp-testing/SKILL.md
├── code-review/SKILL.md
├── session-completion/SKILL.md
├── parallel-execution/SKILL.md
├── api-response-patterns/SKILL.md
└── dev-mode-patterns/SKILL.md
```

### Modified

- `AGENTS.md` - Reduced from 767 to 157 lines
- `.claude/commands/army.md` - Added Chrome MCP requirement
- `docs/agent-army-deployment.md` - Added continuous learning loop
- `apps/web/src/routes/team/$program/$number/robots/index.tsx` - Fixed seasons fetch
- `apps/api/src/index.tsx` - Fixed dev mode detection

## Commits

```
f4c62b9 feat: add skill-building meta-skill
dc0fcd5 fix(docs): correct skills location to .claude/skills/
c4f659a docs: add continuous learning loop to agent army deployment
59cc2d8 docs: require Chrome MCP for UI/UX reviews in army skill
2ddd0aa fix: resolve robots page crash and dev mode port confusion
c967743 feat: extract AGENTS.md into focused skills
```
