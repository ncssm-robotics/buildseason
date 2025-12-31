---
description: Agent army orchestration - status, deploy, and management (project)
argument-hint: <status|deploy|review|deploy-fixes|prepare-checkpoint|retro|prepare> [options]
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
| `retro`              | `/army retro <wave>`              | After-action review, create/update skills     |
| `prepare`            | `/army prepare <wave>`            | Forward-looking skill creation for next wave  |

## Complete Wave Workflow

```
Wave N Agents Complete
    ↓
/army review N              ← Code+Security parallel, then UI (foreground for Chrome MCP)
    ↓                          Each review creates beads with discovered-from link
Creates discovery beads (bugs, questions)
    ↓
/army deploy-fixes N        ← Fix P0-P1 issues (P2+ deferred with rationale)
    ↓
/army prepare-checkpoint N  ← Generate CP doc for human review
    ↓
Human Review
    │ - Reads CP doc
    │ - Tests locally (bun dev)
    │ - Adds feedback to CP doc "## Human Feedback" section
    ↓
/army process-feedback N    ← Convert human feedback → beads, fix P0-P1, update CP doc
    ↓
Human closes checkpoint when satisfied
    ↓
/army retro N               ← What worked/failed, create/update skills, add to CP doc
    ↓
/army prepare N+1           ← Forward-looking skills for next wave
    ↓
/army deploy N+1            ← Next wave unlocked
```

## Important Notes

1. **Compact before commands**: Run `/compact` before any `/army` subcommand to manage context
2. **UI Review runs in foreground**: Chrome MCP requires foreground execution
3. **CP doc tells the story**: Each checkpoint document captures the full wave narrative:
   - What was implemented
   - Issues found by reviews
   - Human feedback and how it was addressed
   - Retro learnings and skills created/updated/revised
4. **Nothing falls through cracks**: Every issue becomes a bead, every bead is either fixed or deferred with rationale

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

3. **Launch Code + Security reviews in PARALLEL (background):**

Use a SINGLE Task tool message with `run_in_background: true` for both:

#### Code Review Agent Prompt:

```
You are a CODE REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Audit code quality. DO NOT fix anything - create beads for issues found.

REQUIRED SKILL - Read this first for full guidance:
.claude/skills/code-review/SKILL.md (complete review checklist)

PROCESS:
1. Read the code-review skill - it contains the full checklist
2. Run `bun run typecheck` and `bun test`
3. Review code patterns, TypeScript quality, error handling
4. Check for code smells (large functions, duplication)
5. Create beads for each issue with `review:code` label

WHEN COMPLETE:
1. Close your review bead with full audit report
2. Report summary of issues created (P0-P4 breakdown)

REVIEW BEAD: <code-review-bead-id>
```

#### Security Review Agent Prompt:

```
You are a SECURITY REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Audit security. DO NOT fix anything - create beads for issues found.

REQUIRED SKILL - Read this first for full guidance:
.claude/skills/security-review/SKILL.md (complete OWASP checklist)

PROCESS:
1. Read the security-review skill - it contains the full OWASP Top 10 checklist
2. Review auth, input validation, data exposure, API security
3. Run `bun audit` for dependency vulnerabilities
4. Create beads for each issue with `review:security` label (P0-P2)

WHEN COMPLETE:
1. Close your review bead with full audit report
2. Report summary - ESPECIALLY note any P0/P1 security issues

REVIEW BEAD: <security-review-bead-id>
```

4. **Wait for Code + Security reviews to complete:**

```
Monitor with: /tasks
Or use TaskOutput tool to check status of background agents
```

When both are complete, proceed to UI review.

5. **Launch UI review in FOREGROUND (required for Chrome MCP):**

> **IMPORTANT:** UI review MUST run in foreground because Chrome MCP browser automation requires synchronous interaction. Do NOT use `run_in_background: true`.

#### UI/UX Review Agent Prompt:

