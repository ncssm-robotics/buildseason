#!/bin/bash
# sync-matrix.sh - Generate synchronization matrix from wave beads
#
# Usage: ./sync-matrix.sh <wave-number>
#
# Extracts AO and AoI patterns from mission beads in the specified wave
# and generates a File × Mission grid for conflict detection.

set -e

WAVE=${1:-0}

echo "═══════════════════════════════════════════════════════════════"
echo "            SYNCHRONIZATION MATRIX: WAVE $WAVE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get all mission beads for this wave
MISSIONS=$(bd list --label "wave:$WAVE" --label "mission:*" --format json 2>/dev/null || echo "[]")

if [ "$MISSIONS" = "[]" ]; then
    echo "No mission beads found for wave $WAVE"
    echo ""
    echo "To create mission structure:"
    echo "  1. Tag beads with wave:$WAVE label"
    echo "  2. Tag beads with mission:<name> label"
    echo "  3. Add ao:<pattern> and aoi:<pattern> labels"
    exit 0
fi

# Collect all unique file patterns
echo "Collecting AO/AoI patterns from mission beads..."
echo ""

# For each mission, extract patterns
# This is a simplified version - in practice, you'd parse the bead descriptions
# and labels to extract the actual patterns

bd list --label "wave:$WAVE" --status open 2>/dev/null | while read -r line; do
    BEAD_ID=$(echo "$line" | awk '{print $1}')
    if [ -n "$BEAD_ID" ]; then
        echo "Mission: $BEAD_ID"
        # Get labels for this bead
        bd show "$BEAD_ID" 2>/dev/null | grep -E "(ao:|aoi:|Area of)" || echo "  (no AO/AoI defined)"
        echo ""
    fi
done

echo "───────────────────────────────────────────────────────────────"
echo ""
echo "To complete the sync matrix:"
echo "  1. Extract AO patterns from each mission"
echo "  2. Extract AoI patterns from each mission"
echo "  3. Build grid showing overlaps"
echo "  4. Flag AO-on-AO conflicts (must resolve)"
echo "  5. Flag AoI-on-AO dependencies (decision point)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
