# Retro Sub-Process

The retro phase analyzes agent trajectories, identifies skill improvement opportunities, and feeds learnings into the next plan cycle.

## Usage

```
/army retro <wave-number>
```

## Prerequisites

- Wave N checkpoint closed by human
- Reviews completed
- All feedback processed

## Steps

### 1. Gather Defect Beads

Find all defects from this wave:

```bash
# Find beads discovered during wave N review
bd list --label "discovered-from:*" --label "wave:N"

# Or search for review-related beads
bd list --label "review:*" --label "wave:N"
```

Group defects by:

- Original bead they relate to
- Review type (code, security, ui)
- Severity (P0-P4)

### 2. Analyze Agent Trajectories

For each bead that generated defects:

1. **What skills were designated?**
   - Check `skill:*` labels on the original bead

2. **What skills were actually used?**
   - Read the bead's close message (should list "Skills used: ...")
   - Check commit messages for skill references

3. **Did the agent follow the skill or deviate?**
   - Compare actual implementation to skill patterns
   - Note deviations and their outcomes

### Trajectory Analysis Template

```markdown
## Bead: <bead-id>

**Designated Skills:** skill:api-crud, skill:testing-patterns
**Skills Used (per close message):** skill:api-crud
**Defects Found:** 2

### Analysis

1. **Defect: Missing error handling**
   - Skill designated: skill:api-crud
   - Skill followed: Partially
   - Issue: Agent didn't follow error response pattern from skill
   - Root cause: Skill lacks explicit error handling examples

2. **Defect: No test coverage**
   - Skill designated: skill:testing-patterns
   - Skill followed: Not used
   - Issue: Agent skipped testing entirely
   - Root cause: Agent prioritized implementation over testing
```

### 3. Identify Skill Improvement Opportunities

Categorize findings:

| Finding                         | Action                             |
| ------------------------------- | ---------------------------------- |
| Skill not followed              | Improve prompting or skill clarity |
| Skill followed but wrong result | Improve skill content              |
| Missing skill                   | Flag for creation in next plan     |
| Skill fundamentally broken      | Trigger revert and retry           |

### 4. Create Process Improvement Beads

For each skill improvement opportunity:

```bash
bd create --title="Improve skill: <skill-name> - <issue>" \
  --label="process-improvement:retro-wave-N" \
  --label="skill:skill-builder" \
  --label="discovered-from:<defect-bead>" \
  --description="Agent was told to use skill:<name> but [didn't use it | used it incorrectly | skill was insufficient].

Analysis:
- Original bead: <bead-id>
- Defect: <description>
- Root cause: <analysis>

Recommended fix:
- [Update skill content | Improve skill prompting | Add examples]"
```

### 5. Analyze Boundary Violations

For any `coordination-required` beads created during the wave:

1. **Was this a planning defect?**
   - File should have been in the mission's AO
   - → Create improvement bead for planning skill

2. **Was this a legitimate cross-cutting concern?**
   - Coordination was unavoidable
   - → Track frequency for future planning
   - → Consider if work should be in a shared infrastructure mission

```bash
# Find coordination beads from this wave
bd list --label "coordination-required" --label "wave:N"
```

### 6. Revert and Retry (for Broken Skills)

When a skill is fundamentally broken (caused systematic failures):

```
Revert and Retry Flow:
    │
    ├── Identify affected mission(s) that used the broken skill
    │
    ├── Revert the mission's worktree changes:
    │   git checkout main -- <files in mission AO>
    │
    ├── Reopen the mission beads:
    │   bd update <bead-id> --status=open
    │
    ├── Rewrite or replace the skill entirely:
    │   - Create skill:skill-builder bead with high priority
    │   - Execute skill rebuild immediately
    │   - Commit new skill
    │
    └── Re-run the affected mission with corrected skill
```

**When to trigger revert and retry:**

- 3+ defects from same skill
- P0-P1 defects caused by skill
- Agent clearly following skill but producing bad results
- Pattern issue, not edge case

### 7. Output Retro Summary

Save retrospective documents to:

```
docs/waves/wave-N/retrospective.md
```

Create the wave folder if it doesn't exist:

```bash
mkdir -p docs/waves/wave-N
```

**Console Summary:**

```
═══════════════════════════════════════════════════════════════
                 WAVE N RETROSPECTIVE
═══════════════════════════════════════════════════════════════

Beads Completed: X
Defects Found: Y (P0: a, P1: b, P2: c, P3: d)

Skill Effectiveness:
  • skill:api-crud: Used 5 times, 2 defects → Needs improvement
  • skill:api-patterns: Used 3 times, 0 defects → Effective
  • skill:testing-patterns: Used 1 time, 1 defect → Underutilized

Defect Analysis:
  • skill:api-crud: 2 defects → Missing error handling examples
  • skill:testing-patterns: 1 defect → Agent skipped, prompting issue

Trajectory Issues:
  • 2 beads had skills not followed (prompting issue)
  • 1 bead had skill followed incorrectly (content issue)

Boundary Violations: Z
  • 1 planning defect (should have expanded AO)
  • 2 legitimate cross-cutting (coordination worked)

Process Improvement Beads Created: W
  • Improve skill:api-crud - add error handling examples
  • Improve skill:testing-patterns - strengthen prompting
  • Update planning skill for AO estimation

Revert and Retry: [None | <mission> due to <skill>]

Next Actions:
  These improvements will be executed in: /army plan N+1

═══════════════════════════════════════════════════════════════
```

## Metrics to Track

Over time, track:

- Defects per wave (trending down is good)
- Skills usage frequency
- Skills effectiveness (defects per use)
- Boundary violations per wave
- Revert and retry frequency

## Checklist

- [ ] Defect beads gathered and grouped
- [ ] Agent trajectories analyzed for each defect
- [ ] Skill improvement opportunities identified
- [ ] Process improvement beads created with proper labels
- [ ] Boundary violations analyzed
- [ ] Revert and retry triggered if needed
- [ ] Retro summary output generated
- [ ] Learnings ready for next plan cycle
