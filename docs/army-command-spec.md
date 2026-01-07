# Agent Army Command Specification

> "Every piece of terrain has exactly one owner. Ambiguity kills."

This specification defines the `/army` command for orchestrating parallel AI agent development, incorporating lessons from U.S. Army battlespace management doctrine.

**Plugin Dependency:** Requires [beads](https://github.com/caryden/beads) for issue tracking. All configuration is managed through beads metadata and labels.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Concepts](#core-concepts)
3. [The PDCA Loop](#the-pdca-loop)
4. [Git Worktrees for Isolation](#git-worktrees-for-isolation)
5. [Subcommand Reference](#subcommand-reference)
6. [Data Model](#data-model)
7. [Wave-Command Coordination](#wave-command-coordination)
8. [Migration Plan](#migration-plan)
9. [Plugin Packaging](#plugin-packaging)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Problem Statement

Multiple AI agents working in parallel will conflict if they touch the same files. Git merge conflicts are the agent equivalent of friendly fire—wasted effort, broken code, confused state. The current `/army` command handles wave deployment and review but lacks:

- Explicit territorial boundaries leading to scope creep
- Pre-deployment conflict detection and planning
- Process improvement loops (skills are created but not systematically improved)
- Isolation mechanisms for true parallel execution

### Solution

Adopt U.S. Army battlespace management principles combined with git worktrees for isolation:

| Army Concept            | Agent Implementation                                        |
| ----------------------- | ----------------------------------------------------------- |
| Area of Operations (AO) | Files a mission OWNS and can modify                         |
| Area of Interest (AoI)  | Files that FOCUS the agent's context (not a restriction)    |
| Boundaries              | Hard lines between missions; crossing requires coordination |
| Phase Lines             | Waves synchronized by checkpoints                           |
| Synchronization Matrix  | File × Mission grid showing ownership before deployment     |
| Worktrees               | Isolated git working directories per mission                |

### Expected Outcomes

- **Minimal merge conflicts** in parallel deployments (worktree isolation + AO planning)
- **Clear escalation path** when agents need files outside their AO
- **Pre-deployment validation** via synchronization matrix
- **Continuous process improvement** via PDCA loop and skill evolution
- **Reusable plugin** extractable for any project using beads

---

## Core Concepts

### Area of Operations (AO)

**Definition:** Files and directories a mission owns. Agents can freely modify anything in their AO. Within a wave, AOs should be exclusive to minimize merge complexity.

```markdown
# In bead description

## Area of Operations

- apps/api/src/routes/auth/\*\*
- apps/api/src/routes/teams/\*\*
- apps/web/src/features/auth/\*\*
- drizzle/schema/users.ts
- drizzle/schema/teams.ts
```

**Rules:**

- Agent has FULL authority within AO
- No coordination needed for modifications within AO
- AO should be EXCLUSIVE within a wave (overlap = future merge work)
- Defined via `ao:<pattern>` labels or bead description

### Area of Interest (AoI)

**Definition:** Files that help focus the agent's attention and reduce context load. This is NOT a read restriction—agents CAN read any file in the codebase. AoI narrows the agent's focus to relevant files.

```markdown
# In bead description

## Area of Interest

- apps/api/src/lib/db.ts # Understand DB patterns
- apps/api/src/index.ts # See route registration
- drizzle/schema/index.ts # Reference schema exports
```

**Purpose:**

- Reduce context window usage by focusing agent attention
- Help agents understand relevant patterns and interfaces
- Guide initial exploration before starting work
- NOT a restriction on what can be read

**Rules:**

- Agent SHOULD prioritize reading AoI files for context
- Agent CAN read files outside AoI as needed
- Agent CANNOT modify files outside AO (modification restriction is on AO, not AoI)

### Boundaries

**Definition:** The AO list defines the modification boundary. Agents don't modify outside their AO without explicit coordination.

**Agent Prompt Enforcement:**

```
BOUNDARY RULES:
- You may MODIFY any file in your AO
- You may READ any file (AoI focuses your context, not restricts reading)
- Do NOT modify files outside your AO
- If you need to modify a file outside your AO, STOP and create:
  bd create --title="Coordination: need to modify <file>" \
    --label="coordination-required"
```

### Waves as Phase Lines

**Definition:** All missions in Wave N should complete before Wave N+1 begins. Checkpoints are the gates.

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

**Why waves work:** Within a wave, missions run in isolated worktrees. Non-overlapping AOs mean minimal merge complexity when worktrees are integrated. Between waves, checkpoints ensure stability.

### Synchronization Matrix

**Definition:** A grid showing what every mission owns, revealing conflicts before deployment.

```
                      │ auth/** │ teams/** │ vendors/** │ parts/** │ shared/ui/** │
──────────────────────┼─────────┼──────────┼────────────┼──────────┼──────────────│
Mission: Auth+Team    │   AO    │    AO    │     -      │    -     │     AoI      │
Mission: Vendors      │    -    │     -    │     AO     │   AoI    │     AoI      │
Mission: Parts/BOM    │    -    │     -    │    AoI     │    AO    │     AoI      │
Mission: UI Polish    │    -    │     -    │     -      │    -     │      AO      │
```

**Conflict Detection:** If two missions both have `AO` in the same column, you have potential merge work. Plan subcommand flags these for resolution or sequencing.

### Deconfliction Rules

1. **Exclusive AO Preferred:** No two missions in the same wave should have overlapping AOs
2. **AoI is Focus, Not Restriction:** AoI helps agents focus but doesn't limit reading
3. **Main Effort Gets Priority:** When conflicts arise, main effort mission gets the file
4. **Boundary Crossings Create Beads:** Need a file outside AO? Create coordination bead
5. **Worktrees Provide Isolation:** Each mission runs in its own git worktree

---

## The PDCA Loop

The army command implements Deming's Plan-Do-Check-Act (PDCA) cycle for continuous improvement:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PDCA CYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PLAN (/army plan)                                             │
│   ├── Organize beads into waves/missions                        │
│   ├── Conduct skills audit (forward-looking)                    │
│   ├── Create skill:skill-builder beads for gaps                 │
│   └── Execute skill improvements before deploy                  │
│                                                                 │
│   DO (/army deploy)                                             │
│   ├── Launch agents in isolated worktrees                       │
│   ├── Each bead specifies skill: labels for "how"               │
│   └── Agents execute using designated skills                    │
│                                                                 │
│   CHECK (/army review)                                          │
│   ├── Automated reviews (code, security, UI)                    │
│   ├── Compare results against expectations                      │
│   ├── Open defect beads with discovered-from links              │
│   └── Human checkpoint review                                   │
│                                                                 │
│   ACT (/army retro)                                             │
│   ├── Analyze defects from this wave                            │
│   ├── Review agent trajectories vs designated skills            │
│   ├── Open process-improvement beads for skill updates          │
│   └── Feed learnings into next plan cycle                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bead Structure for PDCA

Each bead captures:

**WHAT (Goal):**

- Title: Clear statement of what needs to be done
- Description: Detailed requirements
- Success Criteria: How we know it's done (end state)

**HOW (Process):**

- `skill:<skill-name>` labels: Which skills the agent should use
- Multiple skills can be attached (e.g., `skill:api-crud`, `skill:drizzle-patterns`)

**EXPECTATIONS:**

- Priority and type labels
- Parent/child relationships for scope
- Dependencies for sequencing

```markdown
# Example bead description

## Goal

Implement team CRUD operations with role-based access.

## Success Criteria

- [ ] Teams can be created, read, updated, deleted
- [ ] Only team admins can modify team settings
- [ ] API returns proper error codes for unauthorized access
- [ ] Tests cover happy path and permission denied cases

## Area of Operations

- apps/api/src/routes/teams/\*\*
- apps/web/src/features/teams/\*\*
- drizzle/schema/teams.ts

## Area of Interest

- apps/api/src/lib/auth.ts
- drizzle/schema/users.ts
```

Labels: `skill:api-crud`, `skill:drizzle-patterns`, `skill:rbac-patterns`, `wave:0`, `ao:apps/api/src/routes/teams/**`

---

## Git Worktrees for Isolation

### Why Worktrees

Git worktrees enable parallel execution with file-level isolation:

- Each mission runs in its own working directory
- Same repository, shared history, independent file state
- No conflicts DURING execution
- Merge complexity concentrated at integration points

### Worktree Lifecycle

```
/army deploy N
    │
    ├── For each mission in wave:
    │   │
    │   ├── git worktree add ~/.claude-worktrees/<project>-<mission-id> -b <mission-branch>
    │   │
    │   ├── Copy .worktreeinclude files (.env, secrets, local config)
    │   │
    │   └── Launch agent in worktree directory
    │
    ▼
Agents work in parallel (isolated)
    │
    ▼
Wave complete
    │
    ├── For each mission:
    │   │
    │   ├── Agent commits to mission branch
    │   │
    │   └── git worktree remove (cleanup)
    │
    ▼
Integration phase
    │
    ├── Rebase mission branches onto main
    │
    ├── Resolve any conflicts (AO planning minimizes these)
    │
    └── Merge to main
```

### .worktreeinclude Pattern

Honor Claude Code Desktop's `.worktreeinclude` file for copying gitignored files to worktrees:

```text
# .worktreeinclude
.env
.env.local
.env.*
**/.claude/settings.local.json
```

Files matching BOTH `.worktreeinclude` AND `.gitignore` are copied when creating worktrees.

### Worktree Commands

```bash
# Create worktree for a mission
git worktree add ~/.claude-worktrees/myproject-auth -b mission/auth

# List active worktrees
git worktree list

# Clean up after integration
git worktree remove ~/.claude-worktrees/myproject-auth

# Prune stale worktree metadata
git worktree prune
```

---

## Subcommand Reference

### Workflow Overview

```
/army plan N                ← Organize beads, skills audit, build skills
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

### `/army plan <wave>`

**Purpose:** Forward-looking planning and proactive skill preparation.

**Steps:**

1. **Organize Beads into Wave:**
   - Query beads ready for this wave (via dependencies/labels)
   - Group into missions based on AO patterns
   - Create wave structure if not exists

2. **Generate Synchronization Matrix:**
   - Extract AO patterns from mission beads
   - Build File × Mission grid
   - Flag any AO overlaps for attention

3. **Conduct Skills Audit:**
   - For each bead in wave, check `skill:*` labels
   - Compare required skills against existing skills
   - Identify gaps (skills referenced but don't exist)
   - Identify update candidates (skills that may need revision based on recent changes)

4. **Create Skill Improvement Beads:**
   - For each gap or update candidate:
     ```bash
     bd create --title="Create/Update skill: <skill-name>" \
       --label="skill:skill-builder" \
       --label="process-improvement:plan-wave-N" \
       --description="..."
     ```
   - Link with `discovered-from` to the plan command run

5. **Execute Skill Building:**
   - Launch parallel agents to build/update skills
   - Wait for completion
   - Commit skill changes

6. **Output Ready State:**

   ```
   ═══════════════════════════════════════════════════════════════
                    WAVE N PLANNING COMPLETE
   ═══════════════════════════════════════════════════════════════

   Missions: 3
     • Auth+Team (AO: auth/**, teams/**)
     • Vendors (AO: vendors/**)
     • Parts/BOM (AO: parts/**)

   Synchronization Matrix:
   [matrix display]

   AO Conflicts: NONE ✓ (or list conflicts to resolve)

   Skills Audit:
     ✓ skill:api-crud (exists, current)
     ✓ skill:drizzle-patterns (exists, current)
     ⚡ skill:rbac-patterns (updated this planning cycle)
     ✓ skill:testing-patterns (exists, current)

   Ready to deploy: /army deploy N
   ═══════════════════════════════════════════════════════════════
   ```

### `/army status`

**Purpose:** Show wave progress and checkpoint gates.

**Output:**

- Current wave and checkpoint status
- Mission completion percentages
- Blocked/ready bead counts
- Active worktrees (if any)

### `/army deploy <wave>`

**Purpose:** Launch parallel agents in isolated worktrees.

**Steps:**

1. Verify checkpoint gate (previous wave checkpoint closed)
2. Create worktrees for each mission
3. Copy .worktreeinclude files
4. Launch agents with enhanced prompts including:
   - AO boundaries
   - AoI focus areas
   - Designated skills
   - Worktree-specific instructions
5. Wave-command (coordinator) monitors progress

**Agent Prompt Template:**

```markdown
You are an agent in the ${PROJECT_NAME} army.

MISSION: ${MISSION_NAME}
BEAD: ${BEAD_ID}
TASK: ${TASK_TITLE}
WORKTREE: ${WORKTREE_PATH}

## Area of Operations (you may modify)

${AO_LIST}

## Area of Interest (focus your context here)

${AOI_LIST}

## Skills to Use

${SKILL_LIST}

For each skill, read the skill documentation and follow its patterns.

## Boundary Rules

✓ Full authority to modify ANY file in your AO
✓ May read any file (AoI helps focus, doesn't restrict)
✗ Do NOT modify files outside your AO

If you need to modify a file outside your AO:

1. STOP current work
2. Create coordination bead:
   bd create --title="Coordination: need <file>" \
    --label="coordination-required" \
    --label="mission:${MISSION_ID}"
3. Continue with other aspects of your task
4. Note the dependency in your commit message

## Success Criteria

${SUCCESS_CRITERIA}

## Instructions

1. Read skill documentation for each skill: label
2. Read AoI files for context
3. Implement the required changes following skill patterns
4. Verify: ${VERIFY_COMMAND}
5. Commit with message referencing ${BEAD_ID}
6. Close bead: bd close ${BEAD_ID}
```

### `/army review <wave>`

**Purpose:** Automated reviews comparing results against expectations.

**Reviews:**

- **Code Review:** Pattern adherence, code quality
- **Security Review:** Vulnerability scan, auth checks
- **UI Review:** Visual regression, accessibility (requires foreground)

**Defect Handling:**

For each issue found:

```bash
bd create --title="<issue description>" \
  --priority=<P0-P4> \
  --label="review:code|security|ui" \
  --label="discovered-from:<review-bead>" \
  --label="related-to:<original-bead>"
```

This creates the audit trail for the retro.

### `/army deploy-fixes <wave>`

**Purpose:** Fix P0-P1 issues from review.

- Deploy agents to fix high-priority issues
- Lower priority issues remain for next plan cycle

### `/army prepare-checkpoint <wave>`

**Purpose:** Generate checkpoint document for human review.

Includes:

- Wave summary
- Completed beads
- Open issues by priority
- Boundary violations (if any)
- Review checklist

### `/army process-feedback <wave>`

**Purpose:** Convert human feedback into beads.

### `/army retro <wave>`

**Purpose:** After-action review with focus on process improvement.

**Steps:**

1. **Gather Defect Beads:**
   - Find all beads with `discovered-from` links to this wave's review
   - Group by original bead

2. **Analyze Agent Trajectories:**
   - For beads that generated defects:
     - What skills were designated (`skill:*` labels)?
     - What skills were actually used (from commits/comments)?
     - Did the agent follow the skill or deviate?

3. **Identify Skill Improvement Opportunities:**
   - Skill not followed → improve prompting or skill clarity
   - Skill followed but wrong result → improve skill content
   - Missing skill → flag for creation in next plan

4. **Create Process Improvement Beads:**

   ```bash
   bd create --title="Improve skill: <skill-name> - <issue>" \
     --label="process-improvement:retro-wave-N" \
     --label="skill:skill-builder" \
     --label="discovered-from:<defect-bead>" \
     --description="Agent was told to use skill:xxx but [didn't use it | used it incorrectly | skill was insufficient].

     Analysis:
     - Original bead: <bead-id>
     - Defect: <description>
     - Root cause: <analysis>

     Recommended fix:
     - [Update skill content | Improve skill prompting | Add examples]"
   ```

5. **Boundary Violation Analysis:**
   - For any `coordination-required` beads created during wave:
     - Was this a planning defect (should have been in AO)?
     - Was this unavoidable cross-cutting concern?
     - Create process improvement beads for planning skill updates

6. **Output Retro Summary:**

   ```
   ═══════════════════════════════════════════════════════════════
                    WAVE N RETROSPECTIVE
   ═══════════════════════════════════════════════════════════════

   Beads Completed: X
   Defects Found: Y (P0: a, P1: b, P2: c, P3: d)

   Defect Analysis:
     • skill:api-crud: 2 defects → prompting issue
     • skill:testing-patterns: 1 defect → skill content gap

   Boundary Violations: Z
     • 1 planning defect (should have expanded AO)
     • 2 legitimate cross-cutting (coordination worked)

   Process Improvement Beads Created: W
     • Improve skill:api-crud prompting
     • Add error handling examples to skill:testing-patterns
     • Update planning skill for AO estimation

   These improvements will be executed in: /army plan N+1
   ═══════════════════════════════════════════════════════════════
   ```

---

## Data Model

### Bead Labels

All configuration is through beads. No separate config file needed.

| Label Pattern                      | Purpose                                    |
| ---------------------------------- | ------------------------------------------ |
| `ao:<glob-pattern>`                | Area of Operations file pattern            |
| `aoi:<glob-pattern>`               | Area of Interest file pattern              |
| `skill:<skill-name>`               | Skill(s) to use for this bead              |
| `wave:<N>`                         | Wave assignment                            |
| `mission:<mission-id>`             | Mission grouping                           |
| `checkpoint`                       | Marks a checkpoint bead                    |
| `coordination-required`            | Needs cross-mission coordination           |
| `boundary-violation`               | Agent modified outside AO (for tracking)   |
| `main-effort`                      | Priority mission for this wave             |
| `process-improvement:plan-wave-N`  | Created during planning for skill work     |
| `process-improvement:retro-wave-N` | Created during retro for skill improvement |
| `skill:skill-builder`              | Bead is about creating/updating a skill    |
| `discovered-from:<bead-id>`        | Audit trail: where this bead came from     |
| `related-to:<bead-id>`             | Audit trail: what bead this relates to     |
| `model:opus\|sonnet\|haiku`        | Model preference for this bead             |

### Bead Description Structure

Mission beads should include structured sections:

```markdown
# Mission: Auth & Team Management

## Purpose

Enable multi-user team collaboration so teams can coordinate work.

## End State (Success Criteria)

- [ ] Users can create accounts
- [ ] Users can form teams
- [ ] Users can invite members
- [ ] Role-based permissions enforced

## Area of Operations

- apps/api/src/routes/auth/\*\*
- apps/api/src/routes/teams/\*\*
- apps/web/src/features/auth/\*\*
- drizzle/schema/users.ts
- drizzle/schema/teams.ts

## Area of Interest

- apps/api/src/lib/db.ts
- apps/api/src/lib/auth.ts

## Skills

Uses: skill:api-crud, skill:drizzle-patterns, skill:rbac-patterns
```

### Graph Structure

```
Wave 0 (label: wave:0)
│
├── Mission: Auth (bead with mission:auth, wave:0)
│   │   labels: [ao:apps/api/src/routes/auth/**, skill:api-crud]
│   │
│   ├── Task: Registration (child bead, inherits wave)
│   ├── Task: Team CRUD (child bead)
│   └── Task: Invites (child bead)
│
├── Mission: Vendors (bead with mission:vendors, wave:0)
│   │   labels: [ao:apps/api/src/routes/vendors/**]
│   │
│   └── Task: Vendor CRUD (child bead)
│
└── Checkpoint: CP1 (label: checkpoint)
        blocks: Wave 1 beads
```

---

## Wave-Command Coordination

During deployment, the orchestrating agent (wave-command) manages coordination requests.

### Coordination Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE-COMMAND COORDINATION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Mission A needs file outside AO                               │
│       │                                                         │
│       ├── Creates: bd create --title="Coordination: need X"     │
│       │            --label="coordination-required"              │
│       │            --label="mission:A"                          │
│       │            --label="blocks:current-task"                │
│       │                                                         │
│       └── Continues other work in AO                            │
│                                                                 │
│   Wave-Command monitors coordination beads                      │
│       │                                                         │
│       ├── Checks sync matrix: Who owns file X?                  │
│       │                                                         │
│       ├── If Mission B owns X:                                  │
│       │   │                                                     │
│       │   ├── Wait for Mission B to complete                    │
│       │   │                                                     │
│       │   ├── Add comment to coordination bead:                 │
│       │   │   "Cleared: Mission B complete. File X available.   │
│       │   │    If using worktrees, pull from mission/B branch." │
│       │   │                                                     │
│       │   └── Update bead status to unblock                     │
│       │                                                         │
│       └── If no mission owns X:                                 │
│           │                                                     │
│           └── Grant clearance immediately with audit comment    │
│                                                                 │
│   Mission A receives clearance                                  │
│       │                                                         │
│       ├── If worktree: git pull from completed mission branch   │
│       │                                                         │
│       └── Proceed with modification                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Audit Trail

Every coordination action is recorded in the bead:

```markdown
# Coordination Bead Comments

## Request (Mission A agent)

Need to modify `shared/api-client.ts` to add auth headers.
Currently owned by Mission B (Auth team).

## Clearance (Wave-Command)

Timestamp: 2025-01-06T15:30:00Z
Mission B completed at 15:28:00Z.
File `shared/api-client.ts` is now available.
If in worktree, run: `git fetch origin mission/B && git merge origin/mission/B`

## Completion (Mission A agent)

Modified file as needed. Committed in abc1234.
```

### Retro Treatment

Coordination requests are reviewed in retro:

- **Planning defect:** File should have been in Mission A's AO
  → Create process improvement bead for planning skill
- **Legitimate cross-cutting:** Coordination was necessary
  → No action, but track frequency for future planning

---

## Migration Plan

### Phase 1: Labels Setup

1. Add `wave:N` labels to existing beads
2. Add `ao:<pattern>` labels to mission beads
3. Add `skill:<name>` labels to task beads
4. No new commands yet

**Validation:** `bd list --label=wave:0` shows wave 0 beads

### Phase 2: Plan Subcommand

1. Implement `/army plan <wave>`
2. Parse AO labels from mission beads
3. Generate synchronization matrix
4. Add skills audit (gap detection only, no auto-creation)

**Validation:** `/army plan 1` shows matrix and skill gaps

### Phase 3: Skills Audit + Building

1. Add skill building to plan command
2. Create process-improvement beads automatically
3. Launch parallel skill-builder agents

**Validation:** Plan creates and executes skill improvement beads

### Phase 4: Worktree Integration

1. Update `/army deploy` to create worktrees
2. Honor `.worktreeinclude` patterns
3. Add worktree cleanup after integration

**Validation:** Agents run in isolated worktrees

### Phase 5: Enhanced Retro

1. Implement trajectory analysis
2. Create process-improvement beads from defects
3. Link to discovered-from and related-to

**Validation:** Retro produces actionable skill improvements

### Phase 6: Wave-Command Coordination

1. Implement coordination bead monitoring
2. Add clearance signaling
3. Create audit trail in beads

**Validation:** Coordination requests are handled with full audit trail

### Migration Checklist

```
[ ] Phase 1: Add wave:N labels to beads
[ ] Phase 1: Add ao:<pattern> labels to missions
[ ] Phase 1: Add skill:<name> labels to tasks
[ ] Phase 2: Implement /army plan with sync matrix
[ ] Phase 2: Add skills audit (gap detection)
[ ] Phase 3: Add skill building to plan
[ ] Phase 3: Launch parallel skill-builder agents
[ ] Phase 4: Create worktrees in deploy
[ ] Phase 4: Honor .worktreeinclude
[ ] Phase 4: Clean up worktrees after integration
[ ] Phase 5: Implement trajectory analysis in retro
[ ] Phase 5: Create process-improvement beads
[ ] Phase 5: Link discovered-from and related-to
[ ] Phase 6: Implement coordination monitoring
[ ] Phase 6: Add clearance signaling
[ ] Phase 6: Create audit trail
```

---

## Plugin Packaging

### Goal

Extract the `/army` command, related skills, and patterns into a standalone plugin that can be:

1. Published to a GitHub repository
2. Installed in any project using beads
3. Maintained independently

### Plugin Structure

```
claude-army-plugin/
├── plugin.yaml              # Plugin manifest
├── README.md                # Documentation
├── LICENSE                  # MIT
│
├── commands/
│   └── army.md              # Main /army command
│
├── skills/
│   ├── army-concepts/       # AO/AoI/Boundaries documentation
│   │   └── SKILL.md
│   ├── skill-builder/       # Meta-skill for creating skills
│   │   └── SKILL.md
│   ├── code-review/
│   │   └── SKILL.md
│   ├── security-review/
│   │   └── SKILL.md
│   └── ui-design-review/
│       └── SKILL.md
│
├── templates/
│   ├── mission-bead.md      # Mission description template
│   ├── checkpoint.md        # Checkpoint doc template
│   └── retro-summary.md     # Retro output template
│
└── docs/
    ├── getting-started.md
    ├── pdca-loop.md
    └── worktrees.md
```

### Plugin Manifest

```yaml
name: claude-army
version: "1.0.0"
description: >
  Agent army orchestration for parallel AI development.
  Implements PDCA loop with git worktree isolation.
  Based on U.S. Army battlespace management doctrine.

repository: https://github.com/your-org/claude-army-plugin
license: MIT

# Dependencies
requires:
  - beads # Issue tracking infrastructure

# Plugin capabilities
provides:
  commands:
    - army
  skills:
    - army-concepts
    - skill-builder
    - code-review
    - security-review
    - ui-design-review
```

### Installation

```bash
# From GitHub
claude plugins install github:your-org/claude-army-plugin

# Local development
git clone https://github.com/your-org/claude-army-plugin
claude plugins link ./claude-army-plugin
```

### Project Setup

After installation, projects configure via beads:

1. Create wave beads with `wave:N` labels
2. Create mission beads with `ao:<pattern>` labels
3. Create checkpoint beads with `checkpoint` label and blocking dependencies
4. Add `skill:<name>` labels to task beads

No separate configuration file needed—everything is in beads.

---

## Testing Strategy

### Unit Tests

| Test               | Description                        |
| ------------------ | ---------------------------------- |
| AO pattern parsing | Glob patterns extracted from beads |
| Conflict detection | Overlapping AOs flagged correctly  |
| Skills audit       | Gaps detected against skill labels |
| Worktree creation  | .worktreeinclude honored           |

### Integration Tests

| Test                 | Description                           |
| -------------------- | ------------------------------------- |
| Plan cycle           | Beads organized, skills audited       |
| Deploy with worktree | Agents launch in isolated directories |
| Coordination flow    | Bead created, clearance granted       |
| Retro analysis       | Defects linked to skill improvements  |

### Manual Scenarios

**Scenario 1: Clean Plan + Deploy**

```
Given: Wave 1 beads with non-overlapping AOs
When: /army plan 1
Then: Sync matrix clean, skills current
When: /army deploy 1
Then: Agents run in worktrees, complete successfully
```

**Scenario 2: Skills Gap Detection**

```
Given: Bead with skill:new-pattern label
And: skill:new-pattern does not exist
When: /army plan 1
Then: Gap detected, skill-builder bead created
And: Skill created before deploy allowed
```

**Scenario 3: Coordination Request**

```
Given: Mission A needs file owned by Mission B
When: Agent creates coordination bead
Then: Wave-command monitors bead
When: Mission B completes
Then: Clearance granted with audit trail
```

**Scenario 4: Retro Skill Improvement**

```
Given: Wave completed with defects
When: /army retro 1
Then: Defects analyzed for skill gaps
And: process-improvement beads created
And: Linked to discovered-from sources
```

---

## Appendix A: Army Doctrine Reference

| Army Term               | Definition                            | Agent Analog                   |
| ----------------------- | ------------------------------------- | ------------------------------ |
| AO (Area of Operations) | Geographic area assigned to commander | Files mission owns             |
| AoI (Area of Interest)  | Area that could affect operations     | Files that focus agent context |
| Boundary                | Line between units                    | AO pattern edge                |
| Phase Line              | Control measure for timing            | Wave checkpoint                |
| Main Effort             | Priority unit                         | Main effort mission            |
| Synchronization Matrix  | Time × Unit grid                      | File × Mission grid            |

## Appendix B: Label Quick Reference

```bash
# Territory labels
bd label <mission> ao:apps/api/src/routes/auth/**
bd label <mission> aoi:apps/api/src/lib/db.ts

# Wave and mission
bd label <bead> wave:0
bd label <bead> mission:auth

# Skills
bd label <bead> skill:api-crud
bd label <bead> skill:skill-builder

# Process improvement
bd label <bead> process-improvement:plan-wave-1
bd label <bead> process-improvement:retro-wave-0

# Audit trail
bd label <bead> discovered-from:xyz-123
bd label <bead> related-to:abc-456

# Coordination
bd create --title="Coordination: need <file>" \
  --label="coordination-required" \
  --label="mission:auth"

# Priority missions
bd label <mission> main-effort
```

## Appendix C: Worktree Quick Reference

```bash
# Create worktree for mission
git worktree add ~/.claude-worktrees/project-mission-auth -b mission/auth

# List active worktrees
git worktree list

# In worktree: pull from another mission's completed branch
git fetch origin mission/vendors
git merge origin/mission/vendors

# Remove worktree after integration
git worktree remove ~/.claude-worktrees/project-mission-auth

# Clean up stale metadata
git worktree prune
```

## Appendix D: Sources

- [Git Worktrees for Parallel AI Development](https://stevekinney.com/courses/ai-development/git-worktrees)
- [Using Git Worktrees for Concurrent Development](https://www.kenmuse.com/blog/using-git-worktrees-for-concurrent-development/)
- [Claude Code Desktop Worktrees](https://code.claude.com/docs/en/desktop)
