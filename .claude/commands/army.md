---
description: Agent army orchestration - status, deploy, and management (project)
argument-hint: <status|deploy|review|deploy-fixes|prepare-checkpoint> [options]
---

# Army Command

Orchestrate the agent army for parallel development on BuildSeason.

## Subcommands

Parse the first word of `$ARGUMENTS` to determine subcommand:

| Subcommand           | Usage                             | Description                                   |
| -------------------- | --------------------------------- | --------------------------------------------- |
| `status`             | `/army status`                    | Show wave progress and checkpoint gates       |
| `deploy`             | `/army deploy <wave>`             | Launch parallel agents for a wave             |
| `review`             | `/army review <wave>`             | Run automated reviews (code, security, UI/UX) |
| `deploy-fixes`       | `/army deploy-fixes <wave>`       | Fix issues discovered by reviews              |
| `prepare-checkpoint` | `/army prepare-checkpoint <wave>` | Generate checkpoint summary for human review  |

## Complete Wave Workflow

```
Wave N Complete
    ↓
/army review N           ← 3 parallel review agents
    ↓
Creates discovery beads (bugs, questions)
    ↓
/army deploy-fixes N     ← fix discovered issues
    ↓
/army prepare-checkpoint N  ← generate summary
    ↓
Human Review (you close checkpoint when satisfied)
    ↓
/army deploy N+1         ← next wave unlocked
```

---

## SUBCOMMAND: status

**Usage:** `/army status [--ready|--blocked|--wave N]`

### Instructions

1. **Gather checkpoint status:**

```bash
bd show buildseason-6ea | grep "Status:"   # CP1
bd show buildseason-2zlp | grep "Status:"  # CP2
bd show buildseason-z942 | grep "Status:"  # CP3
bd show buildseason-4a5n | grep "Status:"  # CP4
```

2. **Get issue counts:**

```bash
bd list --status open | wc -l
bd list --status closed | wc -l
bd ready
bd blocked
```

3. **Check Wave 0 epic progress** (for each epic, count children and closed children):
   - `buildseason-8o9` (UI Framework)
   - `buildseason-5pw` (Auth & Team)
   - `buildseason-ck0` (Vendor Directory)
   - `buildseason-03y` (BOM)
   - `buildseason-8mf` (Robots & Seasons)

4. **Display formatted report:**

```
============================================================
                    AGENT ARMY STATUS
============================================================

WAVE 0: Foundation
  ├─ UI Framework (8o9)               [██████████] 100% ✓
  ├─ Auth & Team (5pw)                [████████░░] 83%
  ├─ Vendor Directory (ck0)           [██████░░░░] 67%
  ├─ BOM (03y)                        [███░░░░░░░] 33%
  └─ Robots & Seasons (8mf)           [░░░░░░░░░░] 0%

------------------------------------------------------------
CHECKPOINT 1: MVP Review              [PENDING] ⏳
  Bead: buildseason-6ea | Blocks: Wave 1
------------------------------------------------------------

WAVE 1: Navigation + Discord          [BLOCKED]
WAVE 2: Dashboard + Calendar          [BLOCKED]
WAVE 3: Robots + Integrations         [BLOCKED]
WAVE 4+: Expansion Phases             [BLOCKED]

============================================================
SUMMARY: X open | Y closed | Z ready to work
Next: Complete Wave 0, then close CP1 (buildseason-6ea)
============================================================

READY TO WORK:
[output of bd ready]
```

---

## SUBCOMMAND: deploy

**Usage:** `/army deploy <wave-number> [--dry-run]`

### Wave Definitions

| Wave | Beads                                       | Checkpoint Required |
| ---- | ------------------------------------------- | ------------------- |
| 0    | 8o9._, 5pw._, ck0._, 03y._, 8mf.\* children | None                |
| 1    | b5u.1, il2.1                                | CP1 (6ea) closed    |
| 2    | b5u.2, b5u.3, il2.2, il2.3                  | CP2 (2zlp) closed   |
| 3    | b5u.4, kue, 84j, il2.4                      | CP3 (z942) closed   |
| 4    | b5u.5-7, il2.5-6                            | CP4 (4a5n) closed   |

### Instructions

1. **Parse wave number** from arguments

2. **Check checkpoint gate:**
   - If wave > 0, verify required checkpoint is closed
   - If blocked, show error and exit

3. **Identify beads for wave:**
   - Get all beads in the wave
   - Filter out already-closed beads
   - Check for model labels (model:opus, model:sonnet, model:haiku)

