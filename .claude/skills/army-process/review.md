# Review Sub-Process

The review phase runs automated checks, creates defect beads, and prepares checkpoint documentation.

## Usage

```
/army review <wave-number>
```

## Related Commands

- `/army prepare-checkpoint N` - Generate checkpoint document
- `/army process-feedback N` - Convert human feedback to beads

## Steps

### 1. Verify Wave Completion

Check that all agents have completed:

```bash
# Check for open beads in wave
bd list --status open --label "wave:N"

# Should return only the checkpoint bead, not task beads
```

### 2. Run Automated Reviews

Launch parallel review agents:

#### Code Review

```bash
# Create code review bead
bd create --title="Code Review: Wave N" \
  --type=task \
  --label="review:code" \
  --label="wave:N"
```

Agent checks:

- Code quality and patterns
- Adherence to project conventions
- Test coverage
- Documentation

#### Security Review

```bash
# Create security review bead
bd create --title="Security Review: Wave N" \
  --type=task \
  --label="review:security" \
  --label="wave:N"
```

Agent checks:

- Authentication/authorization patterns
- Input validation
- Secret handling
- OWASP top 10

#### UI Review (if applicable)

```bash
# Create UI review bead
bd create --title="UI Review: Wave N" \
  --type=task \
  --label="review:ui" \
  --label="wave:N"
```

Agent checks:

- Visual consistency
- Accessibility
- Responsive design
- Component patterns

**Note:** UI review may require foreground execution for visual checks.

### 3. Create Defect Beads

For each issue found during review:

```bash
bd create --title="<issue description>" \
  --priority=<P0-P4> \
  --label="review:<code|security|ui>" \
  --label="discovered-from:<review-bead-id>" \
  --label="related-to:<original-bead-id>" \
  --description="<detailed description>

Found during: Wave N review
Original bead: <original-bead-id>
Review type: <code|security|ui>

Issue:
<description>

Recommended fix:
<suggestion>"
```

Priority guidelines:

- **P0:** Critical - blocks deployment, security vulnerability
- **P1:** High - significant bug, major functionality issue
- **P2:** Medium - bug, missing feature, performance issue
- **P3:** Low - minor issue, enhancement
- **P4:** Backlog - nice to have

### 4. Generate Review Summary

```
═══════════════════════════════════════════════════════════════
                 WAVE N REVIEW SUMMARY
═══════════════════════════════════════════════════════════════

Beads Completed: X
Reviews Conducted: 3 (code, security, ui)

Issues Found:
  P0: A (critical)
  P1: B (high)
  P2: C (medium)
  P3: D (low)

P0-P1 Issues Requiring Immediate Fix:
  • <bead-id>: <title>
  • <bead-id>: <title>

Recommendation:
  [If P0-P1 > 0]: Run /army deploy-fixes N before checkpoint
  [If P0-P1 = 0]: Ready for checkpoint preparation

═══════════════════════════════════════════════════════════════
```

### 5. Deploy Fixes (if needed)

If P0-P1 issues exist:

```
/army deploy-fixes N
```

This deploys targeted fix agents for high-priority issues.

## Prepare Checkpoint

`/army prepare-checkpoint N` generates the checkpoint document.

### Template

```markdown
# Checkpoint N: <Wave Name>

**Bead:** <checkpoint-bead-id>
**Status:** Ready for human review
**Date:** <date>

## Summary

Wave N has been completed. This checkpoint gates Wave N+1 development.

### Wave N Completed Work

| Bead      | Task    | Status |
| --------- | ------- | ------ |
| <bead-id> | <title> | Closed |
| <bead-id> | <title> | Closed |

### Key Commits

- `<hash>` <message>
- `<hash>` <message>

---

## Review Checklist

### Functionality

- [ ] <check 1>
- [ ] <check 2>

### Code Quality

- [ ] Code follows project patterns
- [ ] Tests pass
- [ ] No security issues

### UI/UX (if applicable)

- [ ] Responsive design works
- [ ] Accessibility verified

---

## Issues Found During Review

### Fixed (Closed)

| Priority | Bead      | Issue         |
| -------- | --------- | ------------- |
| P1       | <bead-id> | <description> |

### Remaining Open Issues (Backlog)

| Priority | Bead      | Issue         |
| -------- | --------- | ------------- |
| P2       | <bead-id> | <description> |
| P3       | <bead-id> | <description> |

**Note:** P2/P3 issues are acceptable backlog for MVP. P1 issues should be addressed.

---

## Blocking

This checkpoint blocks Wave N+1:

- <bead-id>: <title>
- <bead-id>: <title>

---

## Approval

To approve this checkpoint and unblock Wave N+1:

\`\`\`bash
bd close <checkpoint-bead-id> --reason "Checkpoint approved"
\`\`\`

To request changes, add comments to specific beads or create new issues.
```

## Process Feedback

`/army process-feedback N` converts human feedback to beads.

1. Read feedback from human (comments on beads, chat messages)
2. For each piece of actionable feedback:

```bash
bd create --title="<feedback item>" \
  --priority=<priority> \
  --label="feedback:wave-N" \
  --label="related-to:<checkpoint-bead>" \
  --description="<detailed feedback>"
```

3. Update affected beads if needed
4. Report feedback processed

## Checklist

- [ ] Wave completion verified
- [ ] Code review completed
- [ ] Security review completed
- [ ] UI review completed (if applicable)
- [ ] Defect beads created with proper labels
- [ ] P0-P1 issues fixed
- [ ] Checkpoint document generated
- [ ] Human feedback processed
