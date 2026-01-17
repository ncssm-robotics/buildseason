---
name: security-review
description: >-
  Security audit checklists and vulnerability assessment patterns.
  Use when conducting security reviews, auditing authentication,
  checking for OWASP vulnerabilities, or assessing API security.
allowed-tools: Read, Glob, Grep, Bash(bd:*), Bash(git:*), Bash(bun:*)
---

# Security Review Guide

Structured approach to security audits and vulnerability assessment.

## Related Skills

- **code-review** - Code quality audits (separate from security)

## Review Philosophy

**Security reviews are discovery tasks, not fix-everything tasks.**

- Audit against OWASP Top 10 and security checklist
- Create beads for each finding with appropriate priority (P0-P2)
- Use `review:security` label for traceability
- Close review with full audit report

## Priority Guide

Security issues should generally be high priority:

| Priority | Criteria                               | Examples                               |
| -------- | -------------------------------------- | -------------------------------------- |
| P0       | Active vulnerability, data exposure    | Exposed secrets, auth bypass           |
| P1       | Missing auth check, injection possible | Unprotected functions, unsanitized XSS |
| P2       | Hardening needed, best practice        | Missing rate limiting, weak CORS       |

## Security Checklist

### 1. Authentication & Authorization

```markdown
- [ ] Convex functions check auth with `getAuthUserId()` or `requireAuth()`
- [ ] Team membership verified with `requireTeamMember()`
- [ ] Role checks use `requireRole()` for elevated operations
- [ ] OAuth configuration uses secure providers (GitHub, Google)
- [ ] Session tokens are httpOnly (handled by Convex Auth)
```

### 2. Input Validation

```markdown
- [ ] Convex args validated with `v.*` validators
- [ ] XSS prevention (React escapes by default, audit any raw HTML rendering)
- [ ] No user input in dynamic code execution
- [ ] File upload restrictions (if applicable)
- [ ] URL/path validation for external fetches
```

### 3. Data Exposure

```markdown
- [ ] No sensitive data in logs
- [ ] No secrets in code (API keys, passwords in source)
- [ ] Environment variables for secrets (Convex dashboard)
- [ ] Proper data scoping per user/team context
- [ ] Error messages don't leak implementation details
```

### 4. Convex Function Security

```markdown
- [ ] All queries/mutations have permission checks
- [ ] No arbitrary code execution from user input
- [ ] Rate limiting considered for expensive operations
- [ ] CORS handled by Convex (default secure)
```

### 5. Dependencies

```markdown
- [ ] Check npm for known vulnerable packages
- [ ] Review recently added dependencies
- [ ] No unnecessary dependencies with broad permissions
```

### 6. Infrastructure

```markdown
- [ ] Environment variables in Convex dashboard (not hardcoded)
- [ ] HTTPS enforced (Convex default)
- [ ] Production deployment separate from dev
```

## OWASP Top 10 Quick Reference

| #   | Vulnerability             | What to Check in Convex                |
| --- | ------------------------- | -------------------------------------- |
| A01 | Broken Access Control     | Permission helpers, team scoping       |
| A02 | Cryptographic Failures    | Token handling (Convex Auth)           |
| A03 | Injection                 | XSS, Convex validators handle SQL-like |
| A04 | Insecure Design           | Threat modeling, permission structure  |
| A05 | Security Misconfiguration | Auth config, environment vars          |
| A06 | Vulnerable Components     | npm audit, dependency review           |
| A07 | Auth Failures             | Session handling (Convex Auth)         |
| A08 | Data Integrity Failures   | Input validation, CI/CD security       |
| A09 | Logging Failures          | Audit logs, error monitoring           |
| A10 | SSRF                      | External URL validation                |

## Creating Findings

For each security issue found:

```bash
bd create --title="SECURITY: <specific issue>" --type=bug --priority=<0-2> \
  --label="review:security" --label="discovered-from:<review-bead-id>"
```

## Audit Report Format

Include in close reason:

```markdown
## Security Audit: [area]

Date: YYYY-MM-DD

## Files Reviewed

- convex/vendors.ts
- convex/lib/permissions.ts

## Checklist Results

### Authentication & Authorization

- Result: PASS / X ISSUES FOUND
- Notes: [details]
- Created: [bead IDs if issues]

## Summary

- Total checks: X
- Passed: X
- Issues found: X

## Created Beads

- buildseason-xxx: SECURITY: [issue] (P0)
```

## BuildSeason-Specific Considerations

### Team Data Isolation

```typescript
// convex/parts.ts - Always check team membership
export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId); // REQUIRED!
    return ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
  },
});
```

### Role-Based Access

```typescript
// Role hierarchy: admin > mentor > student
// - Students can view team data
// - Mentors can approve orders
// - Admins can manage team settings
```

### Multi-Tenancy

- Every query/mutation scoped to team
- No cross-team data access possible
- Team ownership verified on all operations

## When to Schedule Security Reviews

- After auth changes or new OAuth flows
- After adding new Convex functions
- Before major releases
- Every ~10-15 feature beads
