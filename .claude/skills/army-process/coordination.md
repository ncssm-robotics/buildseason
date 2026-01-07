# Coordination Sub-Process

The coordination process handles cross-mission file requests when an agent needs to modify files outside its Area of Operations.

## When This Happens

During deployment, an agent may discover it needs to modify a file outside its AO. Rather than violating boundaries, the agent creates a coordination bead and continues with other work.

## Agent Behavior

When an agent needs a file outside its AO:

```bash
# 1. STOP current work on that file
# 2. Create coordination bead:
bd create --title="Coordination: need <file>" \
  --label="coordination-required" \
  --label="mission:<current-mission-id>" \
  --label="wave:N" \
  --description="Mission <current> needs to modify <file>.

Reason: <why this file is needed>

Current owner: <mission that owns the file per sync matrix>

Options:
1. Wait for owner mission to complete
2. Coordinate mid-wave (pull from owner's worktree)
3. Defer to next wave"

# 3. Continue with other work in AO
# 4. Note the dependency in commit message
```

## Wave-Command Monitoring

The wave-command (orchestrating agent) monitors for coordination beads:

```bash
# Check for coordination requests
bd list --status open --label "coordination-required" --label "wave:N"
```

### Coordination Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE-COMMAND COORDINATION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Mission A needs file outside AO                               │
│       │                                                         │
│       ├── Creates coordination bead                             │
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
│       │   └── Update bead status                                │
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

## Handling Coordination Requests

### Case 1: File Owned by Another Mission

```bash
# 1. Identify owner from sync matrix
# Owner: mission/vendors

# 2. Wait for owner to complete
# (Monitor bd show mission-vendors-bead for status)

# 3. When owner completes, grant clearance
bd update <coordination-bead> --status=in_progress

# 4. Add comment with clearance
# "Cleared: Mission vendors complete at <timestamp>.
#  File vendors/api.ts is now available.
#  In worktree, run: git fetch origin mission/vendors && git merge origin/mission/vendors"
```

### Case 2: File Not Owned by Any Mission

```bash
# 1. Check sync matrix - no mission claims AO on this file

# 2. Grant immediate clearance
bd update <coordination-bead> --status=in_progress

# 3. Add comment
# "Cleared: File <path> is not owned by any mission in this wave.
#  Modification approved. Note: this may indicate a planning gap.
#  Consider adding to AO in future planning."
```

### Case 3: File in Protected List

If the file is in a protected list (package.json, schema index, etc.):

```bash
# 1. Deny automatic clearance
# 2. Add comment requesting human decision
# "Blocked: File <path> is in protected list.
#  Human approval required for modification.
#  Options:
#  1. Grant exception for this wave
#  2. Create dedicated infrastructure mission
#  3. Defer to next wave with proper planning"
```

## Audit Trail

Every coordination action is recorded in the bead:

```markdown
# Coordination: need shared/api-client.ts

**Mission:** auth
**Requested:** 2025-01-06 15:00:00

## Request (Mission A agent)

Need to modify `shared/api-client.ts` to add auth headers.
Currently owned by Mission B (Vendors team).

## Analysis (Wave-Command)

- File owner: mission/vendors (per sync matrix)
- Mission vendors status: in_progress
- Action: Wait for completion

## Clearance (Wave-Command)

Timestamp: 2025-01-06T15:30:00Z
Mission vendors completed at 15:28:00Z.
File `shared/api-client.ts` is now available.
If in worktree, run: `git fetch origin mission/vendors && git merge origin/mission/vendors`

## Completion (Mission A agent)

Modified file as needed. Added auth headers to API client.
Committed in abc1234.
```

## Retro Treatment

Coordination requests are reviewed during retro:

### Planning Defect

If the file should have been in the requesting mission's AO:

- Create improvement bead for planning skill
- Update AO estimation patterns

```bash
bd create --title="Planning: missed AO file in wave N" \
  --label="process-improvement:retro-wave-N" \
  --label="discovered-from:<coordination-bead>" \
  --description="File <path> was needed by mission <X> but not in its AO.

Analysis: Should have been identified during planning.
Fix: Update planning patterns to catch <type of file>."
```

### Legitimate Cross-Cutting

If coordination was truly necessary:

- No action needed
- Track frequency for future planning
- Consider if work should be in shared infrastructure mission

## Metrics

Track over time:

- Coordination requests per wave
- Planning defects vs legitimate cross-cutting
- Average wait time for clearance
- Blocked requests requiring human intervention

## Checklist

- [ ] Coordination bead created with proper labels
- [ ] Owner identified from sync matrix
- [ ] Clearance granted or escalated appropriately
- [ ] Audit trail recorded in bead comments
- [ ] Requesting mission can proceed after clearance
- [ ] Coordination logged for retro analysis
