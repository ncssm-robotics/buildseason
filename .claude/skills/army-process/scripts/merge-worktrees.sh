#!/bin/bash
# merge-worktrees.sh - Execute ordered worktree integration
#
# Usage: ./merge-worktrees.sh <wave-number>
#
# Reads merge order from wave bead and integrates mission branches
# to main in the specified order.

set -e

WAVE=${1:-0}
WORKTREE_BASE="${HOME}/.claude-worktrees"
PROJECT_NAME=$(basename "$(pwd)")

echo "═══════════════════════════════════════════════════════════════"
echo "            WORKTREE MERGE: WAVE $WAVE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get wave bead to read merge order
WAVE_BEAD=$(bd list --label "wave:$WAVE" --type epic 2>/dev/null | head -1 | awk '{print $1}')

if [ -z "$WAVE_BEAD" ]; then
    echo "Error: No wave bead found for wave $WAVE"
    echo "Create a wave bead with: bd create --title='Wave $WAVE' --label='wave:$WAVE' --type=epic"
    exit 1
fi

echo "Wave bead: $WAVE_BEAD"
echo ""

# Read merge order from wave bead description
echo "Reading merge order from wave bead..."
echo "───────────────────────────────────────────────────────────────"

# In practice, parse the "## Merge Order" section from the bead description
# For now, list worktrees and propose order
echo ""
echo "Active worktrees for this project:"
git worktree list | grep "$PROJECT_NAME" || echo "  (no worktrees found)"
echo ""

# List mission branches
echo "Mission branches:"
git branch -a | grep "mission/" || echo "  (no mission branches found)"
echo ""

echo "───────────────────────────────────────────────────────────────"
echo ""
echo "Merge procedure (execute manually or enhance this script):"
echo ""
echo "For each mission in merge order:"
echo "  1. git checkout main"
echo "  2. git merge mission/<mission-id> --no-ff"
echo "  3. Resolve conflicts using AO ownership rules"
echo "  4. git worktree remove ~/.claude-worktrees/$PROJECT_NAME-<mission>"
echo ""
echo "After all merges:"
echo "  1. git worktree prune"
echo "  2. bun run typecheck"
echo "  3. bun run test"
echo ""
echo "═══════════════════════════════════════════════════════════════"
