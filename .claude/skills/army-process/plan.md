# Plan Sub-Process

The plan phase organizes beads into waves, conducts skills audit, creates/updates skills, and tags beads for deployment.

## Usage

```
/army plan <wave-number>
```

## Steps

### 1. Form Wave Structure

Query open beads ready for this wave and organize into missions:

```bash
# Get beads for this wave
bd list --status open --label "wave:N"

# Or get unblocked beads ready for work
bd ready
```

Group beads into missions based on:

- AO patterns (from bead descriptions or `ao:*` labels)
- Logical feature groupings
- Team assignments

Create or update wave bead if needed:

```bash
bd create --title="Wave N Plan" \
  --type=epic \
  --label="wave:N" \
  --description="<wave plan content>"
```

### 2. Generate Synchronization Matrix

For each mission in the wave:

1. Extract AO patterns from bead descriptions or `ao:*` labels
2. Extract AoI patterns from bead descriptions or `aoi:*` labels
3. Build File × Mission grid

Use helper script:

```bash
./scripts/sync-matrix.sh N
```

Or manually:

```
                      │ auth/** │ teams/** │ vendors/** │ shared/ui/** │
──────────────────────┼─────────┼──────────┼────────────┼──────────────│
Mission: Auth+Team    │   AO    │    AO    │     -      │     AoI      │
Mission: Vendors      │    -    │     -    │     AO     │     AoI      │
Mission: UI Polish    │    -    │     -    │     -      │      AO      │
```

**Conflict Detection:**

- **AO-on-AO:** Must resolve before deploy
- **AoI-on-AO:** Decision point, record in wave bead

**Determine Merge Order:**

Based on dependencies:

1. Missions with no AoI overlaps merge first
2. If A has AoI on B's AO, B merges first
3. Main effort merges last

Record in wave bead description:

```markdown
## Merge Order

1. discord-bot (isolated, no dependencies)
2. navigation (depends on shared/ui)
3. auth-improvements (main effort, merges last)
```

### 3. Analyze Work Requirements

For each bead in wave:

1. Read the bead description and success criteria
2. Identify what KIND of work this is:
   - API implementation
   - UI component
   - Database migration
   - Testing
   - Documentation
   - Integration
3. Note patterns, approaches, and processes that would help

This is forward-looking: "What skills would make this work go well?"

### 4. Conduct Skills Audit

Based on work analysis:

1. List skills that would help each bead
2. Compare against existing skills in `.claude/skills/`
3. Categorize:

| Status                  | Action             |
| ----------------------- | ------------------ |
| Exists and current      | Ready to use       |
| Exists but needs update | Queue for revision |
| Does not exist          | Queue for creation |

Use helper script:

```bash
./scripts/skill-audit.sh
```

**Important:** No bead runs without a skill. Plan ensures all skills exist before deploy.

### 5. Create/Update Skills

For each skill gap or update:

```bash
bd create --title="Create skill: <technology/pattern>" \
  --label="skill:skill-builder" \
  --label="process-improvement:plan-wave-N" \
  --description="Technology/Pattern: <e.g., discord-api, drizzle-patterns>

Why needed:
- Beads in this wave require <pattern>
- No existing skill covers this

Skill should document:
- How we use <technology> in this project
- Our conventions and patterns
- Key examples from the codebase
- Links to official docs for reference

Example beads that will use this:
- <bead-id>: <title>"
```

Launch parallel agents to build/update skills:

- Skills are GENERAL (discord-api, drizzle-patterns) not bead-specific
- Each agent uses the skill-building skill
- Wait for completion
- Commit skill changes

### 6. Assign Skill Labels to Beads

Now that skills exist, tag each bead:

```bash
bd label <bead-id> skill:api-crud
bd label <bead-id> skill:drizzle-patterns
```

Requirements:

- Each bead gets at least one skill label
- Multiple skills can be assigned if work spans patterns

### 7. Output Ready State

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

AO Conflicts: NONE ✓
AoI-on-AO Dependencies: 2 (decisions recorded in wave bead)
Merge Order: vendors → parts → auth (in wave bead)

Skills Audit:
  ✓ skill:api-crud (exists, current)
  ✓ skill:drizzle-patterns (exists, current)
  ⚡ skill:rbac-patterns (created this cycle)
  ✓ skill:testing-patterns (exists, current)

Beads Tagged: 12/12 have skill:* labels

Ready to deploy: /army deploy N
═══════════════════════════════════════════════════════════════
```

## Checklist

- [ ] Wave structure formed (missions identified)
- [ ] Sync matrix generated
- [ ] AO conflicts resolved or sequenced
- [ ] AoI-on-AO decisions recorded
- [ ] Merge order determined and recorded
- [ ] Work requirements analyzed
- [ ] Skills audit completed
- [ ] Missing skills created
- [ ] All beads have skill:\* labels
- [ ] Wave bead updated with plan details
