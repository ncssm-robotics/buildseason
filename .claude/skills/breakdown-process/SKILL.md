---
name: breakdown-process
description: >-
  Convert specification documents into structured beads. Use when breaking down
  requirements, specs, or design docs into actionable work items. Handles initial
  breakdown and audit/update passes.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bd:*), Bash(git:*), Bash(mkdir:*), Bash(mv:*)
---

# Breakdown Process Meta-Skill

Convert specification documents into structured beads, creating an audit trail via labels.

## Sub-Process Overview

| Sub-Process           | File       | When to Use                          |
| --------------------- | ---------- | ------------------------------------ |
| [Initial](initial.md) | initial.md | First breakdown of a new spec        |
| [Audit](audit.md)     | audit.md   | Re-check spec against existing beads |

## Core Principles

### 1. Specs Are Scratchpads, Beads Are Truth

Specs exist for thinking and planning. Once broken down:

- The beads become the authoritative source
- The spec should be archived
- Updates happen to beads, not specs

### 2. Audit Trail via Labels

Every bead created from a spec gets:

```
discovered-from:doc:<docname>
```

This enables:

```bash
# What came from this spec?
bd list --label discovered-from:doc:requirements.md

# How many beads from each spec?
bd list --label-any discovered-from:doc:requirements.md,discovered-from:doc:specification.md
```

### 3. Hierarchical Structure

Specs break down into a hierarchy:

```
Epic (the spec's main purpose)
├── Feature (major capability)
│   ├── Task (specific implementation work)
│   └── Task
├── Feature
│   └── Task
└── Feature
```

### 4. Each Bead Should Be Independently Actionable

A well-formed bead from breakdown has:

- **Clear title**: What, not how
- **Success criteria**: How we know it's done
- **AO (Area of Operations)**: File patterns this work owns
- **Dependencies**: What must be done first
- **Appropriate type**: epic, feature, task, bug

## Bead Structure Template

When creating beads from specs, use this structure:

```markdown
## Goal

[1-2 sentences from the spec describing what this accomplishes]

## Success Criteria

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

## Area of Operations

- path/to/files/\*\*
- another/path/\*\*

## Area of Interest

- reference/files/for/context.ts

## Notes

[Any additional context from the spec that's relevant]
```

## Matching Spec Items to Bead Types

| Spec Language                     | Bead Type |
| --------------------------------- | --------- |
| "The system should..."            | feature   |
| "Users can..."                    | feature   |
| "Implement..."                    | task      |
| "Create...", "Add...", "Build..." | task      |
| "Fix...", "Resolve..."            | bug       |
| Major section header              | epic      |
| "Phase N: ..."                    | epic      |

## Label Conventions

All beads from breakdown get:

| Label                           | When                             |
| ------------------------------- | -------------------------------- |
| `discovered-from:doc:<docname>` | Always (audit trail)             |
| `ao:<pattern>`                  | When AO is identifiable          |
| `skill:<name>`                  | When appropriate skill exists    |
| `wave:<N>`                      | Only if wave assignment is clear |
| `priority:P0-P4`                | Based on spec emphasis           |

## Archive After Breakdown

After successful breakdown:

1. Confirm all spec items are captured in beads
2. Offer to archive the spec
3. Archive moves to `docs/archive/<name>-<date>.md`
4. Commit with message explaining the archive

## Reference

- Command: `.claude/commands/breakdown.md`
- Related: `army-process` (works with beads after breakdown)
- Related: `skill-building` (may need new skills for breakdown items)
