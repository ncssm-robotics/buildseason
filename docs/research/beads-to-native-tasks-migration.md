# Migration Plan: Beads → Claude Code Native Tasks

**Date:** 2026-02-01
**Status:** Plan
**Scope:** Replace `bd` (beads) issue tracker with Claude Code native Tasks + GitHub Issues for persistence

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

Native Tasks (`TaskCreate`/`TaskUpdate`/`TaskList`/`TaskGet`) introduced in v2.1.16:

- **Individual task CRUD** (not full-list replacement like TodoWrite)
- **Dependency tracking** between tasks
- **Multi-agent visibility** — shared across sub-agents in a session
- **Task claiming** via ownership
- **Staleness protection** — must `TaskGet` before `TaskUpdate`

**Critical limitation:** Tasks are **session-scoped** — they vanish when the session ends.

### Why Migrate

1. **Friction with Opus 4.5** — Claude Code defaults to native Tasks instead of `bd`, causing confusion (beads issue #429)
2. **External dependency** — vendored binary, version mismatches, `bd doctor` failures
3. **Duplication** — native Tasks and bd both track work, creating two sources of truth
4. **Maintenance burden** — session hooks, binary updates, JSONL sync, git merge complexity

## Architecture: Two-Layer Replacement

Since native Tasks are session-scoped, we need a persistence layer. The natural choice is **GitHub Issues** — already integrated with Claude Code's GitHub Actions workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
│                                                                  │
│  GitHub Issues + Labels + Milestones                             │
│  • Survives across sessions                                      │
│  • Dependencies via "blocked by #N" in body                      │
│  • Labels for AO, skills, waves, priorities                      │
│  • Milestones for waves/checkpoints                              │
│  • Queryable via `gh issue list`                                 │
│  • Native to Claude Code GitHub integration                      │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ hydrate on session start
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION LAYER                                 │
│                                                                  │
│  Claude Code Native Tasks                                        │
│  • In-session orchestration                                      │
│  • Sub-agent coordination                                        │
│  • Dependency tracking within session                            │
│  • Task claiming for parallel work                               │
│  • Real-time progress visibility                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**The hydration pattern:** At session start, query GitHub Issues to understand current work state. Create native Tasks from the relevant issues. At session end, sync task results back to GitHub Issues.

## Migration Inventory

### Files to Delete

| File/Dir | Purpose | Replacement |
|---|---|---|
| `.beads/` (entire directory) | Beads database, binary, config | GitHub Issues |
| `.claude/hooks/session-start.sh` | bd setup + ready display | New hook: `gh issue list` |
| `.claude/hooks/update-bd-binary.sh` | Binary updates | N/A (no binary) |
| `.claude/skills/bead-workflow/` | bd workflow skill | `task-workflow/` |
| `.claude/skills/breakdown-process/` | Spec → beads | `breakdown-process/` (rewritten for GH Issues) |
| `.claude/skills/work-status/` | Status from bd | `work-status/` (rewritten for GH Issues) |
| `.claude/commands/bead.md` | `/bead` command | `/task` command |

### Files to Rewrite

| File | Changes |
|---|---|
| `.claude/skills/army-process/SKILL.md` | Replace `bd` commands with `gh issue` |
| `.claude/skills/army-process/plan.md` | Wave planning via GH milestones + labels |
| `.claude/skills/army-process/deploy.md` | Agent prompts reference GH issues, not beads |
| `.claude/skills/army-process/review.md` | Defect issues with `discovered-from` labels |
| `.claude/skills/army-process/retro.md` | Process improvement via GH issues |
| `.claude/skills/army-process/merge.md` | Merge order from milestone metadata |
| `.claude/skills/army-process/coordination.md` | Coordination issues |
| `.claude/skills/parallel-execution/SKILL.md` | Workers use native Tasks + GH Issues |
| `.claude/skills/session-completion/SKILL.md` | Remove `bd sync`, add GH sync |
| `.claude/commands/army.md` | Replace bd queries with gh queries |
| `.claude/settings.json` | Remove `Bash(bd:*)`, `beads@beads-marketplace` |
| `CLAUDE.md` | Replace all bd references |

### Files to Create

| File | Purpose |
|---|---|
| `.claude/skills/task-workflow/SKILL.md` | Native Tasks + GH Issues workflow |
| `.claude/commands/task.md` | `/task` command (replaces `/bead`) |
| `.claude/hooks/session-start.sh` | New: hydrate from GH Issues |

### Scripts to Rewrite

| Script | Current | New |
|---|---|---|
| `sync-matrix.sh` | Reads bd labels | Reads GH issue labels |
| `skill-audit.sh` | Reads bd label `skill:*` | Reads GH issue labels |
| `merge-worktrees.sh` | No bd dependency | Keep as-is |
| `copy-worktreeinclude.sh` | No bd dependency | Keep as-is |

## Command Mapping: bd → gh

| Beads Command | GitHub CLI Equivalent |
|---|---|
| `bd ready` | `gh issue list --label ready --state open` (or custom query) |
| `bd show <id>` | `gh issue view <number>` |
| `bd create "Title" -t task` | `gh issue create --title "Title" --label type:task` |
| `bd update <id> --status in_progress` | `gh issue edit <number> --add-label status:in-progress` |
| `bd close <id> -r "reason"` | `gh issue close <number> --comment "reason"` |
| `bd list --status open` | `gh issue list --state open` |
| `bd list --label "wave:1"` | `gh issue list --label wave:1` |
| `bd blocked` | `gh issue list --label status:blocked` |
| `bd dep add <a> <b>` | Add "Blocked by #N" to issue body |
| `bd label <id> <label>` | `gh issue edit <number> --add-label <label>` |
| `bd stats` | `gh issue list --state all --json state \| jq 'group_by(.state)'` |
| `bd sync` | N/A (GitHub is already remote) |

### Dependency Tracking

Beads has first-class dependency graphs. GitHub Issues does not. Options:

**Option A: Body Convention (Recommended)**
```markdown
## Dependencies
- Blocked by #42
- Blocked by #55
```
Parse with grep when needed. Simple, visible, works with Claude's text understanding.

**Option B: GitHub Sub-Issues (Beta)**
GitHub's sub-issues feature (if available) provides parent-child natively.

**Option C: Label-Based**
`blocks:#42` label — queryable but noisy.

**Recommendation:** Option A. Claude can read issue bodies and understand dependency relationships without special tooling. The `ready` concept becomes: "open issues with no unresolved `Blocked by` references."

### Auto-Ready Detection

Beads' `bd ready` automatically computes which issues are unblocked. With GitHub Issues, we need a lightweight equivalent:

```bash
# Session start hook: compute ready issues
# 1. Get all open issues
# 2. For each, check if "Blocked by #N" references are all closed
# 3. Display unblocked issues
```

This can be a small script or handled by the agent at session start.

## Label Schema

Map beads labels to GitHub Issue labels:

| Beads Label | GitHub Label | Color |
|---|---|---|
| `wave:0`, `wave:1`, etc. | `wave:0`, `wave:1` | Blue |
| `ao:<pattern>` | `ao:<pattern>` | Green |
| `aoi:<pattern>` | `aoi:<pattern>` | Light green |
| `skill:<name>` | `skill:<name>` | Purple |
| `mission:<id>` | `mission:<id>` | Orange |
| `checkpoint` | `checkpoint` | Red |
| `coordination-required` | `coordination-required` | Yellow |
| `main-effort` | `main-effort` | Orange |
| `model:opus` | `model:opus` | Gray |
| `model:sonnet` | `model:sonnet` | Gray |
| `model:haiku` | `model:haiku` | Gray |
| `human-verify` | `human-verify` | Red |
| `discovered-from:doc:*` | `from:doc:<name>` | Teal |
| `discovered-from:<id>` | `from:#<number>` | Teal |
| (priority 0-4) | `P0`, `P1`, `P2`, `P3`, `P4` | Red→Green gradient |
| (type) | `type:epic`, `type:feature`, `type:task`, `type:bug` | Various |
| `status:in-progress` | `status:in-progress` | Yellow |
| `status:blocked` | `status:blocked` | Red |

### Milestones for Waves

Each wave becomes a GitHub Milestone:
- `Wave 0`, `Wave 1`, `Wave 2`, etc.
- Milestone description contains merge order and sync matrix
- Milestone % complete tracks wave progress natively

### Checkpoints

Checkpoint issues get the `checkpoint` label and are linked to their milestone. Closing a checkpoint milestone-gates the next wave.

## Migration Steps

### Phase 1: Create GitHub Labels + Milestones

```bash
# Create label taxonomy
gh label create "type:epic" --color 8B5CF6
gh label create "type:feature" --color 6366F1
gh label create "type:task" --color 3B82F6
gh label create "type:bug" --color EF4444
gh label create "P0" --color DC2626
gh label create "P1" --color F97316
gh label create "P2" --color EAB308
gh label create "P3" --color 22C55E
gh label create "P4" --color 6B7280
gh label create "status:in-progress" --color FBBF24
gh label create "status:blocked" --color EF4444
gh label create "checkpoint" --color DC2626
gh label create "human-verify" --color DC2626
gh label create "coordination-required" --color EAB308
gh label create "main-effort" --color F97316
gh label create "model:opus" --color 6B7280
gh label create "model:sonnet" --color 6B7280
gh label create "model:haiku" --color 6B7280
# Wave, skill, ao, aoi labels created as needed
```

### Phase 2: Migrate Open Issues

Export open beads to GitHub Issues:

```bash
# For each open bead in issues.jsonl:
# 1. Create GH issue with title, description, labels
# 2. Map bead dependencies to "Blocked by #N" in body
# 3. Assign to appropriate milestone (wave)
```

This is a one-time migration script. Closed beads do NOT need migration — they're historical.

### Phase 3: Rewrite Skills + Commands

Update all skills and commands per the inventory above. Key changes:

1. **`task-workflow/SKILL.md`** (replaces `bead-workflow`):
   - `gh issue list --label status:ready` instead of `bd ready`
   - `gh issue edit --add-label status:in-progress` instead of `bd update --status in_progress`
   - `gh issue close --comment "evidence"` instead of `bd close`
   - Native `TaskCreate` for in-session tracking

2. **`army-process/*`**:
   - Wave planning uses milestones
   - Sync matrix reads from GH issue labels
   - Deploy prompts reference `#issue-number` not `buildseason-xyz`
   - Agents close GH issues instead of beads

3. **`parallel-execution/SKILL.md`**:
   - Workers use native Tasks for coordination
   - GH Issues for persistent state

4. **`session-completion/SKILL.md`**:
   - Remove `bd sync`
   - Add "close GH issues for completed work"

### Phase 4: Update Infrastructure

1. **Delete `.beads/` directory** (entire thing — binary, config, JSONL, etc.)
2. **Rewrite `session-start.sh`** — query GH Issues, show ready work
3. **Update `.claude/settings.json`**:
   - Remove `Bash(bd:*)` permission
   - Remove `beads@beads-marketplace` plugin
   - Add `Bash(gh:*)` permission (likely already covered)
4. **Update `CLAUDE.md`** — replace all bd references with gh equivalents
5. **Update `.github/workflows/claude.yml`** — if it references bd

### Phase 5: Verify + Clean Up

1. Run through full workflow: create issue → claim → work → verify → close
2. Run `/army plan` with new skill docs
3. Verify session start hook works
4. Remove any remaining bd references via grep
5. Commit migration as single atomic commit

## New Session Hook

```bash
#!/bin/bash
# .claude/hooks/session-start.sh
# Shows current work state from GitHub Issues

set -e

echo "📋 Loading project status..."

# Show ready work (open, not blocked, not in-progress)
echo ""
echo "Ready work:"
gh issue list --state open --label "type:task" --json number,title,labels \
  --jq '.[] | select(.labels | map(.name) | index("status:blocked") | not) | select(.labels | map(.name) | index("status:in-progress") | not) | "#\(.number): \(.title)"' \
  2>/dev/null | head -5 || echo "  (unable to list ready work)"

# Show in-progress
echo ""
echo "In progress:"
gh issue list --state open --label "status:in-progress" --json number,title \
  --jq '.[] | "#\(.number): \(.title)"' \
  2>/dev/null | head -5 || echo "  (none)"

echo ""
echo "✓ Use 'gh issue list' to see all issues."
```

## New Task Workflow Skill

```markdown
# Task Workflow

All work goes through GitHub Issues (persistence) + native Tasks (session orchestration).

## Core Workflow

1. **Find work:** `gh issue list --state open` or check session start output
2. **Claim it:** `gh issue edit <number> --add-label status:in-progress`
3. **Track in-session:** TaskCreate for the work unit
4. **Do the work:** Write code, following existing patterns
5. **Verify:** `bun run typecheck && bun run lint && bun run test:run`
6. **Complete:** `gh issue close <number> --comment "Evidence: ..."`
7. **Checkpoint:** Commit immediately after closing
```

## New /task Command

```markdown
# Task Command (replaces /bead)

| Subcommand | Usage | Description |
|---|---|---|
| `work` | `/task work <number>` | Pick up issue, load context, start working |
| `show` | `/task show <number>` | Show issue details |
| `close` | `/task close <number>` | Mark complete with evidence |
| `ready` | `/task ready` | List unblocked issues |
```

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **Lost dependency graph** | High | Body convention + agent parsing |
| **No `bd ready` equivalent** | Medium | Session hook computes ready set |
| **GH API rate limits** | Low | 5000/hr authenticated, ample for this use |
| **Label explosion** | Medium | Prune unused labels periodically |
| **Historical data loss** | Low | Keep `.beads/issues.jsonl` in git history |
| **Army scripts break** | Medium | Rewrite scripts to use `gh` CLI |
| **Session hydration overhead** | Low | Only hydrate relevant issues |

## What We Gain

1. **Single source of truth** — no more bd vs native Tasks confusion
2. **No external binary** — `gh` ships with GitHub CLI (already used)
3. **Native GitHub integration** — issues visible in repo, PRs can reference them
4. **Claude Code alignment** — native Tasks for in-session, GH Issues for persistence
5. **Simpler session setup** — no version checks, doctor, binary vendoring
6. **Team visibility** — non-agent team members can see/create issues in GitHub UI
7. **CI integration** — GitHub Actions can react to issue events natively

## What We Lose

1. **Automatic dependency resolution** — `bd ready` just worked; we need to compute it
2. **Hash-based IDs** — beads IDs were merge-safe; GH issue numbers are sequential
3. **Offline operation** — beads worked offline; GH Issues requires network
4. **JSONL portability** — beads data was in-repo; GH Issues are in GitHub's API
5. **bd-specific features** — swarm mode, repair, compaction

## Implementation Priority

| Step | Effort | Description |
|---|---|---|
| 1. Create labels + milestones | Low | One-time setup script |
| 2. Migrate open beads → GH Issues | Medium | One-time migration script |
| 3. Rewrite `task-workflow` skill | Medium | Core workflow skill |
| 4. Rewrite `/task` command | Low | Direct port of `/bead` |
| 5. Rewrite session hook | Low | Simple `gh` queries |
| 6. Rewrite army skills | High | 6 sub-process files |
| 7. Rewrite army scripts | Medium | 2 scripts need changes |
| 8. Update CLAUDE.md + settings | Low | Search-and-replace |
| 9. Delete `.beads/` | Low | `rm -rf .beads` |
| 10. Verify full workflow | Medium | End-to-end test |

## References

- [Claude Code v2.1.16 Release (Tasks)](https://github.com/anthropics/claude-code/releases/tag/v2.1.16)
- [Claude Code Tasks Overview (Medium)](https://medium.com/@joe.njenga/claude-code-tasks-are-here-new-update-turns-claude-code-todos-to-tasks-a0be00e70847)
- [Claude Code Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Beads + Opus 4.5 Friction (Issue #429)](https://github.com/steveyegge/beads/issues/429)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Claude Code Swarm Orchestration Gist](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea)
