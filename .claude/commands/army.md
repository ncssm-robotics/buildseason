---
description: Agent army orchestration - status, deploy, and management
argument-hint: <status|deploy|review> [options]
---

# Army Command

Orchestrate the agent army for parallel development on BuildSeason.

## Subcommands

Parse the first word of `$ARGUMENTS` to determine subcommand:

| Subcommand | Usage                 | Description                                     |
| ---------- | --------------------- | ----------------------------------------------- |
| `status`   | `/army status`        | Show wave progress and checkpoint gates         |
| `deploy`   | `/army deploy <wave>` | Launch parallel agents for a wave               |
| `review`   | `/army review <wave>` | Review completed work before closing checkpoint |

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

### Instructions

1. **Check agent completion:**
   - Use `/tasks` or TaskOutput to check if all agents are done

2. **Show summary of changes:**

```bash
git status
git log --oneline -10
```

3. **List closed beads in wave:**
   - Check which beads in the wave are now closed

4. **Display review checklist:**

```
============================================================
              WAVE X REVIEW
============================================================

Agents Complete: Y/N

Changes Made:
  - <file1>: <summary>
  - <file2>: <summary>

Beads Closed:
  ✓ buildseason-xyz: <title>
  ✓ buildseason-abc: <title>
  ○ buildseason-def: Still open

------------------------------------------------------------
REVIEW CHECKLIST:
------------------------------------------------------------
[ ] Code compiles without errors
[ ] Tests pass (bun test)
[ ] UI renders correctly (bun dev)
[ ] Changes match spec requirements
[ ] No unintended side effects

------------------------------------------------------------
NEXT STEPS:
------------------------------------------------------------
If review passes:
  1. Merge feature branches to main
  2. Close checkpoint: bd close buildseason-<checkpoint-id>
  3. Deploy next wave: /army deploy <next-wave>

If issues found:
  1. Note specific problems
  2. Create fix beads or re-run agents
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

## Reference: Full Deployment Plan

See: `docs/agent-army-deployment.md`

$ARGUMENTS
