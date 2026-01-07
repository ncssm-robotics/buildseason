# BuildSeason UI Refocus Specification

**Version:** 1.0
**Date:** December 30, 2025
**Status:** Draft
**Purpose:** Transform BuildSeason from a parts-management app into a holistic team management platform
**Companion Documents:**

- [ui-ux-design-spec.md](./ui-ux-design-spec.md) — Design system, personas, accessibility
- [agentic-spec.md](./agentic-spec.md) — GLaDOS agent architecture (Claude Agent SDK + Temporal)
- [onshape-spec.md](./onshape-spec.md) — CAD/BOM integration
- [vendor-stock-harvesting-spec.md](./vendor-stock-harvesting-spec.md) — Stock/pricing automation

> **Note:** This document supersedes the Information Architecture (Section 2) and Page Specifications (Section 5) in ui-ux-design-spec.md. Refer to ui-ux-design-spec.md for design system, personas, user journeys, accessibility requirements, and responsive strategy.

---

## Executive Summary

The current BuildSeason UI is heavily focused on parts/inventory/orders - reflecting only a fraction of what FIRST robotics teams actually need to manage. This specification outlines a comprehensive UI refocus that aligns with the full scope of team management as defined in `requirements.md`.

**The Core Insight:** FIRST is about more than robots. The awards tell the story:

- **Inspire Award** — Top award for greatness in ALL aspects: technical excellence, outreach, gracious professionalism
- **Connect Award** — Working with local STEM and corporate community
- **Motivate Award** — Team building, spirit, representing FIRST culture
- **Think Award** — Journey documentation and reflection

BuildSeason should make ALL of this easier, not just parts ordering.

---

## Current State Analysis

### Current Navigation Structure

```
Main Section:
├── Dashboard
├── Parts
├── BOM (placeholder)
├── Orders
└── Vendors (placeholder)

Team Section:
├── Members
└── Settings (placeholder)
```

### Current Dashboard Metrics

- Total Parts
- Low Stock
- Pending Orders
- Team Members

### Current "Needs Attention"

- Pending orders awaiting approval
- Low stock parts

### The Problem

The UI tells a story of "managing robot parts" when it should tell a story of "managing a robotics team." Missing entirely:

1. **Outreach** — Community engagement, volunteer hours, school visits
2. **Sponsorships** — Relationship nurturing, deliverables, impact reporting
3. **Operations** — Competitions, travel logistics, permission forms
4. **Finance** — Budget tracking, grant compliance, expense management
5. **Team Development** — Training, mentorship, role progression

---

## Proposed Information Architecture

### Design Philosophy

**The Team is the entity.** Everything else is an aspect of managing that team:

```
TEAM: Aperture Science (FTC 5064)
├── Overview         — Team health and planning (dashboard, calendar, members)
├── Build            — Making the robot (robots, parts, software, fabrication)
├── Outreach         — Community engagement (events, hours, impact)
├── Sponsorships     — Funding relationships (contacts, deliverables)
├── Marketing        — Team identity (branding, social, pit materials) [configurable]
├── Operations       — Team logistics (competitions, travel, orders, forms)
├── Finance          — Money management (budget, expenses, grants)
└── Settings         — Configuration (team, agent, integrations)
```

### New Sidebar Structure

```
[Team Header: Aperture Science FTC 5064]

OVERVIEW
├── Dashboard (action center with agentic suggestions)
├── Calendar (unified timeline - events, deadlines, deliveries)
└── Members

BUILD
├── Robots (per-robot BOMs, status tracking)
├── Parts (team inventory)
├── Orders (parts orders - "Order Missing BOM Items")
├── Software (GitHub integration, code progress, PRs)
├── Fabrication (3D print queue, laser cutting, custom parts)
└── Vendors

OUTREACH
├── Events (outreach calendar)
├── Hours (tracking & reporting)
└── Impact (stories, photos, metrics)

SPONSORSHIPS
├── Sponsors (relationship list)
├── Deliverables (obligations)
└── Moments (shareable achievements)

MARKETING [configurable section]
├── Branding (logos, colors, identity)
├── Social (social media tracking)
└── Pit Materials (banners, giveaways)

OPERATIONS
├── Competitions (schedule, prep, logistics)
├── Travel (trips, documents, meal planning)
├── Orders (non-parts: apparel, supplies, food)
└── Documents (permission forms, waivers)

FINANCE
├── Budget (allocation, tracking)
├── Expenses (receipts, reimbursements)
└── Grants (restricted funds)

SETTINGS
├── Team Settings
├── Agent Config
└── Integrations
```

### Navigation Rationale