4. **Display deployment plan:**

```
============================================================
              ARMY DEPLOYMENT: WAVE X
============================================================

Checkpoint: [SATISFIED] ✓

Deploying N agents in parallel:

┌─────────────────────────────────────────────────────────┐
│ AGENT 1: buildseason-xyz                                │
│ Task: <title>                                           │
│ Model: sonnet                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ AGENT 2: buildseason-abc                                │
│ Task: <title>                                           │
│ Model: sonnet                                           │
└─────────────────────────────────────────────────────────┘
```

5. **If --dry-run, stop here.**

6. **Launch parallel agents:**

Use the Task tool to launch ALL agents in a SINGLE message (critical for true parallelism).

For each bead, create a Task with:

- `subagent_type`: "general-purpose"
- `run_in_background`: true
- `prompt`: Include bead ID, title, full description, and instructions:

```
You are an agent in the BuildSeason army, working on:

BEAD: <bead-id>
TASK: <title>

DESCRIPTION:
<full description from bead>

INSTRUCTIONS:
1. First, read any files mentioned in the description
2. Read relevant spec docs (docs/ui-refocus-spec.md, etc.)
3. Implement the required changes
4. Verify your changes compile: run `bun run typecheck`
5. Commit with message:
   feat(<area>): <short description>

   <longer description if needed>

   Closes: <bead-id>

6. When complete, mark the bead closed: bd close <bead-id>

CONSTRAINTS:
- Only modify files related to this task
- Follow existing code patterns
- Do not push to remote (human will review first)

ERROR HANDLING (CRITICAL):
- If typecheck or any verification fails, READ THE ERROR OUTPUT carefully
- DO NOT retry the same command more than 2 times without making changes
- If you see unused variable warnings, fix them (remove the variable or use it)
- If you see type errors, analyze and fix the specific issue
- If stuck after 3 attempts on the same error, STOP and leave a comment in the commit:
  "Blocked: <describe the error you couldn't resolve>"
- Never loop infinitely on verification steps

SCOPE MANAGEMENT:
- If the task requires more than 5-6 files, focus on the core functionality first
- Prefer working code over complete code - commit what works
- If blocked on one part, complete other parts and note what's incomplete
```

7. **Report deployment:**

```
============================================================
              DEPLOYMENT COMPLETE
============================================================

Launched: N agents

Monitor: /army status
Check agents: /tasks

When complete, run: /army review <wave>
============================================================
```

---

## SUBCOMMAND: review

**Usage:** `/army review <wave-number>`

### Purpose

Launch 3 parallel review agents to audit the wave's implementation:

1. **Code Review** - quality, patterns, tests, coverage, TODOs
2. **Security Review** - auth, validation, injection, secrets
3. **UI/UX Review** - spec compliance, accessibility, consistency

Reviews DO NOT fix code. They create discovery beads for issues found.

### Instructions

1. **Determine checkpoint bead for this wave:**

| Wave | Checkpoint Bead  |
| ---- | ---------------- |
| 0    | buildseason-6ea  |
| 1    | buildseason-2zlp |
| 2    | buildseason-z942 |
| 3    | buildseason-4a5n |

2. **Create review tracking beads:**

```bash
bd create --title="Wave X Code Review" --type=task --priority=1 --parent=<checkpoint-bead>
bd create --title="Wave X Security Review" --type=task --priority=1 --parent=<checkpoint-bead>
bd create --title="Wave X UI/UX Review" --type=task --priority=1 --parent=<checkpoint-bead>
```

Note the bead IDs created (e.g., `buildseason-abc`, `buildseason-def`, `buildseason-ghi`).

3. **Launch 3 review agents in parallel** using a SINGLE Task tool message:

#### Code Review Agent Prompt:

````
You are a CODE REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Audit code quality. DO NOT fix anything - create beads for issues found.

REVIEW CHECKLIST:
1. Run `bun run typecheck` - note any errors
2. Run `bun test` if tests exist - note failures
3. Check test coverage: are critical paths tested?
4. Review code patterns:
   - Consistent error handling?
   - Proper TypeScript types (no `any` abuse)?
   - Following existing patterns in codebase?
   - Dead code or unused imports?
   - TODO/FIXME comments that need addressing?
5. Check for code smells:
   - Functions over 50 lines?
   - Deeply nested conditionals?
   - Duplicated logic?

