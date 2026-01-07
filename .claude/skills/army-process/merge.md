# Merge Sub-Process

The merge phase integrates worktrees back to main in a deterministic order after all missions complete.

## When to Use

Called automatically after all wave missions complete, before review.

Or manually:

```
/army merge <wave-number>
```

## Prerequisites

- All missions in wave have completed
- Agents have committed to their mission branches
- Merge order determined during plan phase (in wave bead)

## Why Deterministic Merge

**Problem:** Merging worktrees as missions complete creates non-deterministic results. Mission A might merge first in one run, Mission B first in another—leading to different conflict resolution paths.

**Solution:** Planned merge order, executed after ALL missions complete.

## Steps

### 1. Verify All Missions Complete

```bash
# Check for incomplete beads in wave
bd list --status open --label "wave:N" --label "mission:*"

# Should be empty (only checkpoint should remain)
```

### 2. Get Merge Order

Read from wave bead description:

```bash
bd show <wave-bead-id>
```

Look for "Merge Order" section:

```markdown
## Merge Order

1. discord-bot (isolated, no dependencies)
2. navigation (depends on shared/ui from discord-bot)
3. auth-improvements (main effort, merges last)
```

### 3. Execute Merge Sequence

```bash
# For each mission in merge_order:

# 1. Ensure on main
git checkout main

# 2. Merge the mission branch
git merge mission/<mission-id> --no-ff -m "Merge mission/<mission-id>: <mission-title>"

# 3. If conflict, resolve using AO ownership
#    - The mission owns its AO files, so use their version
#    - For shared files, use merge-base analysis
#    - If unclear, flag for human review

# 4. Continue to next mission
```

### Conflict Resolution

When a conflict occurs:

1. **Identify the conflicting files**
2. **Check AO ownership from sync matrix**
   - If current mission owns the file → use current mission's version
   - If previous mission owns the file → should have been merged already
   - If shared file → analyze changes and merge manually
3. **Document resolution in merge commit**

```bash
# Example: resolve using current mission's version
git checkout --theirs <conflicting-file>
git add <conflicting-file>
git commit -m "Merge mission/<id>: resolved conflict in <file> using mission owner's version"
```

### 4. Clean Up Worktrees

After all missions merged:

```bash
# Remove each worktree
git worktree remove ~/.claude-worktrees/<project>-<mission-id>

# Prune stale metadata
git worktree prune
```

### 5. Verify Integration

```bash
# Run project verification
bun run typecheck
bun run test
bun run build
```

If verification fails:

1. Identify the failing change
2. Create fix bead
3. Fix locally or defer to deploy-fixes

### 6. Report Merge Complete

```
═══════════════════════════════════════════════════════════════
                 WAVE N MERGE COMPLETE
═══════════════════════════════════════════════════════════════

Missions Merged: X

Merge Order:
  1. ✓ discord-bot (clean)
  2. ✓ navigation (clean)
  3. ✓ auth-improvements (1 conflict resolved)

Conflicts: 1
  • shared/api-client.ts - resolved using auth-improvements version

Worktrees Cleaned: X

Verification:
  ✓ Typecheck passed
  ✓ Tests passed
  ✓ Build succeeded

Ready for: /army review N
═══════════════════════════════════════════════════════════════
```

## Merge Order Rules

During plan, merge order is determined by:

1. **AoI-on-AO dependencies:**
   - If Mission A has AoI on files Mission B modifies
   - B should merge first (A gets to see B's changes)

2. **Main effort priority:**
   - Main effort mission merges last
   - Gets final say on any shared files

3. **Minimal conflict surface:**
   - Missions with smaller/isolated AOs merge first
   - Larger missions that touch more files merge later

## Script Usage

```bash
# Execute merge with ordered integration
./scripts/merge-worktrees.sh <wave-number>
```

The script:

1. Reads merge order from wave bead
2. Executes merges in order
3. Handles conflicts according to AO rules
4. Cleans up worktrees
5. Reports status

## Checklist

- [ ] All missions in wave complete
- [ ] Merge order read from wave bead
- [ ] Merges executed in order
- [ ] Conflicts resolved using AO ownership
- [ ] Worktrees removed
- [ ] Verification passed
- [ ] Merge report generated