| Section          | Purpose                 | Why It Matters                |
| ---------------- | ----------------------- | ----------------------------- |
| **Overview**     | Team health at a glance | Where mentors start their day |
| **Build**        | Technical work          | The robot-building activities |
| **Outreach**     | Community engagement    | Required for grants, awards   |
| **Sponsorships** | Funding relationships   | Team sustainability           |
| **Operations**   | Logistics               | Competition readiness, travel |
| **Finance**      | Money management        | Budget accountability         |

---

## Dashboard Redesign: Action Center, Not Status Board

### The Problem with Traditional Dashboards

Traditional dashboards are passive status displays — they show problems but leave you to figure out what to do. **BuildSeason's dashboard is different.** Every item comes with:

1. **The situation** — What's happening
2. **GLaDOS's proposed solution** — A concrete recommendation
3. **One-click action** — Execute the suggestion immediately

This is the agent-first philosophy in action. The mentor's job shifts from "figure out what to do" to "approve or modify GLaDOS's suggestion."

### The Action Center Layout

**NOT** "Needs Attention" (vague problems) → **"This Week"** (actionable items with solutions)

```
┌─────────────────────────────────────────────────────────────────┐
│  THIS WEEK                                          [Full Calendar]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NEEDS ACTION                                                    │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️  Need to finalize lunch order for Sunday outreach       │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "8 students signed up. Given the Convention    │  │
│  │    Center location and dietary needs (1 vegetarian,       │  │
│  │    1 nut allergy), Chipotle group order works well.       │  │
│  │    [Link to exact store order form]                       │  │
│  │    Want me to poll the kids in Discord for preferences?"  │  │
│  │                                                            │  │
│  │ [Poll in Discord]  [I'll Handle It]  [Remind Me Tomorrow] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️  2 permission forms missing for NC Regional (5 days)    │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "Marcus and Sofia haven't signed yet. Both     │  │
│  │    parents are in our system. I can send a friendly       │  │
│  │    reminder now, or a more urgent one on Wednesday."      │  │
│  │                                                            │  │
│  │ [Send Friendly Reminder]  [Wait Until Wednesday]  [I'll Call]│
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️  TechCorp hasn't heard from us in 47 days               │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "Their renewal is in 90 days. Since last       │  │
│  │    contact: we won the regional qualifier and Sofia       │  │
│  │    presented at MakerFaire. Here's a draft update with    │  │
│  │    the best photos attached."                             │  │
│  │                                                            │  │
│  │ [Review & Send Draft]  [I'll Write My Own]  [Snooze 1 Week]│
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️  12 parts below reorder point, competition in 14 days   │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "I've grouped these into a REV order ($127)    │  │
│  │    and a goBILDA order ($89). With standard shipping,     │  │
│  │    both arrive 4 days before competition. Draft orders    │  │
│  │    are ready for review."                                 │  │
│  │                                                            │  │
│  │ [Review REV Order]  [Review goBILDA Order]  [Ignore Risk] │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ACCOMPLISHED THIS WEEK                              [View All] │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✓  Sofia completed her first solo parts order              │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "This is her first independent order! Worth    │  │
│  │    celebrating in Discord?"                               │  │
│  │                                                            │  │
│  │ [Celebrate in Discord]  [Skip]                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✓  REV order #12345 arrived (all 4 items received)        │  │
│  │                                                            │  │
│  │ 💡 GLaDOS: "Parts have been added to inventory. The arm   │  │
│  │    BOM is now 100% stocked."                              │  │
│  │                                                            │  │
│  │ [View BOM Status]  [Dismiss]                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  COMING UP                                                       │
│                                                                  │
│  Sun Dec 14  MakerFaire Outreach (8 volunteers, lunch TBD)      │
│  Wed Dec 18  goBILDA order arrives                              │
│  Fri Dec 20  TechCorp social media post due                     │
│  Wed Jan 15  NC Regional Qualifier                              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Every problem comes with a proposed solution**
   - Not "2 forms missing" → "2 forms missing, here's who, want me to remind them?"

2. **Solutions are one-click actionable**
   - "Send Reminder" not "Go to forms page, find missing, compose message..."

3. **GLaDOS explains the reasoning**
   - "Given dietary needs..." "Their renewal is in 90 days..." "With standard shipping..."

4. **Multiple response options**
   - Accept suggestion, do it yourself, or defer (never just "dismiss")

5. **Celebrations, not just problems**
   - "Accomplished" section with opportunities to recognize achievements

### Dashboard Statistics Breakdown

| Stat      | Current       | New                               | Why                    |
| --------- | ------------- | --------------------------------- | ---------------------- |
| Parts     | Total count   | Still shown, but in Build section | Stays relevant         |
| Low Stock | Count         | Still shown as alert              | Stays relevant         |
| Orders    | Pending count | Still shown                       | Stays relevant         |
| Members   | Total count   | + form status                     | More actionable        |
| **NEW**   | —             | Next Event countdown              | Competition focus      |
| **NEW**   | —             | Outreach progress                 | Grant compliance       |
| **NEW**   | —             | Sponsor health                    | Relationship nurturing |
| **NEW**   | —             | Budget remaining                  | Financial awareness    |
| **NEW**   | —             | Robot BOM status                  | Build progress         |

### "Needs Attention" Expansion

Current items:

- Pending orders awaiting approval
- Low stock parts

**New items to include:**

- Permission forms due before upcoming events
- Sponsor contacts overdue (configurable threshold)
- Outreach hour shortfalls vs. grant targets
- Deliverables approaching due dates
- Travel documents incomplete (passports, visas)
- Budget categories overspent
- Robot BOM items not yet ordered

---

## New Pages Specification

### 1. Robots Page (`/team/:program/:number/robots`)

**Purpose:** Manage multiple robots per season with per-robot BOMs

```
ROBOTS
======
[+ New Robot]

