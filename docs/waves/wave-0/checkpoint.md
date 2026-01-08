# Wave 0 Checkpoint: Foundation Review

Generated: 2025-12-30 22:35 UTC
Updated: 2025-12-31 (Chrome MCP UI verification)

## Review Results

| Review Type | Issues Found | Fixed  | Remaining | Questions |
| ----------- | ------------ | ------ | --------- | --------- |
| Code        | 3            | 1      | 2         | 0         |
| Security    | 2            | 2      | 0         | 0         |
| UI/UX       | 19           | 9      | 9         | 1         |
| UI Verify   | 2            | 2      | 0         | 0         |
| **Total**   | **26**       | **14** | **11**    | **1**     |

## Security Findings

> **Note**: Security issues are highlighted for visibility. Review these to identify patterns that may need standing instruction updates.

| Issue                                     | Priority | Status    | Bead             |
| ----------------------------------------- | -------- | --------- | ---------------- |
| Missing rate limiting on API endpoints    | P2       | **Fixed** | buildseason-7uzf |
| Missing CORS configuration for production | P2       | **Fixed** | buildseason-pvl2 |

Both security issues were addressed:

- Added `hono-rate-limiter` with 100 req/min general, 10 req/min for auth/invite endpoints
- Added CORS middleware configured via `CORS_ORIGINS` env var for production

## Questions Requiring Human Input

The following items need your decision before proceeding:

### 1. Vendors Scope Question (buildseason-kn8r)

**Question**: Should sidebar Vendors link go to global or team-scoped vendors?

There is ambiguity in the specs about vendors:

- The sidebar has a Vendors link that currently goes to global `/vendors`
- But ui-refocus-spec says Vendors is under BUILD section (team context)
- There's also a vendor detail page at team route

**Options**:

1. Keep global vendors directory, add team-scoped vendor preferences
2. Move vendors entirely under team context
3. Both: global directory for browsing, team-scoped for favorites/notes

**To resolve**: Update the bead with your decision and remove the `human` label:

```bash
bd update buildseason-kn8r --description="Decision: <your choice>"
bd label remove buildseason-kn8r human
```

## Unfixed Issues (Deferred)

These issues were identified but not fixed (Phase 2 features or larger scope):

| Issue                                          | Priority | Reason                  | Bead             |
| ---------------------------------------------- | -------- | ----------------------- | ---------------- |
| Refactor large API route files (1000+ lines)   | P2       | Major refactoring       | buildseason-1vvv |
| Add API integration tests                      | P2       | Needs test strategy     | buildseason-v701 |
| Dashboard missing sidebar context when no team | P1       | Needs UX decision       | buildseason-iqyl |
| Public team page not implemented               | P2       | New feature             | buildseason-prex |
| Parts search vendor catalog autocomplete       | P2       | Phase 2 feature         | buildseason-9rgk |
| Parts table pagination                         | P2       | Medium feature          | buildseason-rmgv |
| Dashboard Action Center (GLaDOS suggestions)   | P2       | Phase 2 feature         | buildseason-b2ml |
| Vendors page routing (global vs team)          | P2       | Needs question answered | buildseason-sjjd |
| Robot card quick actions                       | P2       | Medium feature          | buildseason-1nts |
| Settings integration configuration             | P3       | Phase 2+                | buildseason-puhr |
| Email invite option                            | P3       | Needs email service     | buildseason-35md |
| Parent-child relationship display              | P3       | Data model work         | buildseason-a7c2 |

## Fixed Issues Summary

### Sidebar Navigation (3 issues)

- Added Robots link to sidebar
- Removed standalone BOM link (now per-robot)
- Restructured nav with Overview/Build/Team sections

### Security (2 issues)

- Added CORS middleware with production configuration
- Added rate limiting (100 req/min general, 10 req/min auth)

### Accessibility (3 issues)

- Added aria-expanded/aria-controls to order sections
- Added descriptive aria-labels to status badges
- Keyboard shortcut Cmd/Ctrl+B was already implemented

### UI Fixes (4 issues)

- Fixed breadcrumb path detection ('team' not 'teams')
- Added rejection reason dialog for orders
- Added icon slot to StatsCard component
- Made demo button scroll to features section

### Developer Experience (1 issue)

- Fixed root `bun test` command to properly run all package tests

### Chrome MCP UI Verification (2 issues) - 2025-12-31

Visual verification of all pages using Chrome browser automation:

- **Fixed:** Robots page crash (`seasons?.find is not a function`) - API returns `{seasons: [...]}` but frontend expected array directly
- **Fixed:** Dev mode port confusion - API was serving stale production build at port 3000 instead of dev message. Now correctly shows dev mode guidance when `NODE_ENV=development`

**Pages Verified Working:**

- ✅ Dashboard - Stats cards, quick actions, get started section
- ✅ Robots - Season selector, status filter, empty state
- ✅ Parts - Search, sort, low stock filter, empty state
- ✅ Orders - Status filter, empty state
- ✅ Members - Role grouping, invite button
- ✅ Settings - Seasons, Team Info (Coming Soon), Members
- ✅ Marketing page - Hero, features, CTAs
- ✅ Global Vendors - Directory with robotics suppliers

