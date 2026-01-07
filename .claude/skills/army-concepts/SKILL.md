---
name: army-concepts
description: >-
  Reference documentation for agent army orchestration concepts: Area of Operations (AO),
  Area of Interest (AoI), boundaries, synchronization matrix, waves, and checkpoints.
  Use when planning parallel agent work, defining mission boundaries, understanding
  deconfliction rules, or working with the /army command.
allowed-tools: Read, Grep, Glob
---

# Army Concepts Reference

Core concepts from U.S. Army battlespace management adapted for AI agent orchestration.

## Quick Reference

| Concept                | Definition                            | Agent Implementation                       |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| Area of Operations     | Territory you OWN and can modify      | Files/directories in your AO               |
| Area of Interest       | Territory that FOCUSES your context   | Files to prioritize reading                |
| Boundary               | Hard line around your AO              | Cannot modify outside without coordination |
| Wave                   | Phase line for timing                 | Group of parallel missions                 |
| Checkpoint             | Gate between waves                    | Human review before next wave              |
| Synchronization Matrix | File × Mission grid                   | Conflict detection before deploy           |
| Main Effort            | Priority mission when conflicts arise | Gets precedence in AO conflicts            |

## Area of Operations (AO)

**Definition:** Files and directories a mission OWNS. Full authority to modify.

```markdown
## Area of Operations

- apps/api/src/routes/auth/\*\*
- apps/api/src/routes/teams/\*\*
- drizzle/schema/users.ts
- drizzle/schema/teams.ts
```

**Rules:**

- Full authority within AO
- No coordination needed for modifications within AO
- AO should be EXCLUSIVE within a wave (overlap = merge complexity)
- Defined via `ao:<pattern>` labels or bead description

**Bead Label:** `ao:apps/api/src/routes/auth/**`

## Area of Interest (AoI)

**Definition:** Files that FOCUS the agent's attention and reduce context load. NOT a read restriction.

```markdown
## Area of Interest

- apps/api/src/lib/db.ts # Understand DB patterns
- apps/api/src/index.ts # See route registration
- drizzle/schema/index.ts # Reference schema exports
```

**Purpose:**

- Reduce context window usage by focusing attention
- Help agents understand relevant patterns and interfaces
- Guide initial exploration before starting work
- NOT a restriction on what can be read

**Rules:**

- Agent SHOULD prioritize reading AoI files for context
- Agent CAN read files outside AoI as needed
- Agent CANNOT modify files outside AO (restriction is on AO, not AoI)

**Bead Label:** `aoi:apps/api/src/lib/db.ts`

## Boundaries

**Definition:** The AO list defines the modification boundary.

**Agent Prompt Enforcement:**

```
BOUNDARY RULES:
- You may MODIFY any file in your AO
- You may READ any file (AoI focuses context, doesn't restrict reading)
- Do NOT modify files outside your AO
- If you need to modify a file outside your AO:
  1. STOP current work
  2. Create coordination bead:
     bd create --title="Coordination: need <file>" \
       --label="coordination-required" \
       --label="mission:<mission-id>"
  3. Continue with other work in your AO
  4. Note the dependency in your commit message
```

**Crossing a Boundary:**
When you must modify a file outside your AO:

1. Stop current work
2. Create a coordination bead
3. Continue with work that stays within your AO
4. Wait for clearance from wave-command

## Synchronization Matrix

**Definition:** A grid showing what every mission owns, revealing conflicts before deployment.

```
                      │ auth/** │ teams/** │ vendors/** │ shared/ui/** │
──────────────────────┼─────────┼──────────┼────────────┼──────────────│
Mission: Auth+Team    │   AO    │    AO    │     -      │     AoI      │
Mission: Vendors      │    -    │     -    │     AO     │     AoI      │
Mission: UI Polish    │    -    │     -    │     -      │      AO      │
```

**Conflict Detection:**

1. **AO-on-AO Conflict:** Two missions both have AO on same files
   - Must resolve before deploy
   - Options: Sequence, merge missions, or refactor file ownership