ACTIVE ROBOTS
─────────────
┌─────────────────────────────────────────────────────────┐
│  🤖 Cheddar (Competition Robot)                         │
│  Status: Building                                        │
│  BOM: 47 parts, 44 allocated (94%)                      │
│  Missing: 3 parts ($127) - [View] [Order Missing]       │
│  Last updated: 2 hours ago by Marcus                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🤖 Pepperjack (Practice Robot)                         │
│  Status: Building                                        │
│  BOM: 42 parts, 38 allocated (90%)                      │
│  Missing: 4 parts ($89) - [View] [Order Missing]        │
└─────────────────────────────────────────────────────────┘

ARCHIVED ROBOTS
───────────────
(Collapsed by default)
```

**Robot Detail Page** (`/team/:program/:number/robots/:robotId`):

- Robot info (name, status, description)
- BOM list with allocation status
- Parts needed vs. parts allocated from inventory
- One-click "Order Missing Parts"
- Subsystem breakdown (drivetrain, intake, arm, etc.)
- OnShape integration status

### 2. Outreach Hub (`/team/:program/:number/outreach`)

**Purpose:** Track community engagement, volunteer hours, impact

```
OUTREACH
========
[+ Log Hours] [+ New Event]

SEASON PROGRESS
───────────────
┌─────────────────────────────────────────────────────────┐
│  Hours: ████████████████████░░░░░░ 89/100 (89%)         │
│  Events: 6 completed, 2 upcoming                        │
│  Students reached: ~450                                  │
│  Grant target: 100 hours by April                       │
└─────────────────────────────────────────────────────────┘

UPCOMING EVENTS
───────────────
┌─────────────────────────────────────────────────────────┐
│  📅 MakerFaire Booth                                    │
│  Dec 14, 10am-6pm @ Convention Center                   │
│  Volunteers: 8/10 signed up (2 slots open)              │
│  [Sign Up] [View Details]                               │
└─────────────────────────────────────────────────────────┘

RECENT ACTIVITY
───────────────
┌─────────────────────────────────────────────────────────┐
│  ✓ School Visit - Durham Academy (12 hours, 5 students) │
│  ✓ FLL Mentoring Session (8 hours, 3 students)         │
│  ✓ Library STEM Night (6 hours, 4 students)            │
└─────────────────────────────────────────────────────────┘
```

**Subpages:**

- `/outreach/events` — Calendar of outreach events
- `/outreach/hours` — Hour logging and reporting
- `/outreach/impact` — Stories, photos, metrics for reporting

### 3. Sponsors Page (`/team/:program/:number/sponsors`)

**Purpose:** Relationship nurturing, not just tracking

```
SPONSORSHIPS
============
[+ Add Sponsor]

NEEDS ATTENTION
───────────────
┌─────────────────────────────────────────────────────────┐
│  ⚠️ TechCorp ($5,000)                                   │
│  Last contact: 47 days ago                              │
│  Renewal: 90 days away                                  │
│  Since last update: Won regional, Sofia at MakerFaire   │
│  [Draft Update] [View History]                          │
└─────────────────────────────────────────────────────────┘

HEALTHY RELATIONSHIPS
─────────────────────
┌─────────────────────────────────────────────────────────┐
│  ✓ Local Hardware Co ($500)                             │
│  Last contact: 12 days ago                              │
│  Deliverables: 2/3 complete                             │
└─────────────────────────────────────────────────────────┘

