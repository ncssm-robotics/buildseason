#!/bin/bash
# copy-worktreeinclude.sh - Copy gitignored files to a worktree
#
# Usage: ./copy-worktreeinclude.sh <worktree-path>
#
# Reads .worktreeinclude file and copies matching gitignored files
# to the specified worktree.

set -e

WORKTREE_PATH=$1
SOURCE_DIR=$(pwd)

if [ -z "$WORKTREE_PATH" ]; then
    echo "Usage: ./copy-worktreeinclude.sh <worktree-path>"
    exit 1
fi

if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Error: Worktree path does not exist: $WORKTREE_PATH"
    exit 1
fi

INCLUDE_FILE=".worktreeinclude"

if [ ! -f "$INCLUDE_FILE" ]; then
    echo "No .worktreeinclude file found"
    echo ""
    echo "Create one with patterns for gitignored files that should be copied:"
    echo "  .env"
    echo "  .env.local"
    echo "  .env.*"
    echo "  **/.claude/settings.local.json"
    exit 0
fi

echo "Copying files from .worktreeinclude to $WORKTREE_PATH"
echo "───────────────────────────────────────────────────────────────"

# Read each pattern and copy matching files
while IFS= read -r pattern || [ -n "$pattern" ]; do
    # Skip empty lines and comments
    [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue

    # Find files matching the pattern that are also gitignored
    while IFS= read -r file; do
        if [ -n "$file" ] && [ -f "$file" ]; then
            # Check if file is gitignored
            if git check-ignore -q "$file" 2>/dev/null; then
                # Create directory structure in worktree
                TARGET_DIR="$WORKTREE_PATH/$(dirname "$file")"
                mkdir -p "$TARGET_DIR"

                # Copy the file
                cp "$file" "$WORKTREE_PATH/$file"
                echo "  ✓ $file"
            fi
        fi
    done < <(find . -path "./.git" -prune -o -path "$pattern" -print 2>/dev/null | grep -v "^./.git")
done < "$INCLUDE_FILE"

echo ""
echo "Done."
