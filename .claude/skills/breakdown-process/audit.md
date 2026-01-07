# Audit Breakdown Process

Re-check a specification against existing beads. Identify gaps, add missing beads, update labels.

## When to Use

- After initial breakdown, to verify completeness
- After skill improvements (e.g., new label conventions)
- Before archiving a spec to ensure nothing was missed
- When spec was updated and beads need to catch up

## Input

- Path to spec document (e.g., `docs/requirements.md`)

## Process

### Step 1: Find Existing Beads from This Spec

```bash
# Get all beads created from this spec
bd list --label discovered-from:doc:<docname> --long
```

If no beads have this label, this spec may have been broken down before the label convention existed. Proceed to Step 2 to find matches by content.

### Step 2: Read the Spec and Build Item List

```bash
Read <spec-file>
```

Create a checklist of all actionable items in the spec:

```
Spec Items:
[ ] Parts & BOM Management (epic)
[ ] OnShape integration (feature)
[ ] Real-time BOM sync (task)
[ ] Part search by SKU/name (task)
[ ] Inventory Management (epic)
[ ] Location tracking (feature)
...
```

### Step 3: Match Spec Items to Existing Beads

For each spec item, search for matching beads:

```bash
# Search by title keywords
bd list --title-contains "OnShape"
bd list --title-contains "BOM sync"
bd list --title-contains "Part search"
```

Also check:

```bash
# Search by description content
bd list --desc-contains "real-time"
bd list --desc-contains "inventory"
```

Update your checklist:

```
Spec Items:
[✓] Parts & BOM Management → buildseason-abc (epic)
[✓] OnShape integration → buildseason-def (feature)
[ ] Real-time BOM sync → NO MATCH (gap!)
[✓] Part search → buildseason-ghi (task)
[ ] Inventory location tracking → NO MATCH (gap!)
```

### Step 4: Identify Gaps and Updates

**Gaps** (spec item with no matching bead):

- Create a new bead following initial.md process
- Apply `discovered-from:doc:<docname>` label

**Matches needing updates:**

- Missing `discovered-from:doc:<docname>` label (add it)
- Missing `ao:<pattern>` label (add if now known)
- Missing `skill:<name>` label (add if skill exists)
- Description outdated vs spec (update)
- Success criteria missing/incomplete (add)

### Step 5: Create Missing Beads

For each gap:

```bash
bd create \
  --title="<Title from spec>" \
  --type=<epic|feature|task> \
  --parent=<parent-id if applicable> \
  --priority=<P0-P4> \
  --labels "discovered-from:doc:<docname>" \
  --description="## Goal

<From spec>

## Success Criteria

- [ ] <From spec acceptance criteria>

## Area of Operations

- <File patterns>

## Notes

Added during audit pass on <date>.
Previously missing from initial breakdown."
```

### Step 6: Update Existing Beads

**Add missing source label:**

```bash
bd label <bead-id> discovered-from:doc:<docname>
```

**Add skill label:**

```bash
bd label <bead-id> skill:<skill-name>
```

**Add AO label:**

```bash
bd label <bead-id> ao:<pattern>
```

**Update description** (if significant spec content was missed):

```bash
bd show <bead-id>  # Get current description
# Edit to add missing success criteria, AO, etc.
bd update <bead-id> --description="..."
```

### Step 7: Verify Dependencies

Check if new beads need dependencies:

```bash
# Show the bead and what it might depend on
bd show <new-bead-id>

# Add dependency if needed
bd dep add <new-bead-id> <depends-on-id>
```

### Step 8: Generate Audit Summary

```
═══════════════════════════════════════════════════════════════
                    AUDIT COMPLETE
═══════════════════════════════════════════════════════════════

Spec: <spec-file>
Query: bd list --label discovered-from:doc:<docname>

Spec Coverage Analysis:
  • Total spec items identified: 47
  • Existing beads with label: 38
  • Existing beads matched (no label): 7
  • Gaps (no matching bead): 2

Actions Taken:

Created (2):
  • [task] buildseason-xxx: Real-time BOM sync
  • [feature] buildseason-yyy: Inventory location tracking

Labels Added (7):
  • buildseason-aaa: +discovered-from:doc:requirements.md
  • buildseason-bbb: +discovered-from:doc:requirements.md
  • buildseason-ccc: +discovered-from:doc:requirements.md, +skill:api-patterns
  ...

Updated (0):
  (none)

No Action Needed (38):
  Already properly labeled and matched

Verify: bd list --label discovered-from:doc:<docname> --pretty

Archive spec now? [Y/n]
═══════════════════════════════════════════════════════════════
```

### Step 9: Archive (If Confirmed)

Same as initial breakdown:

```bash
mkdir -p docs/archive
mv <spec-file> docs/archive/$(basename <spec-file> .md)-$(date +%Y-%m-%d).md
git add -A
git commit -m "archive: <docname> audit complete

Audit results:
- 47 spec items verified
- 2 gaps filled (new beads)
- 7 beads labeled with source
- 38 already complete

Query: bd list --label discovered-from:doc:<docname>"
```

## Tips

### Finding Unlabeled Beads from Old Breakdowns

If beads exist but lack the `discovered-from:doc:*` label:

1. **By timing**: Beads created around when spec was written

   ```bash
   bd list --created-after 2024-12-29 --created-before 2025-01-01
   ```

2. **By title patterns**: Match section headers

   ```bash
   bd list --title-contains "Parts"
   bd list --title-contains "Inventory"
   ```

3. **By parent**: Find the epic and its children
   ```bash
   bd list --parent <epic-id>
   ```

### Handling Spec Changes

If the spec was updated after initial breakdown:

1. Identify new/changed sections in spec
2. Search for beads covering old content
3. Update existing beads OR create new ones
4. Don't delete beads just because spec changed (beads may have progress)

### Label Backfill Strategy

When adding labels to many beads:

```bash
# Get list of IDs
bd list --title-contains "Parts" --format "{{.ID}}" > /tmp/parts-beads.txt

# Add label to each (or do in parallel)
for id in $(cat /tmp/parts-beads.txt); do
  bd label $id discovered-from:doc:requirements.md
done
```

### Partial Audits

You can audit specific sections:

```bash
# Just audit the "Parts & BOM" section
/breakdown audit docs/requirements.md --section "Parts & BOM"
```

This focuses on matching just that section's items.