GRANTS & RESTRICTED FUNDS
─────────────────────────
┌─────────────────────────────────────────────────────────┐
│  📋 STEM Education Grant ($2,500)                       │
│  Type: Restricted (outreach only)                       │
│  Spent: $1,800 / $2,500                                 │
│  Hours logged: 89/100 required                          │
│  Expires: June 2025                                     │
└─────────────────────────────────────────────────────────┘
```

**Subpages:**

- `/sponsors/:sponsorId` — Detail with contact history, deliverables
- `/sponsors/:sponsorId/update` — Draft update with moment suggestions
- `/sponsors/deliverables` — All deliverables across sponsors
- `/sponsors/moments` — Shareable achievements to send

### 4. Operations Page (`/team/:program/:number/operations`)

**Purpose:** Competitions, travel, logistics

```
OPERATIONS
==========

UPCOMING COMPETITIONS
─────────────────────
┌─────────────────────────────────────────────────────────┐
│  🏆 NC Regional Qualifier                               │
│  Jan 15, 2025 @ Durham Convention Center                │
│  Team: 18/18 students confirmed                         │
│  Forms: 16/18 signed (2 missing)                        │
│  Equipment: Checklist 90% complete                      │
│  [View Prep Checklist] [Manage Forms]                   │
└─────────────────────────────────────────────────────────┘

TRAVEL PLANNING
───────────────
┌─────────────────────────────────────────────────────────┐
│  ✈️ World Championship (if qualified)                   │
│  Apr 16-19, 2025 @ Houston                              │
│  Status: Planning                                        │
│  Travelers: 0/24 documents complete                     │
│  [Start Planning]                                        │
└─────────────────────────────────────────────────────────┘

DOCUMENTS & FORMS
─────────────────
┌─────────────────────────────────────────────────────────┐
│  📄 Permission Forms Status                             │
│  NC Regional: 16/18 (89%) - 2 reminders sent           │
│  MakerFaire: 6/8 (75%) - deadline tomorrow             │
│  [View All Forms] [Send Bulk Reminder]                  │
└─────────────────────────────────────────────────────────┘
```

**Subpages:**

- `/operations/competitions` — Competition calendar and prep
- `/operations/travel` — Trip planning for away events
- `/operations/documents` — Permission forms, waivers, compliance

### 5. Finance Page (`/team/:program/:number/finance`)

**Purpose:** Budget tracking, expense management, grant compliance

```
FINANCE
=======

BUDGET OVERVIEW
───────────────
┌─────────────────────────────────────────────────────────┐
│  Season Budget: $12,000                                 │
│  Committed: $8,450                                      │
│  Spent: $7,200                                          │
│  Remaining: $3,550 (30%)                                │
│                                                          │
│  Progress: ████████████████░░░░ 72% of season          │
│  Burn rate: On track                                    │
└─────────────────────────────────────────────────────────┘

BY CATEGORY
───────────────
┌─────────────────────────────────────────────────────────┐
│  Parts & Materials   $4,200 / $5,000  ████████░░ 84%   │
│  Competition Fees    $1,500 / $2,000  ███████░░░ 75%   │
│  Travel              $800 / $3,000    ██░░░░░░░░ 27%   │
│  Outreach            $500 / $1,000    █████░░░░░ 50%   │
│  Tools & Equipment   $200 / $1,000    ██░░░░░░░░ 20%   │
└─────────────────────────────────────────────────────────┘

RECENT EXPENSES
───────────────
┌─────────────────────────────────────────────────────────┐
│  Dec 28  REV Robotics order #12345         $234.50     │
│  Dec 20  Competition registration           $150.00     │
│  Dec 15  MakerFaire booth supplies          $45.00     │
│  [View All] [Add Expense]                               │
└─────────────────────────────────────────────────────────┘
```

**Subpages:**

- `/finance/budget` — Allocation and tracking
- `/finance/expenses` — Receipt capture, reimbursements
- `/finance/grants` — Restricted fund tracking and compliance

---

## GLaDOS Chat Interface

### Philosophy: Omnichannel, Same Experience

GLaDOS is available wherever users are — Discord or the web UI. Both channels use the same backend, same capabilities, same interaction pattern. Meet users where they are.

```
┌─────────────────────────────────────────────────────────────────┐
│                         GLaDOS Backend                          │
│                    (same agent, same tools)                     │
└─────────────────────────────────────────────────────────────────┘
                    ▲                           ▲
                    │                           │
            ┌───────┴───────┐           ┌───────┴───────┐
            │    Discord    │           │    Web UI     │
            │  Bot Commands │           │ Chat Popover  │
            └───────────────┘           └───────────────┘
