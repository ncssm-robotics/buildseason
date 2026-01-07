# Breakdown Command

Convert specification documents into structured beads, then archive the spec.

## Subcommand Routing

Parse the first argument to determine mode:

| Mode      | Usage                            | Skill Document                                |
| --------- | -------------------------------- | --------------------------------------------- |
| (default) | `/breakdown <spec-file>`         | `.claude/skills/breakdown-process/initial.md` |
| `audit`   | `/breakdown audit <spec-file>`   | `.claude/skills/breakdown-process/audit.md`   |
| `archive` | `/breakdown archive <spec-file>` | See Archive section below                     |

## How to Execute

For the given mode:

1. Read the corresponding skill document from the table above
2. Follow its process exactly
3. After successful breakdown/audit, offer to archive the spec

## Label Convention: Audit Trail

**All beads created from a spec MUST have:**

```
discovered-from:doc:<docname>
```

Examples:

- `discovered-from:doc:requirements.md`
- `discovered-from:doc:specification.md`
- `discovered-from:doc:onshape-integration.md`

This enables:

```bash
# Find all beads from a spec
bd list --label discovered-from:doc:requirements.md

# Audit: what did we create from this spec?
bd list --label discovered-from:doc:requirements.md --pretty
```

## Archive Mode

Direct execution (no skill needed):

```bash
# Create archive directory if needed
mkdir -p docs/archive

# Move spec with timestamp
mv <spec-file> docs/archive/$(basename <spec-file> .md)-$(date +%Y-%m-%d).md

# Commit the move
git add -A
git commit -m "archive: move <spec-file> to archive (broken down to beads)"
```

## Philosophy

**Specs are scratchpads. Beads are truth.**

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC LIFECYCLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DRAFTING     docs/foo.md        ← Thinking, planning       │
│       │                                                     │
│       ▼                                                     │
│  BREAKDOWN    /breakdown docs/foo.md                        │
│       │           │                                         │
│       │           ├── Epic bead created                     │
│       │           ├── Child beads with AO, deps             │
│       │           ├── discovered-from:doc:foo.md label      │
│       │           └── Success criteria captured             │
│       ▼                                                     │
│  ARCHIVE      docs/archive/foo-2025-01-07.md                │
│                   │                                         │
│                   └── Historical reference only             │
│                                                             │
│  EXECUTION    Beads ARE the spec now                        │
│               - bd show, bd list, bd ready                  │
│               - Single source of truth                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Examples

**Initial breakdown of a new spec:**

```
/breakdown docs/onshape-integration.md
```

**Re-audit after skill improvements (e.g., new label convention):**

```
/breakdown audit docs/requirements.md
```

**Archive a spec that's already been broken down:**

```
/breakdown archive docs/requirements.md
```

## Output Format

After breakdown completes:

```
═══════════════════════════════════════════════════════════════
                 BREAKDOWN COMPLETE
═══════════════════════════════════════════════════════════════

Spec: docs/requirements.md
Label: discovered-from:doc:requirements.md

Beads Created:
  • [epic] buildseason-xxx: BuildSeason MVP
    ├── [feature] buildseason-yyy: Parts & BOM Management
    ├── [feature] buildseason-zzz: Inventory Management
    └── ... (N more)

Total: X epics, Y features, Z tasks

Archive spec now? [Y/n]
═══════════════════════════════════════════════════════════════
```

After audit completes:

```
═══════════════════════════════════════════════════════════════
                    AUDIT COMPLETE
═══════════════════════════════════════════════════════════════

Spec: docs/requirements.md
Query: bd list --label discovered-from:doc:requirements.md

Existing Coverage:
  • 47 spec items found in document
  • 45 have matching beads ✓
  • 2 gaps identified

Created (with discovered-from:doc:requirements.md):
  • [task] buildseason-aaa: Meal coordination workflow
  • [task] buildseason-bbb: Parent permission portal

Updated:
  • buildseason-ccc: Added skill:api-patterns label
  • buildseason-ddd: Updated AO to include new path

No Action Needed:
  • 45 beads already match spec

Archive spec now? [Y/n]
═══════════════════════════════════════════════════════════════
```

## Reference: Related Labels

| Label Pattern                | Purpose                          |
| ---------------------------- | -------------------------------- |
| `discovered-from:doc:<name>` | Bead came from spec document     |
| `discovered-from:<bead-id>`  | Bead came from review of another |
| `related-to:<bead-id>`       | Bead is related to another       |
| `spec:archived`              | Spec has been archived (on epic) |