FOR EACH ISSUE FOUND, create a bead:
```bash
bd create --title="<specific issue>" --type=bug --priority=<0-4> --label="discovered-from:<review-bead-id>" --label="review:code"
````

Priority guide:

- P0: Build broken, tests failing
- P1: Type errors, missing error handling
- P2: Code smells, missing tests
- P3: Style issues, minor improvements
- P4: Nice-to-haves

If you find ambiguity needing human decision:

```bash
bd create --title="Question: <specific question>" --type=task --priority=2 --label="human" --label="discovered-from:<review-bead-id>"
```

WHEN COMPLETE:

1. Close your review bead: `bd close <review-bead-id> --reason="Found N issues"`
2. Report summary of issues created

REVIEW BEAD: <code-review-bead-id>

```

#### Security Review Agent Prompt:

```

You are a SECURITY REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Audit security. DO NOT fix anything - create beads for issues found.

REVIEW CHECKLIST:

1. Authentication & Authorization:
   - Are API routes properly protected?
   - Are user permissions checked before actions?
   - Is session handling secure?

2. Input Validation:
   - User inputs sanitized?
   - SQL injection possible? (check raw queries)
   - XSS vulnerabilities? (check rendered user content)
   - Path traversal possible?

3. Data Exposure:
   - Sensitive data in logs?
   - Secrets in code? (API keys, passwords)
   - PII exposed in API responses?
   - Proper data filtering for user context?

4. API Security:
   - Rate limiting in place?
   - CORS configured properly?
   - Proper HTTP methods used?

5. Dependencies:
   - Run `bun audit` if available
   - Check for known vulnerable packages

FOR EACH ISSUE FOUND, create a bead:

```bash
bd create --title="SECURITY: <specific issue>" --type=bug --priority=<0-2> --label="discovered-from:<review-bead-id>" --label="review:security"
```

Security issues should generally be P0-P2:

- P0: Active vulnerability, data exposure
- P1: Missing auth check, injection possible
- P2: Hardening needed, best practice violation

If you find ambiguity needing human decision:

```bash
bd create --title="Question: <security question>" --type=task --priority=1 --label="human" --label="discovered-from:<review-bead-id>"
```

WHEN COMPLETE:

1. Close your review bead: `bd close <review-bead-id> --reason="Found N issues"`
2. Report summary - ESPECIALLY note any P0/P1 security issues

REVIEW BEAD: <security-review-bead-id>

```

#### UI/UX Review Agent Prompt:

```

You are a UI/UX REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Visually verify UI implementation using Chrome MCP browser automation. DO NOT fix anything - create beads for issues found.

⚠️ CRITICAL: This is a VISUAL review, not a code review. You MUST:

1. Use Chrome MCP tools to navigate to each page
2. Take screenshots to verify actual rendered UI
3. Test interactions (clicks, form inputs, navigation)
4. Check responsive behavior by resizing the browser

SETUP:

1. Ensure dev server is running at http://localhost:5173
2. Get tab context: mcp**claude-in-chrome**tabs_context_mcp
3. Create or use existing tab for testing

SPECS TO REFERENCE:

- docs/ui-refocus-spec.md (primary UI spec)
- docs/ui-ux-design-spec.md (design system)
- Individual bead descriptions for feature requirements

VISUAL REVIEW CHECKLIST:

1. Navigation & Routes:
   - Navigate to each page via sidebar links
   - Verify all sidebar links work (no 404s)
   - Check breadcrumbs show correct path
   - Test browser back/forward behavior

2. Page Content:
   - Screenshot each page and verify against spec
   - Check headers, labels, and copy match spec
   - Verify data displays correctly (or appropriate empty states)
   - Confirm CTAs and buttons are present and labeled correctly

3. Interactions:
   - Click buttons and verify responses
   - Test form inputs and validation
   - Check dropdowns, modals, and dialogs work
   - Verify loading states appear during async operations

4. Visual Design:
   - Colors match theme (dark mode if applicable)
   - Spacing and alignment look correct
   - Typography is readable and hierarchical
   - Icons are present and meaningful

5. Accessibility (visual checks):
   - Focus indicators visible when tabbing
   - Text has sufficient contrast
   - Interactive elements are clearly clickable
   - Error messages are visible and helpful

6. Responsive (resize browser):
   - Use mcp**claude-in-chrome**resize_window to test breakpoints
   - Check mobile layout (375px width)
   - Check tablet layout (768px width)
   - Verify no horizontal scroll or overflow issues

7. Error Scenarios:
   - Test invalid routes (should show 404 or redirect)
   - Check behavior when logged out
   - Verify error states display properly

FOR EACH ISSUE FOUND, create a bead:

```bash
bd create --title="UI: <specific issue>" --type=bug --priority=<1-3> --label="discovered-from:<review-bead-id>" --label="review:ux"
```

Priority guide:

- P1: Spec violation, broken functionality
- P2: Accessibility issue, inconsistency
- P3: Polish, minor improvements

If spec is ambiguous or conflicts with implementation:

```bash
bd create --title="Question: <UI/UX question>" --type=task --priority=2 --label="human" --label="discovered-from:<review-bead-id>"
```

WHEN COMPLETE:

1. Close your review bead: `bd close <review-bead-id> --reason="Found N issues"`
2. Report summary of issues created

REVIEW BEAD: <ux-review-bead-id>

```