```

You are a UI/UX REVIEW agent for BuildSeason Wave X.

YOUR ROLE: Visually verify UI using Chrome MCP. DO NOT fix - create beads for issues.

REQUIRED SKILLS - Read these first for full guidance:

1. .claude/skills/ui-design-review/SKILL.md (complete review checklist)
2. .claude/skills/brand-guidelines/SKILL.md (typography, colors, design)
3. .claude/skills/chrome-mcp-testing/SKILL.md (browser automation tools)

SPECS TO REFERENCE:

- docs/ui-refocus-spec.md (primary UI spec)
- docs/ui-ux-design-spec.md (design system)

PROCESS:

1. Read the skills above - they contain the full review checklists
2. Setup Chrome MCP (tabs_context_mcp, navigate to localhost:5173)
3. Follow the ui-design-review skill checklist systematically
4. Verify brand compliance per brand-guidelines skill
5. Test responsive layouts (mobile 375px, tablet 768px)

FOR EACH ISSUE FOUND:
bd create --title="UI: <issue>" --type=bug --priority=<1-3> \
 --label="discovered-from:<review-bead-id>" --label="review:ux"

Priority: P1=broken, P2=accessibility/brand, P3=polish

WHEN COMPLETE:
bd close <review-bead-id> --reason="Found N issues: X P1, Y P2, Z P3"

REVIEW BEAD: <ux-review-bead-id>

```

6. **Report review completion:**

```
============================================================
              WAVE X REVIEW COMPLETE
============================================================

Review Summary:
  1. Code Review     → <bead-id> [DONE]
  2. Security Review → <bead-id> [DONE]
  3. UI/UX Review    → <bead-id> [DONE]

Issues Found:
  Code:     X issues (P0: _, P1: _, P2+: _)
  Security: X issues (P0: _, P1: _, P2+: _)
  UI/UX:    X issues (P0: _, P1: _, P2+: _)

Next: /army deploy-fixes <wave>
============================================================
```

---

## SUBCOMMAND: deploy-fixes

**Usage:** `/army deploy-fixes <wave-number>`

### Purpose

Fix all issues discovered by reviews (except `human`-tagged questions).

### Instructions

1. **Find all discovered issues for this wave's checkpoint:**

```bash
bd list --label="discovered-from:buildseason-<checkpoint>" --status=open
```

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

## SUBCOMMAND: process-feedback

**Usage:** `/army process-feedback <wave-number>`

### Purpose

After human review of the checkpoint document, convert their feedback into beads, fix P0-P1 issues immediately, and update the CP doc to connect feedback to beads.

### Instructions

1. **Read the checkpoint summary with human feedback:**

```bash
cat docs/checkpoints/cp<N>-wave<W>-summary.md
```

Look for the "## Human Feedback" section that the human added.

2. **Parse each feedback item:**

For each piece of feedback in the Human Feedback section:

- Determine priority (P0-P4) based on urgency and impact
- Determine type (bug, feature, question, process)
- Extract file references if mentioned

3. **Create beads for each feedback item:**

```bash
bd create --title="<feedback summary>" --type=<bug|task|feature> --priority=<0-4> \
  --label="human-feedback" \
  --label="cp<N>-feedback" \
  --description="<full feedback details>

Source: CP<N> Human Feedback #<number>"
```

4. **Separate by priority:**

- **P0-P1**: Fix immediately in this command
- **P2+**: Defer to future waves (bead exists, rationale in CP doc)

5. **Fix P0-P1 issues:**

For each P0-P1 feedback item, either:

a) Fix directly if simple:

```bash
# Make the fix
git add -A
git commit -m "fix: <description>

Addresses human feedback #<N> from CP<W>
Closes: <bead-id>"
bd close <bead-id>
```

b) Launch fix agent if complex:

```
You are a FIX agent for BuildSeason.

BEAD: <bead-id>
ISSUE: <title>
SOURCE: Human feedback from Checkpoint N

FEEDBACK:
<full feedback text>

INSTRUCTIONS:
1. Understand what the human is asking for
2. Read relevant files
3. Implement the requested change
4. Verify: `bun run typecheck`
5. Commit with message referencing the feedback
6. Close the bead

CONSTRAINTS:
- Address EXACTLY what was requested
- Do not over-engineer or add unrelated changes
- If unclear, leave bead open with comment asking for clarification
```

6. **Update the checkpoint document:**

Add a new section connecting feedback to beads:

