# Battlespace Management for Agent Orchestration

> "Every piece of terrain has exactly one owner. Ambiguity kills."

---

## The Problem

Multiple agents working in parallel will conflict if they touch the same files. Git merge conflicts are the agent equivalent of friendly fire — wasted effort, broken code, confused state.

The Army solved this decades ago. They coordinate thousands of soldiers maneuvering simultaneously without shooting each other. The solution: **clear boundaries, explicit ownership, and synchronization**.

---

## Core Concepts

### Area of Operations (AO)

**Army**: Geographic area assigned to a commander. They have full authority within it. No coordination needed for actions inside their AO.

**Agents**: Files and directories a mission owns. Agents can freely modify anything in their AO. No merge conflicts possible because no other mission touches these files.

```yaml
mission: auth-team
area_of_operations:
  - apps/api/src/routes/auth/**
  - apps/api/src/routes/teams/**
  - apps/web/src/features/auth/**
  - apps/web/src/features/teams/**
  - drizzle/schema/users.ts
  - drizzle/schema/teams.ts
```

### Area of Interest (AI)

**Army**: Larger area that could affect your operations. You monitor it but don't control it. Actions here require coordination.

**Agents**: Files a mission reads but doesn't modify. You depend on these files but don't own them. If you need to change something in your AI, you must coordinate with whoever owns it.

```yaml
mission: auth-team
area_of_interest:
  - apps/api/src/lib/db.ts # Read for DB connection
  - apps/api/src/index.ts # Read for route registration
  - drizzle/schema/index.ts # Read for schema imports
```

### Boundaries

**Army**: Hard lines between units. You don't cross into another unit's AO without explicit coordination. Crossing a boundary without permission risks fratricide.

**Agents**: The explicit file list defines the boundary. Agent prompts include:

```
BOUNDARY RULES:
- You may MODIFY any file in your AO
- You may READ files in your AI but NOT modify them
- Files outside both lists are OFF LIMITS
- If you need a file outside your AO, STOP and create:
  bd create --title="Coordination: need to modify <file>" \
    --label="coordination-required"
```

### No-Fire Areas

**Army**: Protected zones where nobody can shoot, even if enemies are there. Used to protect civilians, friendly forces, or sensitive sites.

**Agents**: Protected files that no mission can modify without explicit approval:

```yaml
protected_files: # No-Fire Areas
  - package.json
  - bun.lock
  - drizzle/schema/index.ts
  - apps/api/src/index.ts
  - .env.example
```

These files affect everyone. Changes require human coordination or a dedicated infrastructure mission.

---

## The Synchronization Matrix

Before the Army executes an operation, they build a **synchronization matrix** — a grid showing what every unit is doing and where, across time. This reveals conflicts before they happen.

### For Agents: File × Mission Matrix

Before deploying a wave, generate a matrix showing which missions touch which files:

```
                      │ auth/** │ teams/** │ vendors/** │ parts/** │ shared/ui/** │
──────────────────────┼─────────┼──────────┼────────────┼──────────┼──────────────│
Mission: Auth+Team    │   AO    │    AO    │     -      │    -     │      AI      │
Mission: Vendors      │    -    │     -    │     AO     │    AI    │      AI      │
Mission: Parts/BOM    │    -    │     -    │     AI     │    AO    │      AI      │
Mission: UI Polish    │    -    │     -    │     -      │    -     │      AO      │
```

**Conflict detection**: If two missions both have `AO` in the same column, you have a conflict. Resolve before deploying:

1. **Sequence**: One mission completes before the other starts
2. **Merge**: Combine into a single mission
3. **Refactor**: Split the contested files so each mission gets a piece

---

## Waves as Phase Lines

**Army**: Phase lines are control measures that synchronize timing. Units don't cross a phase line until ordered. This prevents units from getting ahead of each other and creating gaps or conflicts.

**Agents**: Waves are phase lines. All missions in Wave N must complete before Wave N+1 begins. Checkpoints are the gates.