4. **Report review launch:**

```

============================================================
WAVE X REVIEW LAUNCHED
============================================================

Review Agents Deployed:

1. Code Review → <bead-id>
2. Security Review → <bead-id>
3. UI/UX Review → <bead-id>

Monitor progress: /tasks

# When all 3 complete, run: /army deploy-fixes <wave>

````

---

## SUBCOMMAND: deploy-fixes

**Usage:** `/army deploy-fixes <wave-number>`

### Purpose

Fix all issues discovered by reviews (except `human`-tagged questions).

### Instructions

1. **Find all discovered issues for this wave's checkpoint:**

```bash
bd list --label="discovered-from:buildseason-<checkpoint>" --status=open
````

Also check for issues with `review:code`, `review:security`, `review:ux` labels.

2. **Separate fixable vs questions:**

- **Fixable**: No `human` label - deploy agents to fix
- **Questions**: Has `human` label - leave for human, will be in checkpoint summary

3. **Check if any issues exist:**

If no fixable issues:

```
============================================================
              NO FIXES NEEDED
============================================================

Review found 0 fixable issues.
Questions for human: X (will appear in checkpoint summary)

Next: /army prepare-checkpoint <wave>
============================================================
```

4. **Deploy fix agents in parallel:**

For each fixable issue, launch an agent:

```
You are a FIX agent for BuildSeason.

BEAD: <bead-id>
ISSUE: <title>
DISCOVERED BY: <review type>

DESCRIPTION:
<full description if any>

INSTRUCTIONS:
1. Read the relevant files
2. Fix the specific issue described
3. Verify fix: `bun run typecheck`
4. Commit with message:
   fix(<area>): <description>

   Fixes: <bead-id>
   Discovered-by: <review-bead-id>

5. Close the bead: `bd close <bead-id>`

CONSTRAINTS:
- Fix ONLY this specific issue
- Do not refactor unrelated code
- Do not introduce new features
- If fix is unclear, add comment to bead and leave open
```

5. **Report deployment:**

```
============================================================
              FIX DEPLOYMENT: WAVE X
============================================================

Deployed: N fix agents
Questions for human: M (not fixing, need input)

Monitor: /tasks

When complete, run: /army prepare-checkpoint <wave>
============================================================
```

---

## SUBCOMMAND: prepare-checkpoint

**Usage:** `/army prepare-checkpoint <wave-number>`

### Purpose

Generate a markdown summary for human review and update the checkpoint bead.

### Instructions

1. **Gather review results:**

```bash
# Get review beads and their close reasons
bd show <code-review-bead>
bd show <security-review-bead>
bd show <ux-review-bead>

# Count fixed vs remaining issues
bd list --label="review:code" --status=closed | wc -l
bd list --label="review:code" --status=open | wc -l
# Repeat for security, ux

# Get human questions
bd list --label="human" --status=open
```

2. **Check test status:**

```bash
bun run typecheck
bun test 2>&1 | tail -20
```

3. **Get git summary:**

```bash
git log --oneline -20
git diff --stat HEAD~20
```

4. **Generate checkpoint summary markdown:**

Create file: `docs/checkpoints/cp<N>-wave<W>-summary.md`