```markdown
## Feedback Resolution

| #   | Feedback  | Priority | Bead            | Status            |
| --- | --------- | -------- | --------------- | ----------------- |
| 1   | <summary> | P1       | buildseason-xyz | Fixed             |
| 2   | <summary> | P2       | buildseason-abc | Deferred (Wave 3) |
| 3   | <summary> | P1       | buildseason-def | Fixed             |

### P0-P1 Fixes Applied

#### Feedback #1: <title>

- **Bead:** buildseason-xyz
- **Fix:** <description of what was done>
- **Commit:** <hash>

#### Feedback #3: <title>

- **Bead:** buildseason-def
- **Fix:** <description of what was done>
- **Commit:** <hash>

### Deferred Items (P2+)

| Bead            | Feedback  | Rationale for Deferral   |
| --------------- | --------- | ------------------------ |
| buildseason-abc | <summary> | <why it's okay to defer> |
```

7. **Commit and sync:**

```bash
git add -A
git commit -m "chore: process human feedback for CP<N>

- Created X beads from feedback
- Fixed Y P0-P1 issues
- Deferred Z items to future waves

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
bd sync
git push
```

8. **Report completion:**

```
============================================================
         HUMAN FEEDBACK PROCESSED: CP<N>
============================================================

Feedback Items: X total
  P0-P1 (fixed): Y
  P2+ (deferred): Z

Beads Created:
  ✓ buildseason-xyz: <title> (P1, fixed)
  ✓ buildseason-abc: <title> (P2, deferred)
  ✓ buildseason-def: <title> (P1, fixed)

CP Doc Updated: docs/checkpoints/cp<N>-wave<W>-summary.md
  Added "Feedback Resolution" section

NEXT STEPS:
- Human reviews the updated CP doc
- When satisfied, human closes checkpoint: bd close <checkpoint-bead>
- Then: /army retro <wave>
============================================================
```

---

## SUBCOMMAND: retro

**Usage:** `/army retro <wave-number>`

### Purpose

After-action review for a completed wave. Analyze what went well/wrong and create/update skills to capture learnings.

### Instructions

1. **Create retro tracking bead:**

```bash
bd create --title="Wave X Retrospective" --type=task --priority=2 \
  --label="process-improvement"
```

Note the bead ID (e.g., `buildseason-xyz`).

2. **Gather inputs:**

```bash
# Review findings from this wave
bd list --label="review:code" --label="discovered-from:buildseason-<checkpoint>"
bd list --label="review:security" --label="discovered-from:buildseason-<checkpoint>"
bd list --label="review:ux" --label="discovered-from:buildseason-<checkpoint>"

# Check what was fixed vs remains open
bd list --label="review:code" --status=closed
bd list --label="review:security" --status=open

# Read the checkpoint summary
cat docs/checkpoints/cp<N>-wave<W>-summary.md
```

3. **Analyze patterns (use the skill-building skill for guidance):**

Read `.claude/skills/skill-building/SKILL.md` for skill creation patterns.

Ask these questions:

- What patterns led to issues being discovered?
- What knowledge was missing that caused bugs?
- Which anti-patterns keep recurring?
- What worked exceptionally well?
- What should be documented for future waves?

4. **Identify skill opportunities:**

| Pattern Observed           | Skill Action                               |
| -------------------------- | ------------------------------------------ |
| Same mistake repeated      | Create new skill with anti-pattern warning |
| Missing context            | Update existing skill with edge cases      |
| New technology used        | Create skill for that technology           |
| Review found common issues | Add to review checklist skills             |

5. **Create or update skills:**

For each learning, either:

- Create new skill in `.claude/skills/<name>/SKILL.md`
- Update existing skill with new learnings
- Add to review checklists in `code-review`, `security-review`, or `ui-design-review`

6. **Create process-improvement beads for larger changes:**

```bash
bd create --title="Skill: <name>" --type=task --priority=2 \
  --label="process-improvement" \
  --label="discovered-from:<retro-bead-id>" \
  --description="<what to create/update and why>"
```

7. **Generate retrospective document:**

Create file: `docs/checkpoints/wave<W>-retrospective.md`

```markdown
# Wave X Retrospective

**Date:** YYYY-MM-DD
**Wave:** X
**Duration:** <sessions/time>

## Summary

<Brief summary of wave outcomes>

## Metrics

| Metric              | Value |
| ------------------- | ----- |
| Issues reviewed     | X     |
| Issues fixed        | Y     |
| Issues deferred     | Z     |
| Questions for human | Q     |
| Skills created      | N     |
| Skills updated      | M     |

## What Went Well

### 1. <Topic>

<Details>

### 2. <Topic>

<Details>

## What Went Wrong

### 1. <Problem>

**Problem:** <description>
**Impact:** <what happened>
**Fix:** <how it was addressed>
**Skill created:** `<skill-name>` (if applicable)

### 2. <Problem>

...

## Skills Created

| Skill    | Purpose   | Lines |
| -------- | --------- | ----- |
| `<name>` | <purpose> | ~X    |

## Skills Updated

| Skill    | Changes          |
| -------- | ---------------- |
| `<name>` | <what was added> |

## Process Improvements

### Implemented

1. <change made>

### Future (Beads Created)

1. `<bead-id>` - <description>

## Recommendations for Next Wave

1. <recommendation>
2. <recommendation>
```