```

### Web UI: Persistent Chat Popover

A collapsible chat interface available on every page:

```
┌─────────────────────────────────────────────────────────────────┐
│ [App Header]                                            [💬]   │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │ GLaDOS        │
│                                                 │               │
│  [Current Page Content]                         │ "How can I    │
│                                                 │  help?"       │
│  Dashboard / Events / Parts / etc.              │               │
│                                                 │ ─────────────│
│                                                 │               │
│                                                 │ [Type here..] │
└─────────────────────────────────────────────────┴───────────────┘
```

**Behaviors:**

- Toggle via header icon or keyboard shortcut (⌘+G or similar)
- Collapsed by default, remembers user preference
- Contextual: GLaDOS knows what page you're on
- Mobile: Full-screen slide-over

### Interaction Pattern: Plan → Approve → Execute

Every request that has side effects follows this pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│ You: "Joe just texted me he's going Saturday, sort him out"    │
├─────────────────────────────────────────────────────────────────┤
│ GLaDOS: "Got it. Here's what I'll do:                          │
│                                                                  │
│   ☐ Add Joe Martinez to NC Regional (Jan 15)                   │
│   ☐ Send permission slip request to Sarah Martinez (mom)       │
│   ☐ Update lunch headcount: 16 → 17                            │
│   ⚠️ Joe has no dietary info on file                           │
│                                                                  │
│   [Do All]  [Edit Plan]  [Ask Joe about diet first]            │
└─────────────────────────────────────────────────────────────────┘
```

After approval:

```
┌─────────────────────────────────────────────────────────────────┐
│ GLaDOS: "Done ✓                                                 │
│                                                                  │
│   ✓ Added Joe to NC Regional                                   │
│   ✓ Sent permission slip to Sarah (via email)                  │
│   ✓ Lunch count updated to 17                                  │
│   📋 Dietary info: I'll ask Joe next time he's in Discord      │
│                                                                  │
│   [View Event] [Undo]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### What GLaDOS Can Do (Examples)

**Quick Queries (no confirmation needed):**

- "How many permission slips are missing for Saturday?"
- "What's our budget remaining for parts?"
- "Who's signed up for the outreach event?"
- "When does our REV order arrive?"

**Actions (requires confirmation):**

- Add/remove people from events
- Send reminders or notifications
- Create orders or expense entries
- Update statuses
- Schedule messages

**Complex Workflows:**

- "Set up our competition prep checklist for regionals"
- "Draft a sponsor update email with our recent wins"
- "Order the missing parts for Cheddar's drivetrain"

### Contextual Awareness

GLaDOS uses page context to interpret requests:

| Current Page      | "Add Joe" means...                |
| ----------------- | --------------------------------- |
| Event detail page | Add Joe to this event             |
| Robot BOM page    | Add Joe as assignee to this robot |
| Team members page | Invite Joe to the team            |
| Ambiguous         | GLaDOS asks for clarification     |

### Discord Parity

The same interactions work in Discord:

```
@GLaDOS Joe just texted me he's going Saturday, sort him out

GLaDOS: Got it. Here's what I'll do:
  ☐ Add Joe Martinez to NC Regional (Jan 15)
  ☐ Send permission slip to Sarah Martinez
  ☐ Update lunch count: 16 → 17
  ⚠️ Joe has no dietary info on file

