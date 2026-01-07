# Initial Breakdown Process

Convert a specification document into structured beads for the first time.

## Input

- Path to spec document (e.g., `docs/requirements.md`)

## Process

### Step 1: Read and Analyze the Spec

```bash
# Read the full spec
Read <spec-file>
```

While reading, identify:

1. **Major sections** → potential epics
2. **Feature descriptions** → features under epics
3. **Specific requirements** → tasks under features
4. **User stories** → features or tasks
5. **Acceptance criteria** → success criteria for beads

### Step 2: Create Document Map

Before creating beads, create a mental map:

```
Spec: requirements.md
├── Section: "Parts & BOM Management" (lines 750-830)
│   ├── Feature: OnShape integration
│   ├── Feature: Part search
│   └── Feature: BOM tracking
├── Section: "Inventory Management" (lines 780-860)
│   ├── Feature: Location tracking
│   └── Feature: Low-stock alerts
└── Section: "Order Management" (lines 810-920)
    ├── Feature: Multi-vendor cart
    └── Feature: Approval workflow
```

### Step 3: Determine Epic Structure

Decide how to organize:

**Option A: One epic for entire spec**

- Use when spec is focused on a single capability
- Example: `onshape-integration.md` → single epic

**Option B: Multiple epics for major sections**

- Use when spec covers multiple distinct areas
- Example: `requirements.md` → epics for Parts, Inventory, Orders, etc.

**Option C: Epic already exists, add children**

- Use when spec expands an existing epic
- Find parent first: `bd list --type epic --title-contains "..."`

### Step 4: Create Beads (Top-Down)

Create in order: epics first, then features, then tasks.

**For each epic:**

```bash
bd create \
  --title="<Epic title from spec section>" \
  --type=epic \
  --priority=<P0-P4 based on spec emphasis> \
  --labels "discovered-from:doc:<docname>" \
  --description="## Goal

<Summary from spec>

## Success Criteria

- [ ] <High-level outcome 1>
- [ ] <High-level outcome 2>

## Scope

<What's included and excluded>"
```

**For each feature under an epic:**

```bash
bd create \
  --title="<Feature title>" \
  --type=feature \
  --parent=<epic-id> \
  --priority=<P0-P4> \
  --labels "discovered-from:doc:<docname>" \
  --description="## Goal

<Feature description from spec>

## Success Criteria

- [ ] <Acceptance criterion 1>
- [ ] <Acceptance criterion 2>

## Area of Operations

- <file patterns this feature owns>

## Area of Interest

- <reference files for context>"
```

**For each task under a feature:**

```bash
bd create \
  --title="<Specific task>" \
  --type=task \
  --parent=<feature-id> \
  --priority=<P0-P4> \
  --labels "discovered-from:doc:<docname>,ao:<pattern>" \
  --description="## Goal

<What specifically needs to be done>

## Success Criteria

- [ ] <Specific, testable outcome>

## Area of Operations

- <specific files this task modifies>"
```

### Step 5: Add Dependencies

After creating all beads, add dependencies:

```bash
# If task B requires task A to complete first
bd dep add <task-B-id> <task-A-id>
```

Look for dependency signals in the spec:

- "After X is complete..."
- "Requires Y to be in place..."
- "Depends on Z..."
- Logical ordering (can't test what isn't built)

### Step 6: Add Skill Labels (If Applicable)

Check existing skills:

```bash
ls .claude/skills/
```

If a skill applies to beads:

```bash
bd label <bead-id> skill:<skill-name>
```

Common skill assignments:

- API routes → `skill:api-patterns`
- UI components → `skill:navigation-patterns`
- Tests → `skill:testing-guide`
- Security → `skill:security-review`

### Step 7: Verify Coverage

Ensure nothing was missed:

1. **Count spec items vs beads:**

   ```bash
   bd list --label discovered-from:doc:<docname> | wc -l
   ```

2. **Review structure:**

   ```bash
   bd list --label discovered-from:doc:<docname> --pretty
   ```

3. **Check for orphans** (features without tasks, etc.)

### Step 8: Generate Summary

Output the breakdown summary:

```
═══════════════════════════════════════════════════════════════
                 BREAKDOWN COMPLETE
═══════════════════════════════════════════════════════════════

Spec: <spec-file>
Label: discovered-from:doc:<docname>

Beads Created:
  • [epic] <id>: <title>
    ├── [feature] <id>: <title>
    │   ├── [task] <id>: <title>
    │   └── [task] <id>: <title>
    └── [feature] <id>: <title>

Total: X epics, Y features, Z tasks

Dependencies Added: N

Verify: bd list --label discovered-from:doc:<docname> --pretty

Archive spec now? [Y/n]
═══════════════════════════════════════════════════════════════
```

### Step 9: Archive (If Confirmed)

```bash
mkdir -p docs/archive
mv <spec-file> docs/archive/$(basename <spec-file> .md)-$(date +%Y-%m-%d).md
git add -A
git commit -m "archive: <docname> broken down to beads

Created X beads with label discovered-from:doc:<docname>
- N epics
- N features
- N tasks

Query: bd list --label discovered-from:doc:<docname>"
```

## Tips

### Granularity

- **Too coarse**: "Implement the entire inventory system" (bad - not actionable)
- **Too fine**: "Add import statement for React" (bad - not meaningful)
- **Just right**: "Implement low-stock alert notifications" (good - clear scope, testable)

### Preserving Spec Context

Include relevant quotes from the spec in bead descriptions:

```markdown
## From Spec

> "The system should proactively notify students when parts they're
> waiting on ship, eliminating the need for manual status checks."
```

### Handling Ambiguity

If the spec is vague:

1. Create the bead with what you know
2. Add a note: "## Open Questions\n- [ ] Clarify: ..."
3. The bead exists for tracking; details can be refined

### Parallel Creation

When creating many beads, use parallel subagents:

```
Launch 3 agents in parallel:
- Agent 1: Create Parts & BOM beads
- Agent 2: Create Inventory beads
- Agent 3: Create Order beads
```