8. **Close retro bead and commit:**

```bash
bd close <retro-bead-id> --reason="Created X skills, updated Y skills, Z process improvements"
git add -A
git commit -m "docs: Wave X retrospective

- Created X new skills
- Updated Y existing skills
- Z process improvement beads

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
bd sync
git push
```

9. **Report completion:**

```
============================================================
              WAVE X RETROSPECTIVE COMPLETE
============================================================

Document: docs/checkpoints/waveX-retrospective.md

Skills Created: N
Skills Updated: M
Process Improvements: P

Key Learnings:
• <learning 1>
• <learning 2>
• <learning 3>

Next: /army prepare <next-wave>
============================================================
```

---

## SUBCOMMAND: prepare

**Usage:** `/army prepare <wave-number>`

### Purpose

Forward-looking skill creation. Analyze upcoming beads and preemptively create skills for anticipated patterns.

### Instructions

1. **Create prepare tracking bead:**

```bash
bd create --title="Wave X Preparation" --type=task --priority=2 \
  --label="process-improvement"
```

2. **Identify beads for the target wave:**

```bash
# Get all beads that will be worked in this wave
# Wave definitions from the deploy subcommand:
# Wave 1: b5u.1, il2.1
# Wave 2: b5u.2, b5u.3, il2.2, il2.3
# etc.

bd show buildseason-b5u.1
bd show buildseason-il2.1
# ... for each bead in the wave
```

3. **Analyze patterns in upcoming work:**

Look for:

- **Multiple beads touching same area** → Shared skill needed
- **New technology being introduced** → Research and document patterns
- **Complex integrations** → Create integration skill
- **UI-heavy work** → Ensure brand-guidelines is complete
- **API work** → Ensure api-patterns covers the cases

4. **Map beads to potential skills:**

| Bead  | Area        | Skill Needed           | Exists? |
| ----- | ----------- | ---------------------- | ------- |
| b5u.1 | Navigation  | `navigation-patterns`  | No      |
| il2.1 | Discord bot | `discord-bot-patterns` | No      |
| ...   | ...         | ...                    | ...     |

5. **For each missing skill, create it:**

Read `.claude/skills/skill-building/SKILL.md` for creation guidance.

```bash
# Research best practices
# Look at existing code patterns
# Check external documentation

# Create the skill
mkdir -p .claude/skills/<skill-name>
# Write SKILL.md with:
# - YAML frontmatter (name, description, allowed-tools)
# - Patterns and examples
# - Anti-patterns
# - Reference links
```

6. **Update CLAUDE.md skills table:**

Add new skills to the skills table in `CLAUDE.md`.

7. **Add skill references to bead descriptions (optional):**

If beads support a skills field, add references:

```bash
bd update <bead-id> --description="...

Skills to reference:
- navigation-patterns
- brand-guidelines"
```

8. **Close prepare bead and commit:**

```bash
bd close <prepare-bead-id> --reason="Created X skills for Wave Y"
git add -A
git commit -m "feat: prepare skills for Wave X

Created skills:
- <skill-1>
- <skill-2>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
bd sync
git push
```

9. **Report preparation:**

```
============================================================
              WAVE X PREPARATION COMPLETE
============================================================

Analyzed: N beads

Skills Created:
┌─────────────────────────────────────────────────────────┐
│ navigation-patterns                                      │
│ For: Sidebar restructure, route handling                │
│ File: .claude/skills/navigation-patterns/SKILL.md       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ discord-bot-patterns                                     │
│ For: GLaDOS Discord integration                         │
│ File: .claude/skills/discord-bot-patterns/SKILL.md      │
└─────────────────────────────────────────────────────────┘

Skills Updated: M
Beads Tagged: P

Ready to deploy: /army deploy <wave>
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
