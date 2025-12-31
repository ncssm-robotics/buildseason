---
name: code-review
description: >-
  Code quality review checklists and audit patterns.
  Use when conducting code reviews, auditing patterns,
  checking test coverage, or assessing code health.
allowed-tools: Read, Glob, Grep, Bash(bd:*), Bash(git:*), Bash(bun:*)
---

# Code Review Guide

Structured approach to code quality audits.

## Related Skills

- **security-review** - Security audits (separate from code quality)
- **testing-guide** - Test philosophy and patterns
- **api-patterns** - API route patterns

## Review Philosophy

**Code reviews are discovery tasks, not fix-everything tasks.**

- Audit against code quality checklist
- Create beads for each finding with priority
- Use `review:code` label for traceability
- Close review with full audit report

## Priority Guide

| Priority | Criteria                            | Examples                         |
| -------- | ----------------------------------- | -------------------------------- |
| P0       | Build broken, tests failing         | TypeScript errors, test failures |
| P1       | Type errors, missing error handling | `any` abuse, unhandled promises  |
| P2       | Code smells, missing tests          | Duplication, no coverage         |
| P3       | Style issues, minor improvements    | Naming, formatting               |
| P4       | Nice-to-haves                       | Performance micro-optimizations  |

## Code Quality Checklist

### 1. Build & Tests

```markdown
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes (if tests exist)
- [ ] Critical paths have test coverage
- [ ] No skipped tests without reason
```

### 2. TypeScript Quality

```markdown
- [ ] No `any` type abuse (use `unknown` or proper types)
- [ ] Interfaces defined for API responses
- [ ] Props typed for React components
- [ ] Return types explicit on public functions
- [ ] No type assertions without justification (`as`)
```

### 3. Error Handling

```markdown
- [ ] Async operations have try/catch or .catch()
- [ ] Errors logged with context
- [ ] User-facing errors are helpful
- [ ] Loading states handled
- [ ] Empty states handled
```

### 4. Code Patterns

```markdown
- [ ] Consistent with existing codebase patterns
- [ ] Following project conventions
- [ ] No dead code or unused imports
- [ ] TODO/FIXME comments have associated beads
- [ ] No console.log debugging left behind
```

### 5. Code Smells

```markdown
- [ ] Functions under 50 lines (prefer smaller)
- [ ] No deeply nested conditionals (max 3 levels)
- [ ] No duplicated logic (DRY)
- [ ] Single responsibility per function/component
- [ ] Clear naming (no abbreviations without context)
```

### 6. React-Specific

```markdown
- [ ] Hooks follow rules (no conditional hooks)
- [ ] useEffect has proper dependency arrays
- [ ] Memoization used appropriately (not everywhere)
- [ ] Keys provided for list items
- [ ] No prop drilling (consider context for deep trees)
```

### 7. Performance

```markdown
- [ ] No N+1 query patterns
- [ ] Pagination for large datasets
- [ ] Images optimized
- [ ] No unnecessary re-renders
- [ ] Lazy loading where appropriate
```

## Creating Findings

For each code quality issue:

```bash
bd create --title="<specific issue>" --type=bug --priority=<0-4> \
  --label="review:code" --label="discovered-from:<review-bead-id>"
```

Example findings:

```bash
# P1: Type error
bd create --title="Fix: Remove any type from OrderService" --type=bug --priority=1 \
  --label="review:code"

# P2: Missing tests
bd create --title="Add tests for parts CRUD operations" --type=task --priority=2 \
  --label="review:code"

# P3: Code smell
bd create --title="Refactor: Extract duplicate validation logic" --type=task --priority=3 \
  --label="review:code"
```

## Audit Report Format

Include in close reason:

```markdown
## Code Quality Audit: [area]

Date: YYYY-MM-DD

## Commands Run

- `bun run typecheck`: PASS/FAIL
- `bun test`: PASS/FAIL (X tests, Y failures)

## Files Reviewed

- apps/web/src/routes/team/...
- apps/api/src/routes/...
  [list all]

## Checklist Results

### TypeScript Quality

- Result: PASS / X ISSUES
- Notes: [details]

### Error Handling

- Result: PASS / X ISSUES
  [continue for each section]

## Summary

- Total checks: X
- Passed: X
- Issues found: X (P0: X, P1: X, P2: X, P3: X)

## Created Beads

- buildseason-xxx: [issue] (P1)
- buildseason-yyy: [issue] (P2)
  [list all]
```

## Review Template

Create a code review bead:

```bash
bd create --title="Code review: [area]" --type=task --priority=2 \
  --label="model:opus" --label="review:code" \
  --description="Code quality audit of [area]. Create beads for findings.

Run first:
- bun run typecheck
- bun test

Areas to check:
- TypeScript quality
- Error handling
- Code patterns
- Code smells

Close with full audit report."
```

## When to Schedule Code Reviews

- After major refactoring
- Before releases
- When code coverage drops
- Every ~15-20 feature beads
- After adding new contributors

## Query Past Reviews

```bash
# Find past code reviews
bd list --label="review:code" --status=closed

# See audit report
bd show <review-id>  # Close reason contains full report

# Find issues from specific review
bd list --label="discovered-from:<review-id>"
```