```markdown
# Checkpoint <N>: Wave <W> Review Summary

Generated: <timestamp>

## Review Results

| Review Type | Issues Found | Fixed | Remaining | Questions |
| ----------- | ------------ | ----- | --------- | --------- |
| Code        | X            | Y     | Z         | Q         |
| Security    | X            | Y     | Z         | Q         |
| UI/UX       | X            | Y     | Z         | Q         |
| **Total**   | X            | Y     | Z         | Q         |

## Security Findings

> **Note**: Security issues are highlighted for visibility. Review these to identify patterns that may need standing instruction updates.

| Issue         | Priority | Status | Bead            |
| ------------- | -------- | ------ | --------------- |
| <description> | P1       | Fixed  | buildseason-xyz |
| <description> | P0       | Fixed  | buildseason-abc |

## Questions Requiring Human Input

The following items need your decision before proceeding:

### 1. <Question title> (buildseason-xyz)

<Question details from bead description>

**To resolve**: Update the bead with your decision and remove the `human` label.

### 2. <Question title> (buildseason-abc)

...

## Unfixed Issues (Deferred)

These issues were identified but not fixed (P3-P4 or blocked):

| Issue   | Priority | Reason       | Bead            |
| ------- | -------- | ------------ | --------------- |
| <title> | P4       | Low priority | buildseason-xyz |

## Key Changes Made

Summary of significant changes in this wave:

- **<Area>**: <Description of changes>
- **<Area>**: <Description of changes>

## Test Status
```

Typecheck: PASS/FAIL
Tests: X passing, Y failing
Coverage: Z% (if available)

```

## Files Changed

<output of git diff --stat>

## Human Review Checklist

- [ ] Review security findings above
- [ ] Answer questions in "Questions Requiring Human Input"
- [ ] Run `bun dev` and test core flows
- [ ] Check mobile responsive behavior
- [ ] Verify any auth changes work correctly

## Next Steps

When satisfied:
1. Answer any questions (update beads, remove `human` label)
2. Close checkpoint: `bd close buildseason-<checkpoint-id>`
3. Deploy next wave: `/army deploy <next-wave>`
```

5. **Update checkpoint bead with summary link:**

```bash
bd comment <checkpoint-bead> "Review summary generated: docs/checkpoints/cp<N>-wave<W>-summary.md"
```

6. **Commit, sync, and push:**

```bash
git add -A
git commit -m "chore: prepare checkpoint N for human review

- Generated review summary: docs/checkpoints/cpN-waveW-summary.md
- Code review: X issues found, Y fixed
- Security review: X issues found, Y fixed
- UI/UX review: X issues found, Y fixed

Ready for human review."

bd sync
git push
```

7. **Start dev servers for human review:**

```bash
# Start in background so human can test immediately
cd /Users/caryden/github/buildseason && bun dev
```

Note: Run dev server in background or inform human to start it.

8. **Report completion:**

```
============================================================
         CHECKPOINT PREPARED FOR HUMAN REVIEW
============================================================

Summary: docs/checkpoints/cp<N>-wave<W>-summary.md

Review Results:
  Code:     X found, Y fixed, Z remaining
  Security: X found, Y fixed, Z remaining
  UI/UX:    X found, Y fixed, Z remaining

Questions for you: N items need your input
  → See "Questions Requiring Human Input" section

NEXT STEPS:
1. Read the summary document
2. Answer any questions (update beads, remove 'human' label)
3. When satisfied: bd close <checkpoint-bead>
4. Then: /army deploy <next-wave>
============================================================
```

---

## Reference: Checkpoint Beads

| Checkpoint              | Bead ID          | After Wave | Blocks  |
| ----------------------- | ---------------- | ---------- | ------- |
| CP1: MVP Review         | buildseason-6ea  | 0          | Wave 1  |
| CP2: Navigation Review  | buildseason-2zlp | 1          | Wave 2  |
| CP3: Core UX Review     | buildseason-z942 | 2          | Wave 3  |
| CP4: Integration Review | buildseason-4a5n | 3          | Wave 4+ |

---

## Reference: Label Conventions

| Label                       | Meaning                             |
| --------------------------- | ----------------------------------- |
| `discovered-from:<bead-id>` | Issue was found by this review bead |
| `review:code`               | Found during code review            |
| `review:security`           | Found during security review        |
| `review:ux`                 | Found during UI/UX review           |
| `human`                     | Needs human decision/clarification  |
| `model:opus`                | Use Opus model for this task        |
| `model:sonnet`              | Use Sonnet model for this task      |
| `model:haiku`               | Use Haiku model for this task       |

---

## Reference: Full Deployment Plan

See: `docs/agent-army-deployment.md`

$ARGUMENTS
