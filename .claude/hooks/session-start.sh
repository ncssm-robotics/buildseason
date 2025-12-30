#!/bin/bash
# .claude/hooks/session-start.sh
# Sets up bd (beads issue tracker) using vendored binary or global install

set -e

echo "🔗 Setting up bd (beads issue tracker)..."

BD_INSTALLED=false

# Check if bd is already installed globally
if command -v bd &> /dev/null && bd version &> /dev/null 2>&1; then
    echo "✓ bd already installed: $(bd version 2>/dev/null || echo 'unknown')"
    BD_INSTALLED=true
fi

# Use vendored binary (committed to repo for Claude Code Web)
if [ "$BD_INSTALLED" = false ]; then
    VENDORED_BD="$CLAUDE_PROJECT_DIR/.beads/bin/bd"
    if [ -x "$VENDORED_BD" ]; then
        export PATH="$CLAUDE_PROJECT_DIR/.beads/bin:$PATH"
        if bd version &> /dev/null 2>&1; then
            echo "✓ Using vendored bd: $(bd version 2>/dev/null || echo 'unknown')"
            BD_INSTALLED=true
        fi
    fi
fi

if [ "$BD_INSTALLED" = false ]; then
    echo "✗ bd not available"
    echo "  Install globally: bun install -g @beads/bd"
    exit 0
fi

# Show ready work
if [ -d .beads ]; then
    echo ""
    echo "Ready work:"
    bd ready --limit 5 2>/dev/null || echo "  (unable to list ready work)"
fi

echo ""
echo "✓ Beads ready! Use 'bd ready' to see available tasks."