**Known Issue (Needs Decision):**

- ❌ Sidebar Vendors link goes to `/team/.../vendors` which 404s. Only `/vendors` (global) exists. See vendors scope question (buildseason-kn8r)

## Test Status

```
Typecheck: PASS (all 3 packages)
Tests: 16 passing (web package)
API Tests: Passing
```

## Commits in this Wave (8 fix commits)

```
7172c18 fix(test): configure root test command to run all package tests
c8ee2d4 fix(api): add CORS and rate limiting security middleware
75cec94 fix(ui): improve orders page accessibility and rejection workflow
67e8c24 fix(ui): correct breadcrumb path detection for team routes
e98557c fix(ui): restructure sidebar navigation per spec
8ee74b8 fix(ui): add icon slot to StatsCard component
3268b64 fix(ui): make demo button scroll to features section
67e2a5a fix(a11y): add descriptive aria-label to status badges
```

## Human Review Checklist

- [x] Review security findings above (both fixed, patterns look good)
- [ ] Answer the vendors scope question (buildseason-kn8r)
- [x] Visual UI verification via Chrome MCP (all pages verified working)
- [ ] Run `bun dev` and test core flows manually:
  - [ ] Login/logout (Note: OAuth redirects to port 3000, use port 5173 for dev)
  - [ ] Team switching
  - [ ] Parts list
  - [ ] Orders list with reject workflow
  - [ ] Robots page (new sidebar link) - ✅ Fixed
- [ ] Check mobile responsive behavior
- [ ] Verify sidebar navigation makes sense

## Next Steps

When satisfied:

1. Answer the vendors question (update bead, remove `human` label)
2. Close checkpoint: `bd close buildseason-6ea`
3. Deploy next wave: `/army deploy 1`

---

_Dev server should be running at http://localhost:5173_

## Human Feedback (2025-12-31)

| #   | Feedback                                                 | Bead               | Priority |
| --- | -------------------------------------------------------- | ------------------ | -------- |
| 1   | Vendors: Global (common) + Org-local architecture        | `buildseason-kn8r` | P2       |
| 2   | Marketing: Open source mission, sponsors, contribute CTA | `buildseason-vtly` | P1       |
| 3   | Marketing: Auth-aware redirect (logged in → dashboard)   | `buildseason-ftzc` | P1       |
| 4   | Sidebar: Org/Team picker instead of fixed header         | `buildseason-696h` | P1       |
| 5   | Sidebar: Fix collapse/expand + persist UI preferences    | `buildseason-mxj8` | P1       |
| 6   | Terminology: Replace "Dashboard" with Org/Team page      | `buildseason-mm78` | P2       |
| 7   | Public team page: Add preview and access method          | `buildseason-mzdz` | P2       |
| 8   | Team settings: Logo upload capability                    | `buildseason-kgum` | P2       |
| 9   | SEO: Favicon, title, description, meta tags              | `buildseason-50ut` | P2       |

### Details

**1. Vendors Architecture** (`buildseason-kn8r`)

- Global/Common vendors: goBILDA, REV, etc. (maintained by BuildSeason)
- Org-local vendors: Custom vendors specific to an Organization
- Schema: Consider `buildseason-common` org pattern where their local becomes everyone's global
- Orgs can CRUD their local vendors, read-only for global

**2. Marketing Improvements** (`buildseason-vtly`)

- Clear open source, free forever messaging
- Sponsors section (Anthropic, Amazon, Fly.io, Turso, vendor sponsors)
- "Get Involved" CTAs for sponsors and contributors
- Links to FIRST for teams who don't have a team yet

**3. Auth-Aware Marketing** (`buildseason-ftzc`)

- GitHub pattern: logged in users redirect straight to dashboard
- No need to see marketing page if already authenticated

**4. Org/Team Picker** (`buildseason-696h`)

- Replace fixed "BuildSeason Team Hub" graphic
- Dropdown with Org → Team hierarchy
- Single-team orgs show just the team (org name === team name)
- Example: NCSSM org has teams: Aperture Science, Sigmacorns, RobotKnights

**5. Sidebar Collapse Issues** (`buildseason-mxj8`)

- Arrow handle on divider instead of button
- Fix collapsed width (too wide)
- Fix content underlapping sidebar
- Persist UI preferences across refreshes (localStorage or DB)

**6. Dashboard Terminology** (`buildseason-mm78`)

- Audit and replace "Dashboard" usage
- Use "Organization page" or "Team page" instead

**7. Public Team Page** (`buildseason-mzdz`)

- Need way to preview/access public team page
- Related to `buildseason-prex`

**8. Team Logo** (`buildseason-kgum`)

- Upload/update team logo in settings
- Display in sidebar, team page, public page
- Reference: https://apertureftc.org/

**9. SEO** (`buildseason-50ut`)

- Favicon (robot icon)
- Page titles throughout
- Meta descriptions
- Open Graph for social sharing