React ✅ to proceed, or reply to modify.
```

### Safety & Trust

**Always requires confirmation:**

- Sending messages/emails to external parties
- Financial actions (expenses, orders over threshold)
- Removing people from events/team
- Bulk operations

**Never does without asking:**

- Delete data permanently
- Change permissions/roles
- Contact sponsors
- Post to social media

### Components

| Component           | Purpose                              |
| ------------------- | ------------------------------------ |
| `GladosChatPopover` | Main chat container, collapsible     |
| `GladosMessage`     | Chat message bubble (user or GLaDOS) |
| `ActionPlan`        | Plan preview with checkboxes         |
| `ActionPlanItem`    | Single planned action with status    |
| `ActionResult`      | Execution results with undo option   |
| `ChatInput`         | Text input with send button          |

### Implementation Notes

- Chat state persists across page navigation (within session)
- History is per-team, stored server-side
- Typing indicator when GLaDOS is "thinking"
- Markdown support in GLaDOS responses
- Action buttons rendered inline (not just text)

---

## Component Specifications

### New Components Needed

| Component            | Purpose                             | Location              |
| -------------------- | ----------------------------------- | --------------------- |
| `TeamHealthBanner`   | Top-level status indicator          | Dashboard header      |
| `StatCardEnhanced`   | Stats with icons, subtitles, trends | Dashboard             |
| `ProgressRing`       | Circular progress (hours, budget)   | Multiple pages        |
| `EventCard`          | Event summary with status           | Outreach, Operations  |
| `SponsorCard`        | Sponsor with relationship health    | Sponsors page         |
| `FormStatusBadge`    | Permission form progress            | Operations, Dashboard |
| `TimelineItem`       | Unified upcoming events             | Dashboard             |
| `RobotCard`          | Robot with BOM status               | Robots page           |
| `BudgetBar`          | Category budget visualization       | Finance page          |
| `NeedsAttentionItem` | Actionable alert item               | Dashboard             |
| `GladosChatPopover`  | Collapsible chat sidebar            | App layout            |
| `GladosMessage`      | Chat message bubble                 | Chat popover          |
| `ActionPlan`         | Plan preview with checkboxes        | Chat popover          |
| `ActionPlanItem`     | Single planned action               | Chat popover          |
| `ActionResult`       | Execution results with undo         | Chat popover          |
| `ChatInput`          | Text input with send                | Chat popover          |

### Enhanced Existing Components

| Component     | Enhancement                                      |
| ------------- | ------------------------------------------------ |
| `StatsCard`   | Add icon slot, subtitle, secondary metric        |
| `StatusBadge` | Additional statuses (overdue, warning, on-track) |
| `AppSidebar`  | New grouping structure, section headers          |

---

## Implementation Phases

### Phase 1: Foundation (Navigation Restructure)

**Goal:** New sidebar structure with placeholder pages

**Tasks:**

1. Restructure sidebar with new sections (Overview, Build, Outreach, Sponsorships, Marketing, Operations, Finance)
2. Create route files for all new pages (placeholder content)
3. Update breadcrumb labels and section identifiers
4. Add section header styling to sidebar
5. Add Calendar route under Overview

**Files to modify:**

- `apps/web/src/components/layout/app-sidebar.tsx`
- `apps/web/src/components/layout/app-header.tsx`

**New route files:**

- `apps/web/src/routes/team/$program/$number/calendar/index.tsx`
- `apps/web/src/routes/team/$program/$number/robots/index.tsx`
- `apps/web/src/routes/team/$program/$number/software/index.tsx`
- `apps/web/src/routes/team/$program/$number/fabrication/index.tsx`
- `apps/web/src/routes/team/$program/$number/outreach/index.tsx`
- `apps/web/src/routes/team/$program/$number/sponsors/index.tsx`
- `apps/web/src/routes/team/$program/$number/marketing/index.tsx`
- `apps/web/src/routes/team/$program/$number/operations/index.tsx`
- `apps/web/src/routes/team/$program/$number/finance/index.tsx`

**Issues:** 5-6

---

### Phase 2: Action Center Dashboard

**Goal:** Transform dashboard from status display to action center with agentic suggestions

**Tasks:**

1. Create ActionItem component (situation + GLaDOS suggestion + one-click actions)
2. Create "This Week" layout with Needs Action / Accomplished sections
3. Create "Coming Up" timeline component
4. Implement action button handlers (Poll in Discord, Send Reminder, etc.)
5. Create celebration/recognition flow for accomplishments
6. Connect to agent backend for generating suggestions

**Files to modify:**

- `apps/web/src/routes/team/$program/$number/index.tsx`

**New components:**

- `apps/web/src/components/dashboard/action-item.tsx`
- `apps/web/src/components/dashboard/this-week.tsx`
- `apps/web/src/components/dashboard/coming-up.tsx`
- `apps/web/src/components/dashboard/accomplished-item.tsx`

**Issues:** 8-10

---

### Phase 3: Team Calendar

**Goal:** Unified timeline showing all team activities

**Tasks:**

1. Calendar view component (month/week/agenda views)
2. Event types: competitions, outreach, build sessions, deadlines, deliveries
3. Integration with all data sources (events, orders, forms, deliverables)
4. Quick-add events from calendar
5. Event detail modals with action suggestions

**Files:**

- `apps/web/src/routes/team/$program/$number/calendar/index.tsx`
- `apps/web/src/components/calendar/calendar-view.tsx`
- `apps/web/src/components/calendar/event-detail.tsx`

**Issues:** 4-5

---

### Phase 4: Robots & BOM

**Goal:** Per-robot BOM management with OnShape integration

**Tasks:**

1. Robots list page with status cards
2. Robot detail page with BOM
3. Part allocation workflow (inventory → robot)
4. "Order Missing Parts" functionality
5. Robot lifecycle management (building → ready → disassembled)
6. OnShape connection setup (OAuth flow, document selection)
7. BOM sync indicator and manual refresh
8. OnShape webhook handling for BOM change notifications

**Files:**

- `apps/web/src/routes/team/$program/$number/robots/index.tsx`
- `apps/web/src/routes/team/$program/$number/robots/$robotId/index.tsx`
- `apps/web/src/routes/team/$program/$number/robots/new/index.tsx`
- `apps/web/src/components/robots/robot-card.tsx`
- `apps/web/src/components/robots/bom-list.tsx`
- `apps/web/src/components/robots/onshape-sync-status.tsx`

**Reference:** [onshape-spec.md](./onshape-spec.md) for integration details

**Issues:** 8-10

---

### Phase 5: Build - Software & Fabrication

**Goal:** Track code progress and custom part fabrication

**Tasks:**

1. Software page with GitHub integration (PR status, code progress)
2. Fabrication queue (3D print jobs, laser cutting, custom parts)
3. GitHub webhook handling for PR/commit updates
4. Print/fab job status tracking
5. Integration with robot BOMs for custom parts

**Files:**

- `apps/web/src/routes/team/$program/$number/software/index.tsx`
- `apps/web/src/routes/team/$program/$number/fabrication/index.tsx`
- `apps/web/src/components/software/pr-card.tsx`
- `apps/web/src/components/fabrication/job-card.tsx`

**Issues:** 5-6

---

### Phase 6: Outreach Hub

**Goal:** Community engagement tracking

**Tasks:**

1. Outreach overview with progress toward goals
2. Outreach event management
3. Hour logging interface
4. Impact tracking (students reached, events, stories)
5. Grant requirement tracking

**Files:**

- `apps/web/src/routes/team/$program/$number/outreach/index.tsx`
- `apps/web/src/routes/team/$program/$number/outreach/events/index.tsx`
- `apps/web/src/routes/team/$program/$number/outreach/hours/index.tsx`
- `apps/web/src/components/outreach/progress-card.tsx`
- `apps/web/src/components/outreach/hour-log-form.tsx`

**Issues:** 5-6

---

### Phase 7: Operations (Competitions, Travel, Documents, Non-Parts Orders)

**Goal:** Event logistics, compliance, and non-parts ordering

**Tasks:**

1. Competition calendar and prep checklists
2. Travel planning interface
3. Permission form tracking
4. Document status dashboard
5. Bulk reminder functionality
6. Non-parts orders (apparel, supplies, food)
7. Meal planning for events with dietary tracking

**Files:**

- `apps/web/src/routes/team/$program/$number/operations/index.tsx`
- `apps/web/src/routes/team/$program/$number/operations/competitions/index.tsx`
- `apps/web/src/routes/team/$program/$number/operations/travel/index.tsx`
- `apps/web/src/routes/team/$program/$number/operations/documents/index.tsx`
- `apps/web/src/routes/team/$program/$number/operations/orders/index.tsx`
- `apps/web/src/components/operations/form-status-card.tsx`
- `apps/web/src/components/operations/meal-planner.tsx`

**Issues:** 8-10

---

### Phase 8: Sponsorships

**Goal:** Relationship nurturing, not just tracking

**Tasks:**

1. Sponsor list with relationship health indicators
2. Sponsor detail with contact history
3. Deliverable tracking
4. Moment capture and sharing
5. Update drafting with GLaDOS suggestions

**Files:**

- `apps/web/src/routes/team/$program/$number/sponsors/index.tsx`
- `apps/web/src/routes/team/$program/$number/sponsors/$sponsorId/index.tsx`
- `apps/web/src/components/sponsors/sponsor-card.tsx`
- `apps/web/src/components/sponsors/relationship-health.tsx`
- `apps/web/src/components/sponsors/moment-card.tsx`

**Issues:** 5-6

---

### Phase 9: Marketing (Configurable)

**Goal:** Team branding and visibility

**Tasks:**

1. Branding page (logos, colors, style guide)
2. Social media tracking (posts, engagement)
3. Pit materials management (banners, giveaways inventory)
4. Media library for photos/videos

**Files:**

- `apps/web/src/routes/team/$program/$number/marketing/index.tsx`
- `apps/web/src/routes/team/$program/$number/marketing/branding/index.tsx`
- `apps/web/src/routes/team/$program/$number/marketing/social/index.tsx`
- `apps/web/src/components/marketing/media-library.tsx`

**Issues:** 3-4

---

### Phase 10: Finance

**Goal:** Budget visibility and expense tracking

**Tasks:**

1. Budget overview with category breakdown
2. Expense logging with receipt capture
3. Grant compliance tracking
4. Budget vs. actual visualization
5. Export for reporting

**Files:**

- `apps/web/src/routes/team/$program/$number/finance/index.tsx`
- `apps/web/src/routes/team/$program/$number/finance/budget/index.tsx`
- `apps/web/src/routes/team/$program/$number/finance/expenses/index.tsx`
- `apps/web/src/components/finance/budget-bar.tsx`
- `apps/web/src/components/finance/expense-form.tsx`

**Issues:** 5-6

---

### Phase 11: Settings & Agent Config

**Goal:** Team configuration and agent preferences

**Tasks:**

1. Team settings page (name, logo, integrations)
2. Agent personality selector (GLaDOS, Wheatley, neutral, etc.)
3. Notification preferences
4. Discord integration status
5. Integration configuration (OnShape, GitHub)
6. Section visibility toggles (e.g., hide Marketing if not needed)

**Files:**

- `apps/web/src/routes/team/$program/$number/settings/index.tsx`
- `apps/web/src/components/settings/agent-config.tsx`
- `apps/web/src/components/settings/notification-prefs.tsx`
- `apps/web/src/components/settings/section-visibility.tsx`

**Issues:** 3-4

---

### Phase 12: GLaDOS Chat Interface

**Goal:** Conversational AI interface in web UI (parity with Discord)

**Tasks:**

1. Build GladosChatPopover component (collapsible sidebar)
2. Implement chat message rendering with markdown support
3. Build ActionPlan component for plan preview
4. Implement plan approval/modification flow
5. Connect to GLaDOS backend API
6. Add contextual awareness (current page context)
7. Persist chat history per team/session
8. Add keyboard shortcut (⌘+G) toggle

**Files:**

- `apps/web/src/components/glados/chat-popover.tsx`
- `apps/web/src/components/glados/message.tsx`
- `apps/web/src/components/glados/action-plan.tsx`
- `apps/web/src/components/glados/action-result.tsx`
- `apps/web/src/components/glados/chat-input.tsx`
- `apps/web/src/hooks/use-glados-chat.ts`
- `apps/web/src/components/layout/app-layout.tsx` (add popover slot)

**Issues:** 6-8

---

## Database Considerations

New tables needed (backend work, separate from UI):

| Table                  | Purpose                         |
| ---------------------- | ------------------------------- |
| `robots`               | Robot management with BOM       |
| `bom_items`            | Per-robot bill of materials     |
| `events`               | Outreach and competition events |
| `event_attendees`      | Who's attending, form status    |
| `outreach_hours`       | Hour logging                    |
| `sponsors`             | Sponsor relationships           |
| `sponsor_contacts`     | Contact history                 |
| `sponsor_deliverables` | Obligations tracking            |
| `sponsor_moments`      | Shareable achievements          |
| `permission_forms`     | Form tracking                   |
| `trips`                | Travel planning                 |
| `travelers`            | Per-person travel docs          |
| `budget_categories`    | Budget allocation               |
| `expenses`             | Expense tracking                |

---

## Success Metrics

### Qualitative

- Dashboard answers "how is my team doing?" holistically
- Mentors spend less time on logistics, more on mentoring
- Students feel ownership of their operational responsibilities
- Sponsor relationships improve through proactive contact

### Quantitative

- Time to find "what needs attention" reduced
- Permission form completion rate before events increases
- Sponsor contact frequency improves
- Outreach hour logging adoption
- Budget tracking usage

---

## Issue Breakdown Summary

| Phase     | Description                    | Est. Issues |
| --------- | ------------------------------ | ----------- |
| 1         | Navigation Restructure         | 5-6         |
| 2         | Action Center Dashboard        | 8-10        |
| 3         | Team Calendar                  | 4-5         |
| 4         | Robots & BOM + OnShape         | 8-10        |
| 5         | Build - Software & Fabrication | 5-6         |
| 6         | Outreach Hub                   | 5-6         |
| 7         | Operations                     | 8-10        |
| 8         | Sponsorships                   | 5-6         |
| 9         | Marketing                      | 3-4         |
| 10        | Finance                        | 5-6         |
| 11        | Settings & Agent Config        | 3-4         |
| 12        | GLaDOS Chat Interface          | 6-8         |
| **Total** |                                | **65-83**   |

---

## Appendix: Visual Hierarchy

### Information Priority (Top to Bottom)

1. **Team health status** — Are we competition ready?
2. **Upcoming events** — What's happening soon?
3. **Items needing attention** — What requires human decision?
4. **Progress indicators** — Outreach hours, budget burn, BOM completion
5. **Technical status** — Parts, orders (still important, but in context)

### Color Semantics

| Color  | Meaning                       | Use                                |
| ------ | ----------------------------- | ---------------------------------- |
| Green  | Healthy, complete, on-track   | Relationship healthy, forms signed |
| Yellow | Needs attention soon          | Approaching deadline, running low  |
| Orange | Warning, approaching critical | Overdue soon, budget tight         |
| Red    | Critical, overdue, blocked    | Missing forms, sponsor lapsed      |
| Blue   | Informational, in progress    | Orders shipping, events upcoming   |
| Purple | Outreach/community            | Outreach hours, community events   |
| Pink   | Relationships                 | Sponsor contacts, moments          |

---

_This specification should be converted to beads issues for implementation tracking._
