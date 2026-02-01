# Migration Plan: Beads → Claude Code Native Tasks + GitHub Issues

**Date:** 2026-02-01
**Status:** Plan
**Scope:** Replace `bd` (beads) with Claude Code native Tasks + GitHub Issues

## Background

### What We Have (Beads)

Beads (`bd`) is a git-backed issue tracker stored in `.beads/issues.jsonl`. It provides:

- **Persistent issue tracking** across sessions (361 issues currently)
- **Dependency graph** with auto-ready detection (`bd ready`, `bd blocked`)
- **Label system** for AO/AoI, skills, waves, audit trails
- **Army orchestration** — waves, missions, sync matrices, checkpoints
- **Vendored binary** at `.beads/bin/bd` (v0.41.0)

Deeply integrated via:
- 3 commands (`/bead`, `/army`, `/breakdown`)
- 7 skills (`bead-workflow`, `army-process/*`, `breakdown-process`, `parallel-execution`, `session-completion`, `work-status`)
- 4 army scripts (`sync-matrix.sh`, `skill-audit.sh`, `merge-worktrees.sh`, `copy-worktreeinclude.sh`)
- Session hook (`session-start.sh`)
- Settings (`Bash(bd:*)`, `beads@beads-marketplace` plugin)
- `CLAUDE.md` references throughout

### What Claude Code Tasks Provide

Native Tasks (`TaskCreate`/`TaskUpdate`/`TaskList`/`TaskGet`) introduced in v2.1.16, announced by Thariq Shaukat (Anthropic) on Jan 22, 2026. Explicitly inspired by Beads.

**Storage:** `~/.claude/tasks/{task-list-id}/N.json` — individual JSON files per task on the filesystem.

**Task schema:**
```json
{
  "id": "1",
  "subject": "Fix authentication bug",
  "description": "Detailed requirements and acceptance criteria",
  "status": "pending",
  "owner": "agent-name",
  "activeForm": "Fixing authentication bug",
  "blockedBy": ["2"],
  "blocks": ["3"],
  "createdAt": 1706000000000,
  "updatedAt": 1706000001000
}
```

**Key capabilities:**
- **Filesystem-persistent** — stored at `~/.claude/tasks/`, survives session restarts
- **Cross-session sharing** — `CLAUDE_CODE_TASK_LIST_ID=buildseason claude` makes multiple sessions collaborate on the same task list
- **Broadcasting** — when one session updates a task, all sessions on the same list see it
- **Native dependency tracking** — `blockedBy`/`blocks` arrays with automatic unblocking when blocking tasks complete
- **Sub-agent coordination** — tasks visible to all agents in a session, claimable via `owner` field
- **Staleness protection** — must `TaskGet` before `TaskUpdate`
- Works with `claude -p` (headless) and Agent SDK

**Tool API:**

| Tool | Key Parameters |
|---|---|
| `TaskCreate` | `subject`, `description`, `activeForm` |
| `TaskUpdate` | `taskId`, `status`, `owner`, `addBlockedBy`, `removeBlockedBy`, `addBlocks`, `removeBlocks`, `delete` |
| `TaskList` | (none — returns all tasks) |
| `TaskGet` | `taskId` |

**What Tasks lack vs Beads:**
- No label/tagging system
- No priority field
- No type classification (epic/feature/task/bug)
- No wave/milestone grouping
- No cross-machine sync (local filesystem only, `--sync-dir` is a feature request)
- No historical archive of completed work
- No `bd ready` equivalent (must check blockedBy manually)

### Why Migrate

