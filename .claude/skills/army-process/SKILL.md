---
name: army-process
description: >-
  Meta-skill for agent army orchestration processes. Contains plan, deploy, review,
  retro, and merge sub-processes. Use when running /army commands, coordinating
  parallel agents, managing waves, or improving the army process itself.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bd:*), Bash(git:*), Bash(mkdir:*)
---

# Army Process Meta-Skill

Core process skill for agent army orchestration. The `/army` command delegates to these sub-processes.

## Sub-Process Overview

| Sub-Process                     | File            | When to Use                             |
| ------------------------------- | --------------- | --------------------------------------- |
| [Plan](plan.md)                 | plan.md         | Before deployment, form waves           |
| [Deploy](deploy.md)             | deploy.md       | Launch agents in worktrees              |
| [Review](review.md)             | review.md       | After wave completes, before checkpoint |
| [Retro](retro.md)               | retro.md        | After checkpoint, process improvement   |
| [Merge](merge.md)               | merge.md        | Integrate worktrees deterministically   |
| [Coordination](coordination.md) | coordination.md | Handle cross-mission file requests      |

## Command Routing

When `/army <subcommand>` is invoked:

| Subcommand           | Delegate To            |
| -------------------- | ---------------------- |
| `plan`               | [plan.md](plan.md)     |
| `deploy`             | [deploy.md](deploy.md) |
| `review`             | [review.md](review.md) |
| `retro`              | [retro.md](retro.md)   |
| `status`             | See Status below       |
| `prepare-checkpoint` | [review.md](review.md) |
| `process-feedback`   | [review.md](review.md) |
| `deploy-fixes`       | [deploy.md](deploy.md) |

## Status Command

The status command doesn't need a full sub-process. It:

1. Queries checkpoint beads for current wave status
2. Counts open/closed beads per wave
3. Lists active worktrees
4. Shows ready and blocked beads

```bash
# Check checkpoint status
bd show buildseason-<checkpoint-id> | grep "Status:"

# Count beads
bd list --status open | wc -l
bd list --status closed | wc -l

# Check ready work
bd ready

# Check blocked work
bd blocked

# List worktrees
git worktree list
```

## PDCA Cycle

This skill implements Deming's Plan-Do-Check-Act cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PDCA CYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│   PLAN (/army plan)                                             │
│   ├── Form waves and missions from beads                        │
│   ├── Generate synchronization matrix                           │
│   ├── Analyze work requirements                                 │
│   ├── Conduct skills audit                                      │
│   ├── Create/update skills as needed                            │
│   └── Tag beads with skill labels                               │
│                                                                 │
│   DO (/army deploy)                                             │
│   ├── Create git worktrees for each mission                     │
│   ├── Launch agents with boundary enforcement                   │
│   └── Track progress via bead updates                           │
│                                                                 │
│   CHECK (/army review)                                          │
│   ├── Run automated reviews (code, security, UI)                │
│   ├── Create defect beads with discovered-from links            │
│   ├── Generate checkpoint document                              │
│   └── Human review and approval                                 │
│                                                                 │
│   ACT (/army retro)                                             │
│   ├── Analyze agent trajectories vs designated skills           │
│   ├── Identify skill improvement opportunities                  │
│   ├── Create process-improvement beads                          │
│   └── Optionally revert and retry for broken skills             │
└─────────────────────────────────────────────────────────────────┘
```

## Helper Scripts

Located in `scripts/`:

| Script                    | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `sync-matrix.sh`          | Generate File × Mission grid from beads    |
| `skill-audit.sh`          | Compare skill:\* labels vs existing skills |
| `merge-worktrees.sh`      | Execute ordered worktree integration       |
| `copy-worktreeinclude.sh` | Copy gitignored files to worktrees         |

## Workflow Overview

```
/army plan N                ← Form wave, create skills, tag beads
    ↓
/army deploy N              ← Launch agents in worktrees
    ↓
Wave N Agents Complete
    ↓
/army review N              ← Automated + human checks
    ↓
/army deploy-fixes N        ← Fix P0-P1 issues (optional)
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

## Key Concepts

For detailed concept documentation, see the [army-concepts](../army-concepts/SKILL.md) skill.

Quick reference:

- **AO (Area of Operations):** Files mission OWNS and can modify
- **AoI (Area of Interest):** Files that FOCUS agent's context
- **Boundary:** AO edge; don't modify outside without coordination
- **Wave:** Group of parallel missions
- **Checkpoint:** Human gate between waves
- **Sync Matrix:** File × Mission grid for conflict detection

## Data Model

All configuration via beads. Key labels:

| Label Pattern                      | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `ao:<glob-pattern>`                | Area of Operations               |
| `aoi:<glob-pattern>`               | Area of Interest                 |
| `skill:<skill-name>`               | Skills to use                    |
| `wave:<N>`                         | Wave assignment                  |
| `mission:<mission-id>`             | Mission grouping                 |
| `checkpoint`                       | Marks checkpoint bead            |
| `coordination-required`            | Needs cross-mission coordination |
| `main-effort`                      | Priority mission for wave        |
| `process-improvement:plan-wave-N`  | Created during planning          |
| `process-improvement:retro-wave-N` | Created during retro             |

## Templates

Located in `templates/`:

| Template           | Purpose                      |
| ------------------ | ---------------------------- |
| `mission-bead.md`  | Mission description template |
| `wave-bead.md`     | Wave plan with merge order   |
| `checkpoint.md`    | Checkpoint doc template      |
| `retro-summary.md` | Retro output template        |

## Reference

- Full specification: `docs/army-command-spec.md`
- Concepts: `army-concepts/SKILL.md`
- Skill building: `skill-building/SKILL.md`
