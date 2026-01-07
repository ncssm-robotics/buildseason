# Deploy Sub-Process

The deploy phase launches parallel agents in isolated git worktrees with boundary enforcement.

## Usage

```
/army deploy <wave-number> [--dry-run]
```

## Prerequisites

1. `/army plan N` completed
2. Previous wave checkpoint closed (if wave > 0)
3. All beads have skill:\* labels

## Steps

### 1. Verify Checkpoint Gate

If wave > 0, check that the previous checkpoint is closed:

```bash
# Check checkpoint status
bd show <checkpoint-bead-id> | grep "Status:"
```

If checkpoint is still open, deployment is blocked.

### 2. Identify Beads for Wave

```bash
# Get beads for this wave
bd list --status open --label "wave:N"

# Filter out already-closed beads
# Check for model labels (model:opus, model:sonnet, model:haiku)
```

### 3. Display Deployment Plan

```
═══════════════════════════════════════════════════════════════
              ARMY DEPLOYMENT: WAVE N
═══════════════════════════════════════════════════════════════

Checkpoint: [SATISFIED] ✓

Deploying N agents in parallel:

┌─────────────────────────────────────────────────────────────┐
│ AGENT 1: buildseason-xyz                                    │
│ Task: <title>                                               │
│ Model: sonnet                                               │
│ AO: apps/api/src/routes/auth/**                             │
│ Skills: skill:api-crud, skill:drizzle-patterns              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AGENT 2: buildseason-abc                                    │
│ Task: <title>                                               │
│ Model: sonnet                                               │
│ AO: apps/api/src/routes/vendors/**                          │
│ Skills: skill:api-crud                                      │
└─────────────────────────────────────────────────────────────┘
```

If `--dry-run`, stop here.

### 4. Create Worktrees

For each mission:

```bash
# Create worktree with mission branch
git worktree add ~/.claude-worktrees/<project>-<mission-id> -b mission/<mission-id>

# Copy gitignored files needed for execution
./scripts/copy-worktreeinclude.sh ~/.claude-worktrees/<project>-<mission-id>
```

### 5. Launch Parallel Agents

Use the Task tool to launch ALL agents in a SINGLE message for true parallelism.

For each bead, create a Task with:

- `subagent_type`: "general-purpose"
- `run_in_background`: true
- `model`: From bead's model:\* label (default: sonnet)

### Agent Prompt Template

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

For each skill, read the skill documentation in `.claude/skills/<skill-name>/SKILL.md` and follow its patterns.

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

1. Read skill documentation for each skill:\* label
2. Read AoI files for context
3. Implement the required changes following skill patterns
4. Verify: ${VERIFY_COMMAND}
5. Commit with message referencing ${BEAD_ID}
6. Close bead with skills telemetry:
   bd close ${BEAD_ID} --reason "Skills used: skill:X, skill:Y. [Brief summary]"

## Error Handling (CRITICAL)

- If typecheck or verification fails, READ THE ERROR OUTPUT carefully
- DO NOT retry the same command more than 2 times without making changes
- Fix specific issues identified in error messages
- If stuck after 3 attempts, STOP and leave a comment:
  "Blocked: <describe the error you couldn't resolve>"
- Never loop infinitely on verification steps

## Scope Management

- If task requires more than 5-6 files, focus on core functionality first
- Prefer working code over complete code - commit what works
- If blocked on one part, complete other parts and note what's incomplete
```

**Important:** The close message MUST enumerate which skills were actually used. This telemetry enables retro analysis.

### 6. Monitor Progress

Wave-command monitors:

- Agent completion status
- Coordination beads (see coordination.md)
- Error conditions

```bash
# Check agent tasks
# Use TaskOutput to check if agents are done
```

### 7. Report Deployment

```
═══════════════════════════════════════════════════════════════
              DEPLOYMENT COMPLETE
═══════════════════════════════════════════════════════════════

Launched: N agents

Monitor: /army status
Check agents: /tasks

When complete, run: /army review N
═══════════════════════════════════════════════════════════════
```

## Deploy-Fixes Variant

`/army deploy-fixes N` is used after review to fix P0-P1 issues:

1. Get beads with `discovered-from` links to review beads
2. Filter to P0-P1 priority only
3. Deploy fix agents (no worktrees needed for fixes)
4. Monitor completion

## Checklist

- [ ] Checkpoint gate verified
- [ ] All beads have skill:\* labels
- [ ] Worktrees created for each mission
- [ ] .worktreeinclude files copied
- [ ] Agents launched with full prompt
- [ ] Deployment status reported
