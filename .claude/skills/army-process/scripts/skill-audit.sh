#!/bin/bash
# skill-audit.sh - Compare skill:* labels against existing skills
#
# Usage: ./skill-audit.sh [wave-number]
#
# Scans beads for skill:* labels and checks if corresponding
# skills exist in .claude/skills/

set -e

WAVE=${1:-""}
SKILLS_DIR=".claude/skills"

echo "═══════════════════════════════════════════════════════════════"
echo "                    SKILLS AUDIT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get existing skills
echo "Existing skills in $SKILLS_DIR:"
echo "───────────────────────────────────────────────────────────────"
if [ -d "$SKILLS_DIR" ]; then
    for skill in "$SKILLS_DIR"/*/; do
        if [ -d "$skill" ]; then
            SKILL_NAME=$(basename "$skill")
            if [ -f "$skill/SKILL.md" ]; then
                echo "  ✓ $SKILL_NAME"
            else
                echo "  ○ $SKILL_NAME (missing SKILL.md)"
            fi
        fi
    done
else
    echo "  (no skills directory found)"
fi
echo ""

# Get skill labels from beads
echo "Skill labels found in beads:"
echo "───────────────────────────────────────────────────────────────"

# Build filter for wave if specified
WAVE_FILTER=""
if [ -n "$WAVE" ]; then
    WAVE_FILTER="--label wave:$WAVE"
fi

# Extract unique skill:* labels
SKILL_LABELS=$(bd list --status open $WAVE_FILTER 2>/dev/null | \
    xargs -I {} bd show {} 2>/dev/null | \
    grep -oE 'skill:[a-zA-Z0-9_-]+' | \
    sort -u || echo "")

if [ -z "$SKILL_LABELS" ]; then
    echo "  (no skill:* labels found)"
else
    for label in $SKILL_LABELS; do
        SKILL_NAME=${label#skill:}
        if [ -d "$SKILLS_DIR/$SKILL_NAME" ] && [ -f "$SKILLS_DIR/$SKILL_NAME/SKILL.md" ]; then
            echo "  ✓ $label → exists"
        else
            echo "  ✗ $label → MISSING"
        fi
    done
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Audit Summary:"
echo "  - Missing skills must be created before deployment"
echo "  - Use skill:skill-builder to create new skills"
echo "  - See skill-building/SKILL.md for skill design patterns"
echo ""
echo "═══════════════════════════════════════════════════════════════"
