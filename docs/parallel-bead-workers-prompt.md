# Parallel Bead Workers with Claude Code

This document describes how to use Claude Code's async Task tool to work on multiple beads in parallel.

## Quick Start

Paste this into Claude Code to enable parallel bead execution:

```
I want to work on multiple beads in parallel. Please:
1. Run `bd ready --limit 10` to find available work
2. Identify 2-3 beads that modify DIFFERENT files (no overlap)
3. Dispatch bead-worker Tasks in parallel using run_in_background
4. Monitor progress and report when complete
```

## How It Works

Claude Code's Task tool with `run_in_background: true` creates async subagents that work independently. Each worker:

1. Claims a bead with `bd update <id> --status in_progress`
2. Completes the work autonomously
3. Verifies with typecheck/lint
4. Closes with `bd close <id> -r "summary"`
5. Signals completion back to main agent

## Key Implementation Details

### No Custom Agent Files Needed

Unlike the original design, Claude Code doesn't use `.claude/agents/` definition files. Instead, the worker behavior is controlled entirely by the **prompt** passed to the Task tool.

### File Independence is Critical

Before dispatching workers, verify beads don't modify the same files:

- Check bead descriptions for file paths mentioned
- Beads creating NEW files are generally safe to parallelize
- Beads modifying the SAME existing file will conflict

### Bead-Worker Prompt Template

```
You are a bead-worker agent. Complete the bead [ID] autonomously.

PROJECT CONTEXT:
[Brief description of project, stack, key patterns]

YOUR TASK ([ID]): [Title]
[Description from bead]

WORKFLOW:
1. Run `bd show [ID]` to confirm details
2. Run `bd update [ID] --status in_progress`
3. Write tests FIRST in src/__tests__/ for the feature
4. Implement the feature to make tests pass
5. Verify: `bun test && bun run typecheck && bun run lint`
6. Close: `bd close [ID] -r "Brief summary"`

If you discover additional work needed, create new beads.

IMPORTANT: Only modify [specific files] - no other files.
IMPORTANT: You MUST call `bd close [ID]` when done - do not skip this step.
```

### Subagent Permissions

Background subagents share your permission state but **cannot prompt for approval**. If they hit a permission wall, they fail silently.

**Before dispatching workers**, ensure these commands are pre-approved:

- `bd *` commands (show, update, close, create, sync, ready, etc.)
- `bun test`, `bun run typecheck`, `bun run lint`
- File operations in the project directory

If a worker fails unexpectedly, check if it hit a permission issue and add the command pattern to your allow list.

### Dispatching Multiple Workers

Use a single message with multiple Task calls:

```typescript
// All three dispatch in the same message = true parallel execution
Task(bead-worker-1, run_in_background: true)
Task(bead-worker-2, run_in_background: true)
Task(bead-worker-3, run_in_background: true)
```

### Monitoring Progress

- Workers signal completion automatically via TaskOutput
- Use `TaskOutput(id, block: false)` for status check without waiting
- Use `TaskOutput(id, block: true)` when you need results before continuing

## AGENTS.md Section

Add this to your project's AGENTS.md:

```markdown
## Parallel Bead Execution (Async Subagents)

This project supports parallel bead processing using Claude Code's async Task tool.

### Quick Start

To work on multiple beads simultaneously:

1. Run `bd ready` to find available work
2. Identify 2-3 beads that modify different files
3. Ask Claude to dispatch bead-workers in parallel

### Rules for Parallel Dispatch

- **File independence**: Only dispatch beads that don't modify the same files
- **Dependency check**: Use `bd dep tree <id>` to avoid blocked beads
- **Max concurrency**: Limit to 3-4 concurrent workers
- **Flat delegation**: Main agent → workers only (no nested sub-workers)

### Before Ending Session

1. Wait for all workers to complete: `TaskOutput` with block=true
2. Run `bd sync` to flush bead updates
3. Verify no orphaned work: `bd list --status in_progress`
4. Commit and push all changes
```

## Lessons Learned

1. **Sonnet works well for workers** - Fast enough for individual tasks, capable of full implementation
2. **Haiku for monitoring only** - Use for lightweight coordination/status checking
3. **Explicit file boundaries** - Always tell workers exactly which files they can touch
4. **Context per worker** - Each worker needs project context in its prompt (they don't share memory)
5. **bd handles concurrency** - Hash-based IDs prevent database conflicts between workers

## Example Session

```
User: Work on 3 beads in parallel

Claude: Let me find independent beads...
[Runs bd ready, analyzes file dependencies]

Found 3 independent beads:
- buildseason-4lw (invite links) → src/routes/teams.tsx
- buildseason-6dn (vendor list) → NEW src/routes/vendors.tsx
- buildseason-cyf (test fixtures) → NEW src/__tests__/fixtures/

Dispatching 3 bead-workers in parallel...
[Launches 3 Task agents with run_in_background: true]

Workers running. I'll check on progress...
[Uses TaskOutput to monitor]

All 3 workers completed successfully:
- buildseason-4lw: Added team invite links with token generation
- buildseason-6dn: Created vendor list page with filtering
- buildseason-cyf: Set up test utilities and factories

Running bd sync and verifying...
```