2. **AoI-on-AO Dependency:** Mission A has AoI on file Mission B owns
   - Planning decision point (not automatic constraint)
   - Options: Sequence, accept risk, or coordinate mid-wave

## Waves

**Definition:** All missions in Wave N should complete before Wave N+1 begins. Checkpoints are gates.

```
WAVE 0 ──────────────────────────────────────────────
   │
   ├── Mission: Auth+Team (AO: auth/**, teams/**)
   ├── Mission: Vendors (AO: vendors/**)
   ├── Mission: Parts/BOM (AO: parts/**)
   │
   ▼
══════════════════ CHECKPOINT 1 ═════════════════════
   │
   │  Human reviews, closes checkpoint
   │
   ▼
WAVE 1 ──────────────────────────────────────────────
   │
   ├── Mission: Navigation (AO: components/nav/**)
   ├── Mission: Discord Bot (AO: packages/bot/**)
   │
   ▼
══════════════════ CHECKPOINT 2 ═════════════════════
```

**Why Waves Work:**

- Within a wave: Missions run in isolated worktrees with non-overlapping AOs
- Between waves: Checkpoints ensure stability before new work begins

**Bead Label:** `wave:0`, `wave:1`

## Checkpoints

**Definition:** Gates between waves requiring human review.

**Purpose:**

- Human validates wave output
- Defects identified and prioritized
- Feedback converted to beads
- Decision to proceed to next wave

**Bead Label:** `checkpoint`

## Deconfliction Rules

1. **Exclusive AO Preferred:** No two missions in same wave should have overlapping AOs
2. **AoI is Focus, Not Restriction:** AoI helps agents focus but doesn't limit reading
3. **Main Effort Gets Priority:** When conflicts arise, main effort mission gets the file
4. **Boundary Crossings Create Beads:** Need a file outside AO? Create coordination bead
5. **Worktrees Provide Isolation:** Each mission runs in its own git worktree

## Main Effort

**Definition:** Priority mission for a wave. Gets precedence when conflicts arise.

**Uses:**

- AO conflicts default to main effort
- Resources prioritized to main effort
- Merge order: main effort typically merges last (gets final say)

**Bead Label:** `main-effort`

## Git Worktrees

**Definition:** Isolated git working directories per mission.

```bash
# Create worktree for mission
git worktree add ~/.claude-worktrees/project-auth -b mission/auth

# List active worktrees
git worktree list

# Remove after integration
git worktree remove ~/.claude-worktrees/project-auth
```

**Benefits:**

- True parallel execution (no file conflicts during work)
- Merge complexity concentrated at integration points
- Deterministic merge order (planned, not ad-hoc)

## Coordination Bead

**Definition:** Request to cross boundary into another mission's AO.

```bash
bd create --title="Coordination: need <file>" \
  --label="coordination-required" \
  --label="mission:<mission-id>"
```

**Lifecycle:**

1. Agent creates coordination bead
2. Wave-command monitors for coordination beads
3. When owner completes, clearance granted
4. Agent proceeds with modification
5. Audit trail recorded in bead

## PDCA Loop

The army command implements Plan-Do-Check-Act:

| Phase | Command      | Purpose                                 |
| ----- | ------------ | --------------------------------------- |
| Plan  | /army plan   | Form waves, skills audit, create skills |
| Do    | /army deploy | Launch agents in worktrees              |
| Check | /army review | Automated + human reviews               |
| Act   | /army retro  | Analyze trajectories, improve skills    |

## Label Quick Reference

```bash
# Territory
bd label <mission> ao:apps/api/src/routes/auth/**
bd label <mission> aoi:apps/api/src/lib/db.ts

# Wave and mission
bd label <bead> wave:0
bd label <bead> mission:auth
bd label <bead> main-effort

# Skills
bd label <bead> skill:api-crud

# Coordination
bd create --title="Coordination: need <file>" \
  --label="coordination-required" \
  --label="mission:auth"

# Audit trail
bd label <bead> discovered-from:xyz-123
bd label <bead> related-to:abc-456
```

## Reference

See: `docs/army-command-spec.md` for full specification.