```
WAVE 0 ──────────────────────────────────────────────────────
   │
   ├── Mission: Auth+Team (AO: auth/**, teams/**)
   ├── Mission: Vendors (AO: vendors/**)
   ├── Mission: Parts/BOM (AO: parts/**)
   │
   ▼
═══════════════════ CHECKPOINT 1 ═══════════════════════════
   │
   │  Human reviews, answers questions, closes CP1
   │
   ▼
WAVE 1 ──────────────────────────────────────────────────────
   │
   ├── Mission: Navigation (AO: components/nav/**)
   ├── Mission: Discord Bot (AO: packages/bot/**)
   │
   ▼
═══════════════════ CHECKPOINT 2 ═══════════════════════════
```

**Why waves work**: Within a wave, missions have non-overlapping AOs — they can run in parallel safely. Between waves, the checkpoint ensures the codebase is stable before new work begins.

---

## Mission Definition Structure

Each mission (an epic bead) should define:

```yaml
mission:
  id: buildseason-5pw
  name: "Auth & Team Management"
  wave: 0

  # WHY this mission exists (enables initiative)
  purpose: |
    Enable multi-user team collaboration so robotics teams
    can coordinate parts ordering and robot builds.

  # WHAT success looks like (commander's intent)
  end_state: |
    Users can create accounts, form teams, invite members,
    and manage roles. All auth flows work on mobile and desktop.

  # Files this mission OWNS
  area_of_operations:
    - apps/api/src/routes/auth/**
    - apps/api/src/routes/teams/**
    - apps/web/src/features/auth/**
    - apps/web/src/features/teams/**
    - drizzle/schema/users.ts
    - drizzle/schema/teams.ts

  # Files this mission READS
  area_of_interest:
    - apps/api/src/lib/db.ts
    - apps/api/src/lib/auth.ts
    - drizzle/schema/index.ts

  # Child beads (tasks)
  tasks:
    - buildseason-5pw.1 # User registration
    - buildseason-5pw.2 # Team CRUD
    - buildseason-5pw.3 # Invite flow
    - buildseason-5pw.4 # Role management

  # Missions that cannot run in parallel (AO conflicts)
  conflicts: []

  # Missions that must complete first
  dependencies: []
```

---

## Deconfliction Rules

### Rule 1: Exclusive AO

No two missions in the same wave can have overlapping AOs. The synchronization matrix makes this visible.

### Rule 2: AI is Read-Only

Files in your Area of Interest can be read but never modified. If you must modify, request coordination.

### Rule 3: Protected Files Require Coordination

No-fire areas (package.json, schema index, etc.) require human approval or a dedicated infrastructure mission.

### Rule 4: Main Effort Gets Priority

When two missions discover they both need a file, the **main effort** mission gets it. Supporting missions work around it or wait. (Define main effort per wave based on business priority.)

### Rule 5: Boundary Crossings Create Beads

If an agent needs to modify a file outside its AO:

```bash
bd create --title="Coordination: Auth mission needs to modify shared/api-client.ts" \
  --type=task \
  --label="coordination-required" \
  --label="blocks:current-task" \
  --description="Auth mission discovered it needs to add auth headers to the shared API client.

  Options:
  1. Expand Auth AO to include this file
  2. Create separate task for API client owner
  3. Defer to next wave"
```

---

## Implementing in `/army`

### `/army plan <wave>` (new subcommand)

Before deploying, generate and validate the synchronization matrix:

```bash
/army plan 1
```

Output:

```
═══════════════════════════════════════════════════════════════
                 WAVE 1 SYNCHRONIZATION MATRIX
═══════════════════════════════════════════════════════════════

Missions: 2
  • Navigation (buildseason-b5u.1)
  • Discord Bot (buildseason-il2.1)

File Ownership Matrix:
                          │ nav/**  │ bot/**  │ shared/** │
──────────────────────────┼─────────┼─────────┼───────────│
Mission: Navigation       │   AO    │    -    │    AI     │
Mission: Discord Bot      │    -    │   AO    │    AI     │

Conflicts: NONE ✓

Protected Files:
  • package.json — NO MISSIONS TOUCH ✓
  • drizzle/schema/index.ts — NO MISSIONS TOUCH ✓

Ready to deploy: /army deploy 1
═══════════════════════════════════════════════════════════════
```

