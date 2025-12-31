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

| Priority | Criteria                                  | Examples                              |
| -------- | ----------------------------------------- | ------------------------------------- |
| P0       | Active vulnerability, data exposure       | SQL injection, exposed secrets        |
| P1       | Missing auth check, injection possible    | Unprotected routes, unsanitized input |
| P2       | Hardening needed, best practice violation | Missing rate limiting, weak CORS      |

## Security Checklist

### 1. Authentication & Authorization

```markdown
- [ ] API routes properly protected (auth middleware on /api/\*)
- [ ] User permissions checked before actions
- [ ] Session handling secure (httpOnly, secure, sameSite cookies)
- [ ] OAuth state parameter validated
- [ ] CSRF protection in place
- [ ] Proper logout (session invalidation)
```

### 2. Input Validation

```markdown
- [ ] User inputs sanitized at API boundary
- [ ] SQL injection prevented (parameterized queries via Drizzle)
- [ ] XSS prevention (React escapes by default, check dangerouslySetInnerHTML)
- [ ] Path traversal blocked (no user input in file paths)
- [ ] File upload restrictions (type, size)
```

### 3. Data Exposure

```markdown
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] No secrets in code (API keys, passwords in source)
- [ ] PII filtered from API responses appropriately
- [ ] Proper data scoping per user/team context
- [ ] Error messages don't leak implementation details
```

### 4. API Security

```markdown
- [ ] Rate limiting in place (see apps/api/src/middleware/)
- [ ] CORS configured properly (not wildcard in production)
- [ ] Proper HTTP methods used (GET for reads, POST for mutations)
- [ ] Content-Type validation
- [ ] Request size limits
```

### 5. Dependencies

```markdown
- [ ] Run `bun audit` if available
- [ ] Check for known vulnerable packages
- [ ] Review recently added dependencies
- [ ] No unnecessary permissions requested
```

### 6. Infrastructure

```markdown
- [ ] Environment variables for secrets (not hardcoded)
- [ ] HTTPS enforced
- [ ] Security headers configured (X-Content-Type-Options, etc.)
- [ ] Database connection secured
```

## OWASP Top 10 Quick Reference

| #   | Vulnerability             | What to Check                           |
| --- | ------------------------- | --------------------------------------- |
| A01 | Broken Access Control     | Route protection, RBAC enforcement      |
| A02 | Cryptographic Failures    | Password hashing, token generation      |
| A03 | Injection                 | SQL, XSS, command injection             |
| A04 | Insecure Design           | Threat modeling, security requirements  |
| A05 | Security Misconfiguration | Headers, CORS, error handling           |
| A06 | Vulnerable Components     | `bun audit`, dependency review          |
| A07 | Auth Failures             | Session management, credential handling |
| A08 | Data Integrity Failures   | Deserialization, CI/CD security         |
| A09 | Logging Failures          | Audit logs, monitoring                  |
| A10 | SSRF                      | URL validation, allowlists              |

## Creating Findings

For each security issue found:

```bash
# Security finding with priority
bd create --title="SECURITY: <specific issue>" --type=bug --priority=<0-2> \
  --label="review:security" --label="discovered-from:<review-bead-id>"
```

Example findings:

```bash
# P0: Active vulnerability
bd create --title="SECURITY: API key exposed in client bundle" --type=bug --priority=0 \
  --label="review:security"

# P1: Missing protection
bd create --title="SECURITY: /api/orders missing auth middleware" --type=bug --priority=1 \
  --label="review:security"

# P2: Hardening
bd create --title="SECURITY: Add rate limiting to login endpoint" --type=bug --priority=2 \
  --label="review:security"
```

## Audit Report Format

Include in close reason:

```markdown
## Security Audit: [area]

Date: YYYY-MM-DD

## Files Reviewed

- apps/api/src/routes/api.tsx
- apps/api/src/middleware/auth.ts
  [list all reviewed files]

## Checklist Results

### Authentication & Authorization

- Reviewed: [files]
- Result: PASS / X ISSUES FOUND
- Notes: [details]
- Created: [bead IDs if issues]

### Input Validation

- Reviewed: [files]
- Result: PASS / X ISSUES FOUND
  [continue for each section]

## Summary

- Total checks: X
- Passed: X
- Issues found: X (P0: X, P1: X, P2: X)

## Created Beads

- buildseason-xxx: SECURITY: [issue] (P0)
- buildseason-yyy: SECURITY: [issue] (P1)
  [list all]
```

## Review Template

Create a security review bead:

```bash
bd create --title="Security review: [area]" --type=task --priority=2 \
  --label="model:opus" --label="review:security" \
  --description="Security audit of [area]. Create beads for findings.

Areas to cover:
- Authentication & authorization
- Input validation
- Data exposure
- API security
- Dependencies

Close with full audit report."
```

## When to Schedule Security Reviews

- After auth changes or new OAuth flows
- After adding new API endpoints
- After adding file upload/download features
- Before major releases
- Every ~10-15 feature beads
- When adding third-party integrations

## BuildSeason-Specific Considerations

### Team Data Isolation

```typescript
// Always filter by team context
const parts = await db.query.parts.findMany({
  where: eq(parts.teamId, teamId), // Required!
});
```

### OnShape Integration

- OAuth tokens encrypted at rest
- Token refresh handled securely
- API calls scoped to user's documents

### Multi-Tenancy

- Verify team ownership in all routes
- No cross-team data leakage
- Admin routes properly protected
