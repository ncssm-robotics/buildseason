---
description: Agent army orchestration - status, deploy, and management (project)
argument-hint: <plan|status|deploy|review|retro|deploy-fixes|prepare-checkpoint> [options]
---

# Army Command

Thin orchestration for agent army parallel development. Delegates to army-process/\* skills.

## Subcommand Routing

Parse the first word of `$ARGUMENTS` to determine subcommand and delegate:

| Subcommand           | Skill Document                          |
| -------------------- | --------------------------------------- |
| `plan`               | `.claude/skills/army-process/plan.md`   |
| `deploy`             | `.claude/skills/army-process/deploy.md` |
| `review`             | `.claude/skills/army-process/review.md` |
| `retro`              | `.claude/skills/army-process/retro.md`  |
| `status`             | See Status section below                |
| `prepare-checkpoint` | `.claude/skills/army-process/review.md` |
| `process-feedback`   | `.claude/skills/army-process/review.md` |
| `deploy-fixes`       | `.claude/skills/army-process/deploy.md` |

## How to Execute

For the given subcommand:

1. Read the corresponding skill document from the table above
2. Follow its process exactly
3. Use any referenced scripts from `.claude/skills/army-process/scripts/`

This separation means:

- All prompts and processes are in skills (improvable via PDCA)
- Scripts handle repetitive automation
- This command stays stable while skills evolve

## Status Subcommand

Status doesn't need a full skill. Execute directly:

```bash
# Check checkpoint status
bd show buildseason-6ea | grep "Status:"   # CP1
bd show buildseason-2zlp | grep "Status:"  # CP2

# Get counts
bd list --status open | wc -l
bd list --status closed | wc -l
bd ready
bd blocked

# List worktrees
git worktree list
```

Display:

```
═══════════════════════════════════════════════════════════════
                    AGENT ARMY STATUS
═══════════════════════════════════════════════════════════════

Checkpoints:
  CP1 (6ea):  [STATUS]
  CP2 (2zlp): [STATUS]

Beads: X open | Y closed | Z ready | W blocked

Active Worktrees:
  [output of git worktree list]

Ready to work:
  [output of bd ready]

═══════════════════════════════════════════════════════════════
```

## PDCA Cycle Overview

```
/army plan N                ← Form wave, create skills, tag beads
    ↓
/army deploy N              ← Launch agents in worktrees
    ↓
Wave N Agents Complete
    ↓
/army review N              ← Automated + human checks
    ↓
/army deploy-fixes N        ← Fix P0-P1 issues
    ↓
/army prepare-checkpoint N  ← Generate checkpoint doc
    ↓
Human Review + Feedback
    ↓
/army process-feedback N    ← Convert feedback → beads
    ↓
Human closes checkpoint
    ↓
/army retro N               ← After-action, skill improvement
    ↓
/army plan N+1              ← Next cycle
```

## Reference Skills

For detailed process understanding, see:

| Skill            | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `army-process`   | Meta-skill overview of all sub-processes |
| `army-concepts`  | AO, AoI, boundaries, waves, sync matrix  |
| `skill-building` | How to create/update skills              |

## Reference: Label Conventions

| Label                       | Meaning                          |
| --------------------------- | -------------------------------- |
| `ao:<pattern>`              | Area of Operations file pattern  |
| `aoi:<pattern>`             | Area of Interest file pattern    |
| `skill:<name>`              | Skill(s) to use for this bead    |
| `wave:<N>`                  | Wave assignment                  |
| `mission:<id>`              | Mission grouping                 |
| `checkpoint`                | Marks a checkpoint bead          |
| `coordination-required`     | Needs cross-mission coordination |
| `main-effort`               | Priority mission for wave        |
| `discovered-from:<bead-id>` | Audit trail: source of this bead |
| `process-improvement:*`     | Created during plan or retro     |
| `model:opus\|sonnet\|haiku` | Model preference                 |

## Reference: Checkpoint Beads

| Checkpoint              | Bead ID          | After Wave | Blocks  |
| ----------------------- | ---------------- | ---------- | ------- |
| CP1: MVP Review         | buildseason-6ea  | 0          | Wave 1  |
| CP2: Navigation Review  | buildseason-2zlp | 1          | Wave 2  |
| CP3: Core UX Review     | buildseason-z942 | 2          | Wave 3  |
| CP4: Integration Review | buildseason-4a5n | 3          | Wave 4+ |

## Reference

- Full specification: `docs/army-command-spec.md`
- Concepts: `.claude/skills/army-concepts/SKILL.md`
- Process meta-skill: `.claude/skills/army-process/SKILL.md`

$ARGUMENTS