If conflicts exist:

```
CONFLICT DETECTED:
  • Navigation and UI-Polish both claim AO on: components/sidebar/**

Resolution options:
  1. Sequence: Run Navigation first, then UI-Polish
  2. Merge: Combine into single mission
  3. Refactor: Split sidebar into nav-specific and general components

Cannot deploy until resolved.
```

### Enhanced `/army deploy` prompt

Agent prompts include boundary enforcement:

```
You are an agent in the BuildSeason army.

MISSION: Auth & Team Management
BEAD: buildseason-5pw.2 (Team CRUD)

AREA OF OPERATIONS (you may modify):
  - apps/api/src/routes/teams/**
  - apps/web/src/features/teams/**
  - drizzle/schema/teams.ts

AREA OF INTEREST (read-only):
  - apps/api/src/lib/db.ts
  - drizzle/schema/index.ts

BOUNDARY RULES:
  ✓ Full authority to modify ANY file in your AO
  ✓ May read files in your AI
  ✗ Do NOT modify files in your AI
  ✗ Do NOT touch files outside both lists

  If you need a file outside your AO:
  1. STOP current work
  2. Create coordination bead:
     bd create --title="Coordination: need <file>" --label="coordination-required"
  3. Continue with other aspects of your task
  4. Note the dependency in your commit message
```

### `/army prepare` additions

Add AO conflict detection:

```markdown
## Enhanced /army prepare

5. **AO Conflict Check:**

   For each mission pair in the wave:
   - Extract AO file patterns
   - Check for overlaps
   - Flag conflicts

   For protected files:
   - Verify no mission claims AO on protected files
   - Flag violations

6. **Generate Synchronization Matrix:**

   Create docs/waves/wave-N-sync-matrix.md showing:
   - All missions and their AOs
   - File ownership grid
   - Identified conflicts and resolutions
```

---

## Beads Graph Structure

Use beads' native features to encode boundaries:

```
Wave 0 Epic (buildseason-w0)
│
├── Mission: Auth (buildseason-5pw)
│   │   metadata:
│   │     ao: ["apps/api/src/routes/auth/**", ...]
│   │     ai: ["apps/api/src/lib/db.ts", ...]
│   │
│   ├── Task: Registration (buildseason-5pw.1)
│   ├── Task: Team CRUD (buildseason-5pw.2)
│   └── Task: Invites (buildseason-5pw.3)
│
├── Mission: Vendors (buildseason-ck0)
│   │   metadata:
│   │     ao: ["apps/api/src/routes/vendors/**", ...]
│   │     ai: [...]
│   │
│   └── Task: Vendor CRUD (buildseason-ck0.1)
│
└── Checkpoint: CP1 (buildseason-6ea)
        blocks: [Wave 1 Epic]
```

Parent-child hierarchy naturally scopes tasks to missions. The mission epic's metadata defines the AO that all child tasks inherit.

---

## Summary

| Concept                    | Definition                            | Implementation                  |
| -------------------------- | ------------------------------------- | ------------------------------- |
| **Area of Operations**     | Files you own and can modify          | List in mission metadata        |
| **Area of Interest**       | Files you read but don't modify       | List in mission metadata        |
| **Boundary**               | Hard line around your AO              | Agent prompt enforcement        |
| **No-Fire Area**           | Protected files, nobody modifies      | Project-level config            |
| **Synchronization Matrix** | File × Mission ownership grid         | `/army plan` output             |
| **Wave**                   | Phase line for timing                 | Checkpoint-gated groups         |
| **Main Effort**            | Priority mission when conflicts arise | Per-wave designation            |
| **Coordination Bead**      | Request to cross boundary             | `label="coordination-required"` |

The goal: **parallel execution without merge conflicts**. Clear ownership enables agents to work independently within their AO while the synchronization matrix ensures no two agents claim the same territory.