1. **Friction with Opus 4.5** — Claude Code defaults to native Tasks instead of `bd`, creating two sources of truth (beads issue #429)
2. **External dependency** — vendored binary, version mismatches, `bd doctor` failures
3. **Native alignment** — Tasks are where Anthropic is investing; fighting the platform is a losing battle
4. **Maintenance burden** — session hooks, binary updates, JSONL sync, git merge complexity

## Architecture: Two-Layer System

Native Tasks handle in-session orchestration well, but lack labels, priorities, cross-machine sync, and historical tracking. **GitHub Issues** fills those gaps.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
│                    GitHub Issues                                 │
│                                                                  │
│  • Cross-machine, cross-session persistence                      │
│  • Labels for AO, skills, waves, priorities, model routing       │
│  • Milestones for waves/checkpoints                              │
│  • Queryable: `gh issue list --label wave:1`                     │
│  • Team visibility: non-agents see issues in GitHub UI           │
│  • Historical: closed issues preserved for retros                │
│  • CI: GitHub Actions reacts to issue events                     │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ hydrate on session start
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION LAYER                                 │
│                    Claude Code Native Tasks                      │
│                                                                  │
│  • Real-time dependency tracking (blockedBy/blocks)              │
│  • Sub-agent coordination (owner, claiming)                      │
│  • Cross-session broadcast via CLAUDE_CODE_TASK_LIST_ID          │
│  • UI: Ctrl+T task view, /tasks command                          │
│  • Automatic unblocking when dependencies complete               │
│  • Progress visibility in terminal                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How the Layers Interact

1. **Session start:** Query GitHub Issues for open work → create native Tasks with `blockedBy` relationships
2. **During session:** Work tracked via native Tasks (dependencies, progress, sub-agent coordination)
3. **Task completion:** Close the GitHub Issue with evidence, mark native Task completed
4. **Army deploy:** Create named task list (`CLAUDE_CODE_TASK_LIST_ID=wave-2`), spawn sub-agents sharing it, each claims tasks via `owner`
5. **Session end:** Any new discoveries → create GitHub Issues; native Tasks auto-persist in `~/.claude/tasks/`

### Why Not Tasks Alone?

Native Tasks lack labels, priorities, wave grouping, cross-machine sync, and historical archives. For a single developer on one machine doing short tasks, native Tasks alone would work. For BuildSeason's army orchestration across waves with skill routing and model labels, we need the metadata layer that GitHub Issues provides.

### Why Not GitHub Issues Alone?

GitHub Issues lack real-time dependency resolution, sub-agent coordination, terminal UI integration, and the broadcasting that makes parallel agents work. Native Tasks are purpose-built for exactly this.

## Migration Inventory

### Files to Delete

| File/Dir | Purpose | Replacement |
|---|---|---|
| `.beads/` (entire directory) | Beads database, binary, config | GitHub Issues + native Tasks |
| `.claude/hooks/update-bd-binary.sh` | Binary updates | N/A (no binary) |
| `.claude/skills/bead-workflow/` | bd workflow skill | `task-workflow/` |

### Files to Rewrite

| File | Changes |
|---|---|
| `.claude/hooks/session-start.sh` | Replace bd setup with GH Issues query + task hydration |
| `.claude/skills/army-process/SKILL.md` | Replace `bd` with `gh issue` + native Tasks |
| `.claude/skills/army-process/plan.md` | Waves → GH milestones; tasks → GH Issues + native Tasks |
| `.claude/skills/army-process/deploy.md` | `CLAUDE_CODE_TASK_LIST_ID=wave-N`; agents claim via TaskUpdate |
| `.claude/skills/army-process/review.md` | Defect GH issues with `from:#N` labels |
| `.claude/skills/army-process/retro.md` | Query closed GH issues for metrics |
| `.claude/skills/army-process/merge.md` | Merge order from milestone metadata |
| `.claude/skills/army-process/coordination.md` | Coordination GH issues |
| `.claude/skills/parallel-execution/SKILL.md` | Workers use native Tasks for claiming + GH Issues for persistence |
| `.claude/skills/session-completion/SKILL.md` | Remove `bd sync`; add GH issue close + task cleanup |
| `.claude/skills/breakdown-process/` | Spec → GH Issues (not beads) |
| `.claude/skills/work-status/` | Status from GH Issues + TaskList |
| `.claude/commands/bead.md` | Rewrite as `/task` using `gh` + native Tasks |
| `.claude/commands/army.md` | Replace bd queries with gh + TaskList queries |
| `.claude/settings.json` | Remove `Bash(bd:*)`, `beads@beads-marketplace` |
| `CLAUDE.md` | Replace all bd references |

### Scripts to Rewrite

| Script | Current | New |
|---|---|---|
| `sync-matrix.sh` | Reads bd labels | Reads GH issue labels via `gh` |
| `skill-audit.sh` | Reads bd `skill:*` labels | Reads GH issue labels via `gh` |
| `merge-worktrees.sh` | No bd dependency | Keep as-is |
| `copy-worktreeinclude.sh` | No bd dependency | Keep as-is |

## Command Mapping

### bd → gh (persistence layer)

| Beads Command | GitHub CLI Equivalent |
|---|---|
| `bd ready` | `gh issue list --state open` + filter unblocked (see session hook) |
| `bd show <id>` | `gh issue view <number>` |
| `bd create "Title" -t task` | `gh issue create --title "Title" --label type:task` |
| `bd update <id> --status in_progress` | `gh issue edit <number> --add-label status:in-progress` |
| `bd close <id> -r "reason"` | `gh issue close <number> --comment "reason"` |
| `bd list --status open` | `gh issue list --state open` |
| `bd list --label "wave:1"` | `gh issue list --label wave:1` |
| `bd blocked` | `gh issue list --label status:blocked` |
| `bd dep add <a> <b>` | Add "Blocked by #N" to issue body |
| `bd label <id> <label>` | `gh issue edit <number> --add-label <label>` |
| `bd sync` | N/A (GitHub is already remote) |

### bd → native Tasks (session layer)

| Beads Concept | Native Tasks Equivalent |
|---|---|
| Pick up a bead | `TaskCreate` + `TaskUpdate(status: "in_progress", owner: "me")` |
| Mark blocked | `TaskUpdate(addBlockedBy: ["3"])` |
| Check what's ready | `TaskList` → filter where `blockedBy` is empty + status is `pending` |
| Close a bead | `TaskUpdate(status: "completed")` |
| Parallel agents claim work | Each agent calls `TaskUpdate(owner: "worker-N")` on unclaimed tasks |
| Wave task list | `CLAUDE_CODE_TASK_LIST_ID=wave-2 claude` |

## Label Schema

Map beads labels to GitHub Issue labels:

| Beads Label | GitHub Label | Color |
|---|---|---|
| `wave:0`, `wave:1`, etc. | `wave:0`, `wave:1` | `1D4ED8` Blue |
| `ao:<pattern>` | `ao:<pattern>` | `16A34A` Green |
| `aoi:<pattern>` | `aoi:<pattern>` | `86EFAC` Light green |
| `skill:<name>` | `skill:<name>` | `7C3AED` Purple |
| `mission:<id>` | `mission:<id>` | `EA580C` Orange |
| `checkpoint` | `checkpoint` | `DC2626` Red |
| `coordination-required` | `coordination-required` | `EAB308` Yellow |
| `main-effort` | `main-effort` | `F97316` Orange |
| `model:opus` | `model:opus` | `6B7280` Gray |
| `model:sonnet` | `model:sonnet` | `6B7280` Gray |
| `model:haiku` | `model:haiku` | `6B7280` Gray |
| `human-verify` | `human-verify` | `DC2626` Red |
| `discovered-from:<id>` | `from:#<number>` | `0D9488` Teal |
| priority 0-4 | `P0`–`P4` | Red→Green gradient |
| type | `type:epic`, `type:feature`, `type:task`, `type:bug` | Various |
| `status:in-progress` | `status:in-progress` | `FBBF24` Yellow |
| `status:blocked` | `status:blocked` | `EF4444` Red |

### Milestones for Waves

Each wave becomes a GitHub Milestone:
- `Wave 0`, `Wave 1`, `Wave 2`, etc.
- Milestone description contains merge order and sync matrix
- Milestone % complete tracks wave progress natively
- Checkpoint issues get the `checkpoint` label and are linked to their milestone

## Dependency Tracking

**Beads:** First-class dependency graph with `bd dep add`, `bd ready`, `bd blocked`.

**New system: two complementary mechanisms:**

1. **GitHub Issues (persistence):** Convention in issue body:
   ```markdown
   ## Dependencies
   - Blocked by #42
   - Blocked by #55
   ```
   Claude reads issue bodies and understands the relationships.

2. **Native Tasks (session):** First-class `blockedBy`/`blocks` arrays with automatic unblocking:
   ```
   TaskCreate({ subject: "...", description: "..." })
   TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })
   // When task 1 completes, task 2 automatically unblocks
   ```

The session hook hydrates native Task dependencies from GitHub Issue bodies at session start.

## Army Integration

### Wave Planning (`/army plan`)

**Before (beads):**
```bash
bd create "Task title" -t task --label "wave:1" --label "ao:convex/orders.ts"
bd dep add <checkpoint-id> <task-id>
```

**After:**
```bash
gh issue create --title "Task title" --label "type:task,wave:1,ao:convex/orders.ts" --milestone "Wave 1"
# Dependencies in issue body: "Blocked by #<checkpoint-issue>"
```

Then hydrate into native Tasks for the session.

### Wave Deployment (`/army deploy`)

**Before (beads):**
```bash
bd list --status open --label "wave:1"
# Launch sub-agents, each closes their bead
```

**After:**
```bash
# 1. Query wave issues
gh issue list --state open --milestone "Wave 1" --json number,title,labels

# 2. Create shared task list for the wave
export CLAUDE_CODE_TASK_LIST_ID=wave-1

# 3. Hydrate native Tasks from GH issues
# (session hook or explicit hydration step)

# 4. Launch sub-agents — they share the task list
# Each agent claims tasks via TaskUpdate(owner: "worker-N")
# Each agent closes GH issue + marks native Task completed when done
```

The `CLAUDE_CODE_TASK_LIST_ID` is the key integration point — all agents in a wave share one task list, enabling real-time coordination without bd.

### Agent Prompt Template (Updated)

```markdown
You are an agent in the BuildSeason army.

MISSION: ${MISSION_NAME}
GITHUB ISSUE: #${ISSUE_NUMBER}
TASK: ${TASK_TITLE}
WORKTREE: ${WORKTREE_PATH}

## Area of Operations (you may modify)
${AO_LIST}

## Area of Interest (focus your context here)
${AOI_LIST}

## Skills to Use
${SKILL_LIST}

## Boundary Rules
✓ Full authority to modify ANY file in your AO
✓ May read any file (AoI helps focus, doesn't restrict)
✗ Do NOT modify files outside your AO

If you need to modify a file outside your AO:
1. STOP current work
2. Create coordination issue:
   gh issue create --title "Coordination: need <file>" \
     --label "coordination-required,mission:${MISSION_ID}"
3. Continue with other aspects of your task

## Task Tracking
- Claim your task: TaskUpdate(taskId: "${TASK_ID}", status: "in_progress", owner: "${AGENT_NAME}")
- When done: TaskUpdate(taskId: "${TASK_ID}", status: "completed")
- Close GitHub Issue: gh issue close ${ISSUE_NUMBER} --comment "Skills used: ... [Brief summary]"

## Success Criteria
${SUCCESS_CRITERIA}

## Error Handling (CRITICAL)
- If typecheck or verification fails, READ THE ERROR OUTPUT carefully
- DO NOT retry the same command more than 2 times without making changes
- Fix specific issues identified in error messages
- If stuck after 3 attempts, STOP and leave a comment on the GH issue
```

## New Session Hook

```bash
#!/bin/bash
# .claude/hooks/session-start.sh
# Hydrates project status from GitHub Issues

set -e

echo "📋 Loading project status..."

# Check gh is available
if ! command -v gh &> /dev/null; then
    echo "⚠️  gh CLI not available. Install: https://cli.github.com/"
    exit 0
fi

# Check auth
if ! gh auth status &> /dev/null 2>&1; then
    echo "⚠️  gh not authenticated. Run: gh auth login"
    exit 0
fi

# Show ready work (open, not blocked, not in-progress)
echo ""
echo "Ready work:"
gh issue list --state open --json number,title,labels \
  --jq '.[] | select(.labels | map(.name) | (index("status:blocked") | not) and (index("status:in-progress") | not)) | "  #\(.number): \(.title)"' \
  2>/dev/null | head -8 || echo "  (unable to query)"

# Show in-progress
echo ""
echo "In progress:"
gh issue list --state open --label "status:in-progress" --json number,title,assignees \
  --jq '.[] | "  #\(.number): \(.title)"' \
  2>/dev/null | head -5 || echo "  (none)"

# Show blocked
BLOCKED=$(gh issue list --state open --label "status:blocked" --json number 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
if [ "$BLOCKED" != "0" ]; then
    echo ""
    echo "Blocked: $BLOCKED issue(s) — run 'gh issue list --label status:blocked' for details"
fi

echo ""
echo "✓ Ready. Use '/task ready' to see available work."
```

## New /task Command

```markdown
# Task Command

Work on tasks tracked in GitHub Issues + Claude Code native Tasks.

## Subcommands

| Subcommand | Usage | Description |
|---|---|---|
| `work` | `/task work <number>` | Pick up GH issue, hydrate as native Task, start working |
| `show` | `/task show <number>` | Show GH issue details |
| `close` | `/task close <number>` | Close GH issue + complete native Task |
| `ready` | `/task ready` | List unblocked GH issues |
| `create` | `/task create <title>` | Create new GH issue |

## SUBCOMMAND: work

1. Fetch issue: `gh issue view <number>`
2. Add in-progress label: `gh issue edit <number> --add-label status:in-progress`
3. Create native Task: TaskCreate with issue title + description
4. Load context from AO/AoI/skill labels (same as old /bead work)
5. Display work summary with READY TO WORK banner
```

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **No label system in native Tasks** | Medium | GitHub Issues carry all labels; Tasks are for session orchestration |
| **Cross-machine limitation** | Medium | GitHub Issues provide cross-machine persistence; Tasks are local |
| **Known bugs in task list sharing** | Medium | `--fork-session` bug #20664; subagent inheritance #22228; monitor fixes |
| **GH API rate limits** | Low | 5000/hr authenticated; ample for this use |
| **Historical data loss** | Low | Keep `.beads/issues.jsonl` in git history; closed GH issues preserved |
| **Army scripts break** | Medium | Rewrite scripts to use `gh` CLI |
| **Hydration overhead** | Low | Only hydrate issues for active wave/session |

## What We Gain

1. **Single source of truth** — no more bd vs native Tasks confusion
2. **No external binary** — `gh` CLI already installed; native Tasks built into Claude Code
3. **Native dependency resolution** — `blockedBy`/`blocks` with automatic unblocking
4. **Cross-session broadcast** — `CLAUDE_CODE_TASK_LIST_ID` enables live collaboration
5. **Platform alignment** — Tasks are where Anthropic is investing, inspired by Beads
6. **Team visibility** — GitHub Issues visible to non-agents in browser
7. **CI integration** — GitHub Actions reacts to issue events natively
8. **Terminal UI** — Ctrl+T task view, progress spinners

## What We Lose

1. **Offline persistent tracking** — beads was in-repo; GH Issues needs network
2. **Hash-based IDs** — beads IDs were merge-safe; GH numbers are sequential
3. **Unified CLI** — one `bd` command vs `gh` + native Tasks
4. **bd-specific features** — `bd doctor`, compaction, swarm mode, repair

## Beads Data Migration

### Inventory

| Metric | Count |
|---|---|
| Total issues | 361 |
| Open | 49 |
| Closed | 312 |
| Open with dependencies | 38 |
| Unique labels | 31 |
| Dependency links | 482 (41 parent, 182 parent-child, 249 blocks, 10 discovered-from) |

### What Gets Migrated

**Open issues (49):** Migrated to GitHub Issues with full metadata — title, description, labels, priority, type, dependencies.

**Closed issues (312):** NOT migrated. They remain in git history at `.beads/issues.jsonl`. Closed beads are historical artifacts — useful for auditing but not needed in the active tracking system.

### Migration Script

The migration requires a two-pass approach because GitHub Issue numbers are sequential and assigned at creation time. Dependencies reference bead hash IDs (`buildseason-xyz`) which must be remapped to GH issue numbers (`#N`).

```bash
#!/bin/bash
# scripts/migrate-beads-to-github.sh
# One-time migration of open beads to GitHub Issues
#
# Pass 1: Create all issues (no dependencies yet)
# Pass 2: Update issue bodies with remapped dependency references

set -e

JSONL=".beads/issues.jsonl"
MAP_FILE="/tmp/bead-to-gh-map.json"

echo "{}" > "$MAP_FILE"

# ── Pass 1: Create GitHub Issues ──────────────────────────────
echo "Pass 1: Creating GitHub Issues..."

# Extract open issues, sorted by priority (P0 first)
python3 -c "
import json, sys
issues = []
with open('$JSONL') as f:
    for line in f:
        issue = json.loads(line)
        if issue['status'] == 'open':
            issues.append(issue)
issues.sort(key=lambda x: x.get('priority', 2))
json.dump(issues, sys.stdout)
" | jq -c '.[]' | while read -r issue; do

    BEAD_ID=$(echo "$issue" | jq -r '.id')
    TITLE=$(echo "$issue" | jq -r '.title')
    DESCRIPTION=$(echo "$issue" | jq -r '.description')
    PRIORITY=$(echo "$issue" | jq -r '.priority')
    TYPE=$(echo "$issue" | jq -r '.issue_type')
    LABELS_JSON=$(echo "$issue" | jq -r '.labels // [] | join(",")')

    # Build label string
    LABELS="type:${TYPE},P${PRIORITY}"
    if [ -n "$LABELS_JSON" ]; then
        LABELS="${LABELS},${LABELS_JSON}"
    fi

    # Add bead ID reference to body for traceability
    BODY="$(cat <<EOF
${DESCRIPTION}

---
_Migrated from bead \`${BEAD_ID}\`_
EOF
)"

    # Create issue
    GH_NUMBER=$(gh issue create \
        --title "$TITLE" \
        --body "$BODY" \
        --label "$LABELS" \
        --json number --jq '.number')

    echo "  Created #${GH_NUMBER} from ${BEAD_ID}: ${TITLE}"

    # Record mapping
    python3 -c "
import json
with open('$MAP_FILE') as f:
    m = json.load(f)
m['$BEAD_ID'] = $GH_NUMBER
with open('$MAP_FILE', 'w') as f:
    json.dump(m, f)
"
done

echo ""
echo "Pass 1 complete. Mapping:"
cat "$MAP_FILE" | python3 -m json.tool

# ── Pass 2: Add Dependencies ────────────────────────────────
echo ""
echo "Pass 2: Adding dependencies..."

python3 -c "
import json, sys

with open('$MAP_FILE') as f:
    bead_to_gh = json.load(f)

issues = []
with open('$JSONL') as f:
    for line in f:
        issue = json.loads(line)
        if issue['status'] == 'open' and issue.get('dependencies'):
            issues.append(issue)

for issue in issues:
    bead_id = issue['id']
    gh_number = bead_to_gh.get(bead_id)
    if not gh_number:
        continue

    deps = []
    parent = None
    for dep in issue['dependencies']:
        dep_id = dep['depends_on_id']
        dep_gh = bead_to_gh.get(dep_id)
        dep_type = dep['type']

        if dep_type in ('parent', 'parent-child'):
            if dep_gh:
                parent = f'#{dep_gh}'
            else:
                parent = f'\`{dep_id}\` (closed)'
        elif dep_type == 'blocks':
            if dep_gh:
                deps.append(f'- Blocked by #{dep_gh}')
            else:
                deps.append(f'- Blocked by \`{dep_id}\` (closed)')
        elif dep_type == 'discovered-from':
            deps.append(f'- Discovered from \`{dep_id}\`')

    if deps or parent:
        section = '## Dependencies\n'
        if parent:
            section += f'Parent: {parent}\n'
        section += '\n'.join(deps)
        print(json.dumps({'gh_number': gh_number, 'section': section}))
" | while read -r update; do
    GH_NUMBER=$(echo "$update" | jq -r '.gh_number')
    DEP_SECTION=$(echo "$update" | jq -r '.section')

    # Append dependencies to issue body
    CURRENT_BODY=$(gh issue view "$GH_NUMBER" --json body --jq '.body')
    NEW_BODY="${CURRENT_BODY}

${DEP_SECTION}"

    gh issue edit "$GH_NUMBER" --body "$NEW_BODY"
    echo "  Updated #${GH_NUMBER} with dependencies"
done

echo ""
echo "Migration complete!"
echo "Mapping saved to: $MAP_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify issues: gh issue list --state open"
echo "  2. Create milestones if using waves"
echo "  3. Update CLAUDE.md and skills"
echo "  4. Delete .beads/ directory"
```

### Dependency Type Mapping

| Beads Dependency Type | GitHub Issues Representation |
|---|---|
| `parent-child` (182) | "Parent: #N" in Dependencies section |
| `blocks` (249) | "Blocked by #N" in Dependencies section |
| `parent` (41) | "Parent: #N" in Dependencies section |
| `discovered-from` (10) | "Discovered from `bead-id`" + `from:doc:*` label |

### Open Issues by Category

The 49 open issues break down as:

| Category | Count | Examples |
|---|---|---|
| Production deployment | 10 | `7fof.*` — Convex prod, OAuth, Vercel, CI/CD |
| GLaDOS agent | 5 | `il2.*` — Agent SDK, tools, order workflow, monitoring |
| OnShape CAD | 6 | `kue.*` — OAuth, BOM extraction, webhooks, sync |
| Vendor catalog | 4 | `84j.*` — Schema.org extractor, URL matching, APIs |
| YPP/safety | 3 | `7iun.*` — Birthday, email alerting, Resend |
| Epics (tracking) | 10 | `7e7`, `9oty`, `vs7i`, `yv8x`, etc. |
| Misc tasks/bugs | 11 | Rate limiting, secrets audit, code review, tests |

### Parent-Child Hierarchy

Several open beads use dotted IDs for hierarchy (`7fof.1`, `7fof.2`, etc.). In GitHub Issues, this becomes:

- Parent epic: `#N` with label `type:epic`
- Child tasks: Each gets "Parent: #N" in Dependencies section
- GitHub's task list syntax in the epic body provides visual tracking:
  ```markdown
  ## Tasks
  - [ ] #12 Set up Convex production deployment
  - [ ] #13 Create production Discord application
  - [ ] #14 Configure GitHub OAuth for production
  ```

### Label Migration

The 31 unique beads labels map directly to GH labels. Labels that reference bead IDs (`discovered-from:buildseason-2zlp`) get remapped to GH issue references (`from:#N`) using the mapping file.

### ID Traceability

Every migrated GH issue body ends with:
```
---
_Migrated from bead `buildseason-xyz`_
```

This allows tracing back to the original bead if needed. The mapping file (`bead-to-gh-map.json`) is also preserved.

### Post-Migration Verification

```bash
# Verify counts match
OPEN_BEADS=$(python3 -c "
import json
count = sum(1 for line in open('.beads/issues.jsonl') if json.loads(line)['status'] == 'open')
print(count)
")
OPEN_GH=$(gh issue list --state open --json number | jq 'length')
echo "Beads open: $OPEN_BEADS, GH open: $OPEN_GH"

# Verify dependencies were added
gh issue list --state open --json number,body --jq '.[] | select(.body | contains("Blocked by")) | .number'

# Verify labels applied
gh issue list --state open --json number,labels --jq '.[] | "\(.number): \([.labels[].name] | join(", "))"'
```

## Implementation Priority

| Step | Effort | Description |
|---|---|---|
| 1. Create GH labels + milestones | Low | One-time setup script |
| 2. Migrate open beads → GH Issues | Medium | One-time migration script |
| 3. Write `task-workflow` skill | Medium | Core workflow documentation |
| 4. Write `/task` command | Medium | Port of `/bead` to gh + native Tasks |
| 5. Rewrite session hook | Low | Replace bd setup with gh queries |
| 6. Rewrite army skills | High | 7 sub-process files using gh + TASK_LIST_ID |
| 7. Rewrite army scripts | Medium | `sync-matrix.sh`, `skill-audit.sh` |
| 8. Update CLAUDE.md + settings | Low | Remove bd references, add gh + Tasks |
| 9. Delete `.beads/` | Low | Remove vendored binary + JSONL |
| 10. End-to-end verification | Medium | Full workflow test |

## References

- [Thariq Shaukat: Tasks announcement (X, Jan 22 2026)](https://x.com/) — "Tasks are our new abstraction for coordinating many pieces of work"
- [Claude Code v2.1.16 Release](https://github.com/anthropics/claude-code/releases/tag/v2.1.16)
- [Claude Code Interactive Mode Docs](https://code.claude.com/docs/en/interactive-mode) — CLAUDE_CODE_TASK_LIST_ID
- [Claude Code Sub-agents Docs](https://code.claude.com/docs/en/sub-agents)
- [Beads + Opus 4.5 Friction (Issue #429)](https://github.com/steveyegge/beads/issues/429)
- [Task list sync-dir proposal (#20487)](https://github.com/anthropics/claude-code/issues/20487)
- [Fork-session task inheritance bug (#20664)](https://github.com/anthropics/claude-code/issues/20664)
- [Subagent Task tool inheritance (#22228)](https://github.com/anthropics/claude-code/issues/22228)
- [Swarm Orchestration Gist](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
