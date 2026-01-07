# BuildSeason

## UI/UX Design Specification

**Version:** 1.0
**Date:** December 29, 2025
**Status:** Draft
**Companion Documents:** [requirements.md](./requirements.md), [specification.md](./specification.md), [ui-refocus-spec.md](./ui-refocus-spec.md)

> **⚠️ Important:** The Information Architecture (Section 2) and Page Specifications (Section 5) in this document have been superseded by [ui-refocus-spec.md](./ui-refocus-spec.md), which expands BuildSeason to a holistic team management platform. **Refer to this document for:** design system, personas, user journeys, accessibility requirements, and responsive strategy.

---

## Executive Summary

This document specifies the user interface and user experience design for BuildSeason. It complements the technical specification (HOW to build) and requirements (WHAT to build) by defining HOW users will experience the product.

**Key Design Principles:**

1. **GitHub-Style Dual Experience** — Marketing site for unauthenticated users, dashboard for authenticated users
2. **Discord-First, Web-Second** — The Discord agent is primary; web is the "back office"
3. **Multi-Team Native** — Users can belong to multiple teams; the UI reflects this naturally
4. **Public Team Pages** — Teams have public profiles like GitHub repos
5. **Progressive Disclosure** — Show what's needed, when it's needed

**Target Users:**

- Students (13-18) — Discord natives, want quick, fun interactions; may be on multiple teams
- Mentors — Time-strapped volunteers, need efficient dashboards; often coach multiple teams
- Parents — Limited access, focused on their child's involvement; may have kids on multiple teams
- Coaches/Admins — Full visibility, approval workflows; may manage teams across an organization

**Multi-Team Reality:**
A core assumption: users frequently belong to multiple teams simultaneously:

- Pete was on two FTC teams last year (Aperture Science and Cosmic Brownies)
- Marcus mentors both Aperture Science and Sigmacorns
- Mrs. Denning's son is on two teams; she needs to sign permission forms for both
- The UI must make team context clear and switching seamless

---

## Table of Contents

1. [User Research Foundation](#1-user-research-foundation)
2. [Information Architecture](#2-information-architecture)
3. [User Personas](#3-user-personas)
4. [User Journeys](#4-user-journeys)
5. [Page-by-Page Specifications](#5-page-by-page-specifications)
6. [Component Library](#6-component-library)
7. [Design System](#7-design-system)
8. [Interaction Patterns](#8-interaction-patterns)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Mobile & Responsive Strategy](#10-mobile--responsive-strategy)

---

## 1. User Research Foundation

### 1.1 Core Insight: Dual Mental Models

BuildSeason users operate in two distinct mental models:

**Discord Mode (Primary for Students)**

- Conversational, interrupt-driven
- Quick queries and responses
- Social context (team channels)
- Notification-based engagement

**Web Mode (Primary for Mentors/Admins)**

- Dashboard-driven, focused work
- Batch operations (review orders, manage inventory)
- Report generation and export
- Administrative tasks

The web experience should complement Discord, not compete with it.

### 1.2 Key User Behaviors

| User Type | Primary Interface | Web Usage  | Key Tasks                                     |
| --------- | ----------------- | ---------- | --------------------------------------------- |
| Students  | Discord           | Occasional | Update inventory, check BOM, view orders      |
| Mentors   | 50/50             | Regular    | Approve orders, manage budget, track progress |
| Parents   | Web only          | Rare       | Sign forms, update emergency info             |
| Admins    | Web primary       | Daily      | All management tasks                          |

### 1.3 Competition Context

Users often access BuildSeason at:

- **Shop/Lab** — Desktop, good connectivity
- **Competition venues** — Mobile, unreliable WiFi
- **Home** — Mix of devices
- **Outreach events** — Mobile, often offline

This demands:

- Offline-capable critical features (inventory lookup, contact info)
- Mobile-first for competition day views
- Fast load times (venue WiFi is terrible)

---

## 2. Information Architecture

### 2.1 Site Map: Unauthenticated (Marketing)

```
buildseason.org/
├── / (Landing Page)
│   ├── Hero: Value proposition
│   ├── Features overview
│   ├── Social proof (team testimonials)
│   └── Call to action → Sign up
│
├── /features
│   ├── Parts Management
│   ├── Order Tracking
│   ├── Budget Visibility
│   ├── Discord Integration
│   └── Team Collaboration
│
├── /about
│   ├── Mission
│   ├── Team (if applicable)
│   └── Open source info
│
├── /docs (Documentation)
│   ├── Getting Started
│   ├── Discord Bot Setup
│   ├── API Reference
│   └── Contributing
│
├── /team/:program/:number (Public Team Pages)
│   ├── Team info (name, number, location)
│   ├── Description & logo
│   ├── Sponsors
│   ├── Upcoming events
│   ├── Competition history (via FTC Stats)
│   └── Contact (filtered)
│
└── /login (OAuth only: GitHub, Google - no separate signup page)
```

**Authentication:** OAuth only via GitHub and Google. No email/password, no signup page.
OAuth handles both login and registration - new users are created on first OAuth login.

### 2.2 Site Map: Authenticated (Dashboard)

```
buildseason.org/
├── /dashboard (Home)
│   ├── Team switcher (multi-team users)
│   ├── Quick stats (pending orders, low stock, budget)
│   ├── Recent activity feed
│   └── Upcoming events
│
├── /teams
│   ├── List of user's teams
│   ├── /teams/new (Create team)
│   └── /teams/join (Join via invite code)
│
├── /team/:program/:number (Team Context)
│   │
│   ├── /overview (Team Dashboard)
│   │   ├── Stats cards (parts, orders, budget)
│   │   ├── Active robots summary
│   │   ├── Activity feed
│   │   ├── Alerts (low stock, pending approvals)
│   │   └── Quick actions
│   │
│   ├── /robots (NEW: Robot management)
│   │   ├── Robot cards (Cheddar, Pepperjack, etc.)
│   │   ├── /robots/new
│   │   ├── /robots/:robotId
│   │   ├── /robots/:robotId/edit
│   │   └── /robots/:robotId/bom (per-robot BOM)
│   │
│   ├── /parts (Team inventory - persists across robots)
│   │   ├── Inventory list (filterable, searchable)
│   │   ├── /parts/new
│   │   ├── /parts/:partId
│   │   └── /parts/:partId/edit
│   │
│   ├── /orders
│   │   ├── Order list (filterable by status)
│   │   ├── /orders/new
│   │   ├── /orders/:orderId
│   │   └── /orders/:orderId/edit
│   │
│   ├── /vendors
│   │   ├── Vendor directory (global + team)
│   │   └── /vendors/:vendorId
│   │
│   ├── /budget (if role permits)
│   │   ├── Budget overview
│   │   ├── Spending by category
│   │   └── Export
│   │
│   ├── /members
│   │   ├── Member list with roles
│   │   ├── Invite management
│   │   └── Role management
│   │
│   ├── /events (Phase 2)
│   │   ├── Upcoming events
│   │   ├── Permission form status
│   │   └── Event details
│   │
│   └── /settings
│       ├── Team settings
│       ├── Discord integration
│       ├── OnShape integration
│       ├── GitHub integration
│       └── Notifications
│
├── /account
│   ├── Profile
│   ├── Linked teams
│   ├── Notification preferences
│   └── Connected accounts (Discord, Google, etc.)
│
└── /org/:orgSlug (Organization Context, if applicable)
    ├── /overview (Org dashboard)
    ├── /teams (All org teams)
    ├── /members (Org-level members)
    └── /settings (Org settings)
```

### 2.3 URL Structure Philosophy

Following the specification, URLs use **team numbers as identity** (no UUIDs):

```
/team/ftc/5064              → Aperture Science
/team/frc/900               → Zebracorns
/team/ftc/5064/parts        → Parts inventory
/team/ftc/5064/orders/new   → Create order
```

**URL Rules:**

1. Team context always includes `program` and `number`
2. No database IDs in URLs (use slugs or meaningful identifiers)
3. Public pages accessible without auth
4. Auth-required pages redirect to login with return URL

---

## 3. User Personas

### 3.1 Sofia — The Engaged Student

**Demographics:**

- 16 years old, junior
- FTC team member for 2 years
- Lead of mechanical subsystem

**Goals:**

- Check if parts are in stock quickly
- Know when ordered parts arrive
- Feel ownership over "her" subsystem

**Pain Points:**

- Hates checking email
- Forgets to update shared spreadsheets
- Gets frustrated when parts are missing on build day

**Key Behaviors:**

- Lives in Discord
- Checks phone constantly
- Will ignore web apps but responds to @mentions
- Screenshot and shares funny bot messages

**Primary Interface:** Discord
**Web Usage:** Weekly, usually on laptop at shop

**Quote:** _"Just tell me if we have the parts. I don't want to click through menus."_

---

### 3.1b Pete — The Multi-Team Student

**Demographics:**

- 17 years old, senior
- On two FTC teams simultaneously (Aperture Science and Cosmic Brownies)
- Strong programmer, helps both teams with code

**Goals:**

- Contribute to both teams without confusion
- Keep track of which parts are where
- Not miss deadlines for either team

**Pain Points:**

- Parts get mixed up between teams
- Meetings overlap, hard to track schedule
- Discord channels from both teams flood notifications

**Key Behaviors:**

- Switches between team contexts frequently
- Uses team-specific Discord channels
- Needs clear separation of team inventories and BOMs

**Primary Interface:** Discord
**Web Usage:** Occasional, usually on phone

**Quote:** _"Wait, do WE have those servos, or does the other team?"_

---

### 3.2 Coach Marcus — The Time-Strapped Mentor

**Demographics:**

- 38 years old, software engineer
- Volunteers 10-15 hours/week
- Coaches 2 FTC teams (Aperture Science and Sigmacorns)

**Goals:**

- Approve orders quickly across both teams
- Know what's running low before it's urgent on either team
- Spend time with students, not spreadsheets
- See at-a-glance status of both teams

**Pain Points:**

- Too many tabs open (especially juggling two teams)
- Chasing students for updates
- Missing context when making decisions
- Losing track of which team is which in notifications

**Key Behaviors:**

- Checks BuildSeason on commute (mobile)
- Does batch approvals on weekends—sometimes for both teams at once
- Wants notifications grouped by team or aggregated (configurable)
- Uses "All Teams" view to prioritize across both teams

**Primary Interface:** 50/50 Discord/Web
**Web Usage:** Daily, quick checks on mobile, batch work on desktop

**Quote:** _"I have 10 minutes between meetings. Show me what needs my attention—on both teams."_

---

### 3.3 Mrs. Chen — The Parent Chaperone

**Demographics:**

- 45 years old, parent of student on team
- Occasionally chaperones events
- Not tech-savvy

**Goals:**

- Sign permission forms
- Know when events are happening
- Reach the coach in emergencies

**Pain Points:**

- Too many apps and logins
- Doesn't understand robotics terminology
- Worries about child's safety at events

**Key Behaviors:**

- Uses email primarily
- Only logs in when specifically asked
- Prefers simple, clear instructions

**Primary Interface:** Email notifications → Web
**Web Usage:** Monthly, only when action needed

**Quote:** _"Just tell me what to sign and when to pick up my kid."_

---

### 3.3b Mrs. Denning — Parent with Multi-Team Child

**Demographics:**

- 42 years old, parent of Pete (who is on TWO teams)
- Works full-time, limited availability
- Comfortable with tech but wants efficiency

**Goals:**

- Sign permission forms for BOTH of Pete's teams
- Understand which event is for which team
- One login, see everything about Pete's robotics

**Pain Points:**

- Confused when two events are on same weekend for different teams
- Gets notifications from both teams—hard to track
- Worried about over-committing Pete

**Key Behaviors:**

- Prefers a unified view: "Pete's upcoming events" regardless of team
- Needs clear team labels on everything
- Uses calendar sync if available

**Primary Interface:** Email notifications → Web
**Web Usage:** Weekly during competition season

**Quote:** _"Pete's on two teams? Great. But I need ONE place to see all his stuff."_

---

### 3.4 Mr. Rodriguez — The Head Coach/Admin

**Demographics:**

- 52 years old, school teacher
- Head coach, manages all team operations
- Handles budget and sponsor relations

**Goals:**

- Full visibility into all team operations
- Generate reports for sponsors
- Manage mentor access and roles

**Pain Points:**

- Tracking spending across multiple vendors
- Knowing what was approved and when
- Communicating with parents efficiently

**Key Behaviors:**

- Heavy web user
- Checks dashboard daily
- Exports data for school administration
- Manages multiple teams in one org

**Primary Interface:** Web (primary), Discord (monitoring)
**Web Usage:** Daily, extended sessions

**Quote:** _"I need to know everything, but I don't need to do everything."_

---

## 4. User Journeys

### 4.1 New User: Team Discovery to Signup

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────────┘

DISCOVERY
    │
    ▼
┌─────────────────┐
│ Google Search   │  "FTC team management software"
│ or Team Link    │  or direct link from team
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Landing Page    │  See value prop, features, testimonials
│ buildseason.org │  Open-source, volunteer-built
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────────┐
│ View  │ │ Click "Get    │
│ Team  │ │ Started"      │
│ Page  │ └───────┬───────┘
└───┬───┘         │
    │             ▼
    │     ┌───────────────┐
    │     │ Login Page    │  OAuth only: GitHub, Google (no email/password)
    │     └───────┬───────┘
    │             │
    │             ▼
    │     ┌───────────────┐
    │     │ Onboarding    │  "Create team" or "Join team"
    │     └───────┬───────┘
    │             │
    │        ┌────┴────┐
    │        ▼         ▼
    │    ┌───────┐ ┌───────────┐
    │    │Create │ │Join with  │
    │    │ Team  │ │invite code│
    │    └───┬───┘ └─────┬─────┘
    │        │           │
    │        └─────┬─────┘
    │              ▼
    │      ┌───────────────┐
    │      │ Team Dashboard│  First-run guidance
    │      │ (Empty State) │  "Add your first part" etc.
    │      └───────────────┘
    │
    ▼
┌───────────────┐
│ Public Team   │  View team info, see they use BuildSeason
│ Page          │  Link to request joining
└───────────────┘
```

### 4.2 Mentor: Order Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORDER APPROVAL JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────┘

TRIGGER: Student submits order for approval
    │
    ▼
┌─────────────────┐
│ Discord DM      │  "@Marcus: Sofia submitted an order for approval"
│ from Agent      │  "4 REV servos, $203.96. Budget: $847 remaining"
│                 │  "React ✅ to approve, ❌ to reject"
└────────┬────────┘
         │
    ┌────┴─────────────────────────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌─────────────────┐                         ┌─────────────────┐
│ Quick Approve   │                         │ Need More Info  │
│ via Discord     │                         │ → Open Web      │
│ (React ✅)      │                         └────────┬────────┘
└────────┬────────┘                                  │
         │                                           ▼
         │                                   ┌─────────────────┐
         │                                   │ Order Detail    │
         │                                   │ Page            │
         │                                   │                 │
         │                                   │ • Part details  │
         │                                   │ • Vendor info   │
         │                                   │ • Student notes │
         │                                   │ • Budget impact │
         │                                   │ • Order history │
         │                                   └────────┬────────┘
         │                                            │
         │                                   ┌────────┴────────┐
         │                                   ▼                 ▼
         │                           ┌───────────┐     ┌───────────┐
         │                           │ Approve   │     │ Reject    │
         │                           │ with note │     │ with note │
         │                           └─────┬─────┘     └─────┬─────┘
         │                                 │                 │
         └────────────────┬────────────────┴────────┬────────┘
                          │                         │
                          ▼                         ▼
                  ┌───────────────┐         ┌───────────────┐
                  │ Agent notifies│         │ Agent notifies│
                  │ Sofia in      │         │ Sofia with    │
                  │ Discord       │         │ rejection     │
                  │ "Order        │         │ reason        │
                  │ approved!"    │         └───────────────┘
                  └───────────────┘
```

### 4.3 Parent: Permission Form Signing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERMISSION FORM JOURNEY                               │
└─────────────────────────────────────────────────────────────────────────┘

TRIGGER: Event created that requires permission
    │
    ▼
┌─────────────────┐
│ Email to Parent │  "MakerFaire permission form needed"
│                 │  "Click to sign: [LINK]"
│                 │  "Event: Saturday Dec 14, 10am-6pm"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Login           │  Google OAuth (one-click if already logged in)
│ (if needed)     │  Or magic link from email
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Permission Form │  CLEAR, SIMPLE layout
│ Page            │
│                 │  Event: MakerFaire Outreach
│                 │  Date: Saturday, December 14
│                 │  Time: 10:00 AM - 6:00 PM
│                 │  Location: Convention Center
│                 │  Your child: Sofia Chen
│                 │
│                 │  Transportation: [Bus provided]
│                 │  Meals: [Lunch and dinner included]
│                 │
│                 │  Emergency contact on file:
│                 │  Mrs. Chen (555) 123-4567 ✓
│                 │
│                 │  [ ] I give permission for Sofia to attend
│                 │  [ ] I confirm emergency contact is current
│                 │
│                 │  [Sign & Submit]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirmation    │  "Permission form signed!"
│                 │  "Sofia is cleared for MakerFaire"
│                 │  "You'll receive event updates via email"
└─────────────────┘
```

### 4.4 Multi-Team User: Switching Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TEAM SWITCHING JOURNEY                                │
└─────────────────────────────────────────────────────────────────────────┘

User: Marcus (mentor on 2 FTC teams + 1 FRC team)

┌───────────────────────────────────────────────────────────────────┐
│                        Dashboard View                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ← Team Switcher (always visible)           │
│  │ 5064 Aperture ▼  │                                             │
│  └──────────────────┘                                             │
│      │                                                            │
│      ├── ✓ 5064 Aperture Science (FTC) ← Current                 │
│      ├──   20377 Sigmacorns (FTC)                                │
│      ├──   900 Zebracorns (FRC)                                  │
│      └── + Join another team                                      │
│                                                                    │
│  Current Team: Aperture Science                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 3 Orders │ │ 12 Low   │ │ $847     │ │ 2 Events │            │
│  │ Pending  │ │ Stock    │ │ Budget   │ │ Upcoming │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                    │
│  Recent Activity:                                                  │
│  • Sofia added 4 REV servos to cart                               │
│  • Jordan updated BOM for intake                                   │
│  • Parts received: goBILDA order #1234                            │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

                              │
                              │ Click "20377 Sigmacorns"
                              ▼

┌───────────────────────────────────────────────────────────────────┐
│                        Dashboard View                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐                                             │
│  │ 20377 Sigma ▼    │  ← Context switched                        │
│  └──────────────────┘                                             │
│                                                                    │
│  Current Team: Sigmacorns                                         │
│  (Different stats, different activity)                            │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

DESIGN NOTES:
• Team switcher persists across all pages
• URL updates to new team context: /team/ftc/20377/...
• Team color/branding can be customized per team
• "All Teams" view available for org-level users
```

---

## 5. Page-by-Page Specifications

### 5.1 Marketing Site (Unauthenticated)

#### 5.1.1 Landing Page (`/`)

**Purpose:** Convert visitors to signups

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAVIGATION                                                               │
│ [Logo] BuildSeason       Features  About  Docs  |  Login  [Sign Up]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                              HERO SECTION                                │
│                                                                          │
│    Stop managing spreadsheets.                                          │
│    Start building robots.                                                │
│                                                                          │
│    Team management, robot builds, parts, and orders —                  │
│    with intelligent Discord assistance for FTC/FRC teams.               │
│                                                                          │
│    [Get Started]  [See Demo]                                            │
│                                                                          │
│    ┌─────────────────────────────────────────────┐                     │
│    │ Screenshot/Animation of product             │                     │
│    └─────────────────────────────────────────────┘                     │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           FEATURES GRID                                  │
│                                                                          │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
│   │ Parts Mgmt    │  │ Order Tracking│  │ Discord Bot   │              │
│   │ [icon]        │  │ [icon]        │  │ [icon]        │              │
│   │ Track every   │  │ From request  │  │ Check stock,  │              │
│   │ bolt and      │  │ to delivery   │  │ place orders  │              │
│   │ servo         │  │ with approval │  │ from Discord  │              │
│   └───────────────┘  └───────────────┘  └───────────────┘              │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         SOCIAL PROOF                                     │
│                                                                          │
│   "BuildSeason saved us hours every week."                              │
│   — Coach, Team 5064 Aperture Science                                   │
│                                                                          │
│   Trusted by 50+ FTC/FRC teams                                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        CALL TO ACTION                                    │
│                                                                          │
│         Ready to streamline your build season?                          │
│                     [Get Started]                                        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                   │
│ Links | GitHub | About | Privacy | © BuildSeason                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- Clear value proposition in hero (not feature list)
- Demo video or interactive preview
- Testimonials from real teams
- Single primary CTA throughout
- Footer with GitHub link (open source credibility)

---

#### 5.1.2 Public Team Page (`/team/:program/:number`)

**Purpose:** Showcase team, enable discovery, encourage signups

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAVIGATION (Marketing Nav, not dashboard)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────┐                                                            │
│   │ [LOGO] │  Aperture Science                                          │
│   │        │  FTC Team 5064 • Durham, NC                                │
│   └────────┘                                                            │
│                                                                          │
│   🌐 Website   📧 Contact   🐙 GitHub                                   │
│                                                                          │
│   ────────────────────────────────────────────────                      │
│                                                                          │
│   ABOUT                                                                  │
│   Aperture Science is an FTC robotics team based at NCSSM in           │
│   Durham, North Carolina. We've been competing since 2015 and          │
│   focus on student-led engineering and outreach.                        │
│                                                                          │
│   ┌───────────────────┐  ┌───────────────────┐                         │
│   │ COMPETITION STATS │  │ UPCOMING EVENTS   │                         │
│   │ (via FTC Stats)   │  │                   │                         │
│   │                   │  │ NC State Qualifier│                         │
│   │ OPR: 142.3       │  │ Jan 15, 2026      │                         │
│   │ Awards: 12       │  │                   │                         │
│   │ Seasons: 8       │  │ MakerFaire Durham │                         │
│   └───────────────────┘  │ Feb 22, 2026      │                         │
│                          └───────────────────┘                         │
│                                                                          │
│   SPONSORS                                                               │
│   [Sponsor logos]                                                       │
│                                                                          │
│   ────────────────────────────────────────────────                      │
│                                                                          │
│   This team uses BuildSeason for team and build season management.     │
│   [Learn more about BuildSeason →]                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- Team branding (logo, colors if provided)
- Public info only (no inventory, orders, budget)
- Integration with FTC Stats/FIRST API for competition data
- Sponsor visibility (important for team relationships)
- Soft promotion of BuildSeason
- Contact button (goes through BuildSeason, not direct email)

---

### 5.2 Authenticated Experience (Dashboard)

#### 5.2.1 Main Dashboard (`/dashboard`)

**Purpose:** Landing pad after login, quick status and navigation

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                   │
│ [Logo]  ┌─────────────────┐              🔔 ⚙️ [Avatar ▼]              │
│         │ 5064 Aperture ▼ │  ← Team Switcher                           │
│         └─────────────────┘                                             │
├─────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │ MAIN CONTENT                                         │
│                  │                                                       │
│ ▸ Dashboard      │   Welcome back, Marcus                               │
│   Parts          │                                                       │
│   BOM            │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   Orders         │   │ 3       │ │ 12      │ │ $847    │ │ 2       │  │
│   Vendors        │   │ Orders  │ │ Low     │ │ Budget  │ │ Events  │  │
│   Budget         │   │ Pending │ │ Stock   │ │ Left    │ │ Upcoming│  │
│   ─────────      │   │ ⚠️      │ │ ⚠️      │ │ ✓       │ │         │  │
│   Members        │   └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│   Events         │                                                       │
│   Settings       │   ──────────────────────────────────────────────     │
│                  │                                                       │
│                  │   NEEDS ATTENTION                                     │
│                  │   ┌────────────────────────────────────────────┐     │
│                  │   │ ⚠️ 3 orders awaiting your approval         │     │
│                  │   │    Sofia - REV servos ($204)               │     │
│                  │   │    Jordan - goBILDA wheels ($89)           │     │
│                  │   │    Marcus - Misc hardware ($32)            │     │
│                  │   │                                            │     │
│                  │   │    [Review All →]                          │     │
│                  │   └────────────────────────────────────────────┘     │
│                  │                                                       │
│                  │   RECENT ACTIVITY                                     │
│                  │   ┌────────────────────────────────────────────┐     │
│                  │   │ • Sofia updated arm BOM          2 min ago │     │
│                  │   │ • Parts received: Order #234    Yesterday  │     │
│                  │   │ • Jordan created new part       Yesterday  │     │
│                  │   │ • Order #233 shipped            2 days ago │     │
│                  │   └────────────────────────────────────────────┘     │
│                  │                                                       │
└──────────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements:**

- Persistent team switcher in header
- Collapsible sidebar navigation
- Alert-first design (pending approvals, low stock, deadlines)
- Activity feed showing recent team actions
- Role-appropriate content (students don't see budget)

---

#### 5.2.2 Parts Inventory (`/team/:program/:number/parts`)

**Purpose:** View, search, and manage parts inventory

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER + TEAM SWITCHER (persistent)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR │ MAIN CONTENT                                                   │
│         │                                                                │
│         │  Parts Inventory                          [+ Add Part]        │
│         │                                                                │
│         │  ┌────────────────────────────────────────────────────────┐  │
│         │  │ 🔍 Search parts...    │ Vendor ▼ │ Subsystem ▼ │ Stock ▼│  │
│         │  └────────────────────────────────────────────────────────┘  │
│         │                                                                │
│         │  ⚠️ 12 parts below reorder point                              │
│         │                                                                │
│         │  ┌────────────────────────────────────────────────────────┐  │
│         │  │ PART          │ SKU        │ VENDOR  │ QTY │ STATUS   │  │
│         │  ├───────────────┼────────────┼─────────┼─────┼──────────┤  │
│         │  │ HD Hex Motor  │ REV-41-1301│ REV     │ 8   │ ✓ OK     │  │
│         │  │ Servo - Smart │ REV-41-1097│ REV     │ 2   │ ⚠️ Low   │  │
│         │  │ Mecanum Wheel │ gb-3213    │ goBILDA │ 4   │ ✓ OK     │  │
│         │  │ Channel 48"   │ gb-1121    │ goBILDA │ 0   │ 🔴 Out   │  │
│         │  │ ...                                                    │  │
│         │  └────────────────────────────────────────────────────────┘  │
│         │                                                                │
│         │  Showing 1-25 of 156 parts              [← 1 2 3 ... →]       │
│         │                                                                │
└─────────┴────────────────────────────────────────────────────────────────┘
```

**Table Interactions:**

- Click row → Part detail page
- Inline edit for quantity (quick update)
- Bulk select for operations
- Sort by any column
- Filter combinations (vendor + subsystem + stock status)

**Smart Search with Vendor Catalog Autocomplete:**
When typing in the search box or "Add Part" form, autocomplete from the vendor catalog:

```
User types: "REV-41-13"

┌────────────────────────────────────────────────────────────────┐
│ 📦 From Vendor Catalog:                                         │
│ REV-41-1301  HD Hex Motor                    $24.99  ✓ In Stock │
│ REV-41-1300  Core Hex Motor                  $17.99  ✓ In Stock │
│ REV-41-1310  HD Hex Motor 20:1               $24.99  ⚠️ Low     │
├────────────────────────────────────────────────────────────────┤
│ 📋 In Your Inventory:                                           │
│ REV-41-1301  HD Hex Motor                    Qty: 8  Shelf A-3  │
└────────────────────────────────────────────────────────────────┘
```

- One-click to add catalog item (pre-fills name, SKU, price, image)
- Shows current vendor stock status and price
- "Teams also buy" suggestions when adding items

**Part Detail Page** (`/team/:program/:number/parts/:partId`):

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Parts                                              [Edit]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌───────┐                                                               │
│ │[IMAGE]│  HD Hex Motor                                                 │
│ │       │  REV-41-1301                                                  │
│ └───────┘  Vendor: REV Robotics                                         │
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                          │
│ Quantity: 8        Reorder Point: 4        Status: ✓ OK                 │
│                                                                          │
│ Location: Shelf A-3, Bin 12                                             │
│                                                                          │
│ Unit Price: $24.99        Total Value: $199.92                          │
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                          │
│ USED IN BOM                                                              │
│ • Drivetrain (4 needed)                                                 │
│ • Lift mechanism (2 needed)                                             │
│                                                                          │
│ ORDER HISTORY                                                            │
│ • Order #234 - 4 received Dec 15                                        │
│ • Order #198 - 4 received Oct 3                                         │
│                                                                          │
│ ACTIONS                                                                  │
│ [Quick Order]  [Update Quantity]  [View on Vendor Site]                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 5.2.3 Orders (`/team/:program/:number/orders`)

**Purpose:** Track and manage orders through lifecycle

**List View:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Orders                                                [+ New Order]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Status: All ▼  │ Vendor: All ▼  │ Created by: All ▼               ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ PENDING APPROVAL (3)                                                ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ ┌────────────────────────────────────────────────────────────────┐ ││
│ │ │ Order #238                               Sofia • Today          │ ││
│ │ │ REV Robotics • 4 items                   $203.96               │ ││
│ │ │                                          [Approve] [Reject]     │ ││
│ │ └────────────────────────────────────────────────────────────────┘ ││
│ │ ┌────────────────────────────────────────────────────────────────┐ ││
│ │ │ Order #237                               Jordan • Yesterday     │ ││
│ │ │ goBILDA • 2 items                        $89.50                │ ││
│ │ │                                          [Approve] [Reject]     │ ││
│ │ └────────────────────────────────────────────────────────────────┘ ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ IN PROGRESS (2)                                                     ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ Order #235 • REV • $156.00 • Status: Ordered, expected Dec 28      ││
│ │ Order #234 • goBILDA • $234.50 • Status: Shipped, tracking: 1Z...  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ COMPLETED (45)                                            [View All]││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Order States Visual Treatment:**
| Status | Color | Icon | Action Available |
|--------|-------|------|------------------|
| Draft | Gray | 📝 | Edit, Submit |
| Pending | Yellow | ⏳ | Approve, Reject (mentor+) |
| Approved | Green | ✓ | Mark Ordered (mentor+) |
| Rejected | Red | ✗ | View reason, Resubmit |
| Ordered | Blue | 📦 | Add tracking, Mark Received |
| Received | Green | ✅ | Complete |

---

#### 5.2.4 Robots (`/team/:program/:number/robots`)

**Purpose:** Manage robots built during the season

**Key Concept:** A team builds multiple robots per season. Each robot has its own name and BOM.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Robots (2024-2025 Into The Deep)                      [+ New Robot]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 🤖 CHEDDAR                                    Status: Competition Ready│
│ │    Competition robot                                                   │
│ │    BOM: 47 parts, $1,234 • Coverage: 92%                             │
│ │    [View BOM] [Edit]                                                  │
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 🤖 PEPPERJACK                                 Status: Building        │
│ │    Practice robot                                                      │
│ │    BOM: 42 parts, $987 • Coverage: 78%                               │
│ │    [View BOM] [Edit]                                                  │
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 🤖 PARMESAN                                   Status: Planning        │
│ │    Prototype/backup                                                    │
│ │    BOM: 23 parts, $456 • Coverage: 45%                               │
│ │    [View BOM] [Edit]                                                  │
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│ ARCHIVED ROBOTS                                                          │
│ └─ v0 (disassembled Dec 1) - parts returned to inventory                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Robot Card:**

- Robot name (prominently displayed)
- Description (competition, practice, prototype)
- Status badge (planning, building, competition_ready, disassembled)
- BOM summary (parts count, cost, coverage percentage)
- Quick actions: View BOM, Edit, Disassemble

**Robot Statuses:**
| Status | Color | Description |
|--------|-------|-------------|
| planning | gray | Robot defined but no parts allocated |
| building | blue | Parts being allocated from inventory |
| competition_ready | green | BOM complete, robot operational |
| disassembled | orange | Parts returned to inventory |
| archived | gray | Historical record only |

---

#### 5.2.5 Robot BOM (`/team/:program/:number/robots/:robotId/bom`)

**Purpose:** Define parts needed for a specific robot, compare against team inventory

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Robots                                                         │
│                                                                          │
│ 🤖 CHEDDAR - Bill of Materials                      [+ Add to BOM]      │
│    Competition robot • Status: Competition Ready                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Subsystem: All ▼        [Allocate Parts]    [Compare to Inventory]  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ DRIVETRAIN                                           8 items, $456.00   │
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ Part             │ Needed │ Allocated │ In Stock │ Status           ││
│ │ HD Hex Motor     │   4    │     4     │    4     │ ✓ Allocated      ││
│ │ Mecanum Wheel    │   4    │     4     │    0     │ ✓ Allocated      ││
│ │ Wheel Hub        │   4    │     2     │    0     │ ⚠️ Need 2 more   ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ INTAKE                                               12 items, $89.00   │
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ Part             │ Needed │ Allocated │ In Stock │ Status           ││
│ │ Servo - Smart    │   2    │     2     │    0     │ ✓ Allocated      ││
│ │ Compliant Wheel  │   4    │     0     │    0     │ 🔴 Need to order ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                          │
│ SUMMARY                                                                  │
│ Total BOM: 47 parts, $1,234.00 estimated                                │
│ Allocated: 43/47 parts (91%)                                            │
│ Available in inventory: 2 more parts                                    │
│ Need to order: 2 parts, $45.00                                          │
│                                                                          │
│ [Allocate Available Parts]  [Create Order for Missing Parts]            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Concepts:**

- **Needed**: How many parts this robot's BOM requires
- **Allocated**: How many parts have been pulled from inventory for this robot
- **In Stock**: How many unallocated parts remain in team inventory

**Key Features:**

- Group by subsystem with collapsible sections
- Three-way comparison: needed vs allocated vs in-stock
- "Allocate Parts" pulls from inventory to this robot's BOM
- Gap analysis highlighting what needs ordering
- One-click "order missing parts" workflow
- OnShape sync indicator (Phase 2)

**Disassemble Robot Flow:**
When a robot is disassembled:

1. Confirm action with dialog
2. All allocated parts return to team inventory
3. Robot status changes to "disassembled"
4. BOM preserved for historical reference
5. Parts quantities in inventory increase

---

#### 5.2.5 Members (`/team/:program/:number/members`)

**Purpose:** Manage team membership and roles

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Team Members                                         [+ Invite Member]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ADMINS & MENTORS (4)                                                     │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 👤 Marcus Chen        admin       marcus@email.com      [Manage ▼] ││
│ │ 👤 Sarah Rodriguez    mentor      sarah@school.edu      [Manage ▼] ││
│ │ 👤 David Kim          mentor      david@email.com       [Manage ▼] ││
│ │ 👤 Lisa Park          mentor      lisa@email.com        [Manage ▼] ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ STUDENTS (12)                                                            │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 👤 Sofia Chen         student     sofia@email.com       [Manage ▼] ││
│ │    └─ Parent: Mrs. Chen (linked)                                    ││
│ │ 👤 Jordan Williams    student     jordan@email.com      [Manage ▼] ││
│ │ 👤 Alex Thompson      student     alex@email.com        [Manage ▼] ││
│ │ ...                                                                  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ PARENTS (8)                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 👤 Mrs. Chen          parent      chen@email.com        Sofia's mom ││
│ │ 👤 Mr. Williams       parent      williams@email.com    Jordan's dad││
│ │ ...                                                                  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                          │
│ PENDING INVITES (2)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ mentor invite • sent Dec 20 • expires Dec 27         [Resend] [X]  ││
│ │ student invite • sent Dec 22 • expires Dec 29        [Resend] [X]  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Invite Flow:**

```
[+ Invite Member]
       │
       ▼
┌─────────────────────────────────┐
│ Invite to Aperture Science      │
│                                 │
│ Role: [Student ▼]               │
│                                 │
│ Option 1: Email invite          │
│ ┌─────────────────────────────┐ │
│ │ email@example.com           │ │
│ └─────────────────────────────┘ │
│ [Send Invite]                   │
│                                 │
│ ─── OR ───                      │
│                                 │
│ Option 2: Share invite link     │
│ https://buildseason.org/...     │
│ [Copy Link] expires in 7 days   │
│                                 │
└─────────────────────────────────┘
```

---

### 5.3 Parent-Specific Views

#### 5.3.1 Parent Dashboard (`/dashboard` for parent role)

Parents see a simplified, focused view:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BuildSeason                                          ⚙️ [Mrs. Chen ▼]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Sofia's Teams                                                            │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Aperture Science (FTC 5064)                                         ││
│ │                                                                      ││
│ │ Sofia is a student on this team.                                    ││
│ │                                                                      ││
│ │ ⚠️ ACTION NEEDED                                                     ││
│ │ ┌──────────────────────────────────────────────────────────────────┐││
│ │ │ Permission form required for: MakerFaire Outreach                │││
│ │ │ Date: Saturday, December 14                                       │││
│ │ │ [Sign Permission Form →]                                          │││
│ │ └──────────────────────────────────────────────────────────────────┘││
│ │                                                                      ││
│ │ UPCOMING EVENTS                                                      ││
│ │ • NC State Qualifier - Jan 15 (permission: ✓ signed)                ││
│ │ • MakerFaire - Dec 14 (permission: ⚠️ needed)                        ││
│ │                                                                      ││
│ │ EMERGENCY CONTACT                                                    ││
│ │ Phone: (555) 123-4567 ✓ Current                                     ││
│ │ [Update Contact Info]                                                ││
│ │                                                                      ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                          │
│ Need to contact the team?                                                │
│ [Message Coach Rodriguez →]                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Principles for Parent View:**

- Minimal navigation (no sidebar)
- Action-oriented (what do they need to do?)
- Child-focused (only shows their child's information)
- Clear, simple language (no robotics jargon)
- Emergency contact always visible and updatable

---

## 6. Component Library

### 6.1 Core Components (shadcn/ui base)

We extend shadcn/ui with BuildSeason-specific components:

| Category         | Components                                           |
| ---------------- | ---------------------------------------------------- |
| **Navigation**   | TeamSwitcher, Sidebar, Breadcrumbs                   |
| **Data Display** | StatsCard, ActivityFeed, StatusBadge, InventoryTable |
| **Forms**        | PartForm, OrderForm, InviteForm                      |
| **Feedback**     | AlertBanner, EmptyState, LoadingState                |
| **Layout**       | DashboardLayout, PublicLayout, ParentLayout          |

### 6.2 BuildSeason-Specific Components

#### TeamSwitcher

```typescript
interface TeamSwitcherProps {
  currentTeam: Team;
  teams: Team[];
  onTeamChange: (team: Team) => void;
}

// Usage
<TeamSwitcher
  currentTeam={currentTeam}
  teams={userTeams}
  onTeamChange={handleTeamSwitch}
/>
```

**Behavior:**

- Dropdown showing all user's teams
- Shows team number + name
- Indicates current selection with checkmark
- "Join another team" option at bottom
- Persists selection in localStorage

#### StatsCard

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  status?: 'ok' | 'warning' | 'error';
  trend?: { direction: 'up' | 'down'; value: string };
  onClick?: () => void;
}

// Usage
<StatsCard
  title="Orders Pending"
  value={3}
  status="warning"
  onClick={() => navigate('/orders?status=pending')}
/>
```

#### StatusBadge

```typescript
type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "ordered"
  | "received";
type StockStatus = "ok" | "low" | "out";

interface StatusBadgeProps {
  status: OrderStatus | StockStatus;
  size?: "sm" | "md";
}
```

**Visual Treatment:**
| Status | Background | Text | Icon |
|--------|------------|------|------|
| ok / approved / received | green-100 | green-800 | ✓ |
| pending | yellow-100 | yellow-800 | ⏳ |
| low | yellow-100 | yellow-800 | ⚠️ |
| rejected / out | red-100 | red-800 | ✗ / 🔴 |
| draft | gray-100 | gray-800 | 📝 |
| ordered | blue-100 | blue-800 | 📦 |

#### EmptyState

```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
<EmptyState
  icon={<PackageIcon />}
  title="No parts yet"
  description="Add your first part to start tracking inventory."
  action={{
    label: "Add Part",
    onClick: () => setShowAddPartDialog(true)
  }}
/>
```

---

## 7. Design System

### 7.1 Color Palette

**Brand Colors:**

```css
--primary: 220 70% 50%; /* Blue - actions, links */
--primary-foreground: 0 0% 100%;

--secondary: 220 14% 96%; /* Light gray - backgrounds */
--secondary-foreground: 220 9% 46%;
```

**Status Colors:**

```css
--success: 142 76% 36%; /* Green - ok, approved, complete */
--warning: 38 92% 50%; /* Yellow/amber - low stock, pending */
--error: 0 84% 60%; /* Red - out of stock, rejected */
--info: 199 89% 48%; /* Blue - ordered, in progress */
```

**Subsystem Colors (for BOM):**

```css
--drivetrain: 280 65% 60%; /* Purple */
--intake: 150 60% 45%; /* Teal */
--lift: 35 100% 50%; /* Orange */
--scoring: 340 82% 52%; /* Pink */
--electronics: 200 80% 50%; /* Light blue */
--hardware: 45 30% 50%; /* Brown/tan */
```

### 7.2 Typography

**Font Stack:**

```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

**Type Scale:**
| Name | Size | Weight | Use |
|------|------|--------|-----|
| display | 36px | 700 | Marketing headlines |
| h1 | 30px | 600 | Page titles |
| h2 | 24px | 600 | Section headers |
| h3 | 20px | 600 | Card titles |
| h4 | 16px | 600 | Subsection headers |
| body | 16px | 400 | Default text |
| small | 14px | 400 | Labels, metadata |
| xs | 12px | 400 | Badges, timestamps |

### 7.3 Spacing System

Based on 4px grid:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 7.4 Component Sizing

| Component   | Height | Padding   |
| ----------- | ------ | --------- |
| Button (sm) | 32px   | 12px 16px |
| Button (md) | 40px   | 16px 20px |
| Button (lg) | 48px   | 20px 24px |
| Input       | 40px   | 12px 16px |
| Table row   | 48px   | 16px      |
| Card        | auto   | 24px      |

### 7.5 Elevation/Shadow

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

---

## 8. Interaction Patterns

### 8.1 Navigation Patterns

**Primary Navigation (Sidebar)**

- Always visible on desktop (collapsible)
- Hidden on mobile, accessible via hamburger
- Active state clearly indicated
- Team context persists across navigation

**Secondary Navigation (Tabs)**

- Used for sub-pages within a section
- Example: Parts page with tabs for "All Parts", "Low Stock", "Recent"

**Breadcrumbs**

- Show for nested pages (e.g., `/team/ftc/5064/parts/abc123`)
- Format: `Team > Parts > HD Hex Motor`

### 8.2 Data Loading States

**Skeleton Loading:**

- Show skeleton placeholders matching content shape
- Animate with subtle pulse
- Avoid layout shift when content loads

**Empty States:**

- Illustrated empty state for first-time users
- Clear call-to-action
- Helpful message explaining what goes here

**Error States:**

- Inline error messages for form validation
- Toast notifications for transient errors
- Full-page error for critical failures (with retry)

### 8.3 Form Patterns

**Progressive Disclosure:**

- Show essential fields first
- "Advanced options" or "More details" expandable
- Don't overwhelm with fields

**Inline Editing:**

- For quick updates (quantity, location)
- Click to edit, blur or Enter to save
- Clear visual indicator of editable fields

**Multi-Step Forms:**

- For complex workflows (create order with multiple items)
- Progress indicator
- Save draft capability

### 8.4 Confirmation Patterns

**Destructive Actions:**

- Red button for delete/reject
- Confirmation dialog with explanation
- Require typing confirmation for critical deletes

**Approvals:**

- Green for approve, red for reject
- Inline for quick actions in lists
- Modal for actions requiring notes

### 8.5 Notification Patterns

**Toast Notifications:**

- Success (green): "Order approved"
- Error (red): "Failed to save. Try again."
- Info (blue): "Order shipped - tracking available"
- Auto-dismiss after 5 seconds (except errors)

**Persistent Alerts:**

- Banner at top of page for important notices
- Example: "3 orders need your approval"
- Dismissible but can reappear

**In-context Alerts:**

- Inline with content they reference
- Example: Stock warning on part card

---

## 9. Accessibility Requirements

### 9.1 WCAG 2.1 AA Compliance

**Color Contrast:**

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text and UI components
- Don't rely on color alone to convey meaning

**Keyboard Navigation:**

- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip navigation link

**Screen Readers:**

- Semantic HTML structure
- ARIA labels for icons and non-text elements
- Announce dynamic content changes
- Form labels properly associated

### 9.2 Specific Requirements

| Component     | Requirement                               |
| ------------- | ----------------------------------------- |
| Status badges | Include text, not just color              |
| Icons         | Include `aria-label` or accompanying text |
| Tables        | Proper `<th>` headers with scope          |
| Modals        | Focus trap, escape to close               |
| Forms         | Error messages linked to fields           |
| Images        | Alt text (or decorative `alt=""`)         |

### 9.3 Motion

- Respect `prefers-reduced-motion`
- No autoplay for animations
- Provide pause controls for moving content

---

## 10. Mobile & Responsive Strategy

### 10.1 Breakpoints

```css
--mobile: 320px; /* Minimum supported */
--mobile-lg: 425px; /* Larger phones */
--tablet: 768px; /* Tablets, small laptops */
--desktop: 1024px; /* Standard desktop */
--desktop-lg: 1440px; /* Large monitors */
```

### 10.2 Mobile-First Priorities

**Critical Mobile Features (Competition Day):**

1. Inventory search (find parts quickly)
2. Order status check
3. Team contact info
4. Emergency contacts

**Desktop-Preferred Features:**

- Bulk inventory updates
- Report generation
- Complex filtering
- Settings management

### 10.3 Responsive Behavior

| Component     | Mobile              | Tablet            | Desktop          |
| ------------- | ------------------- | ----------------- | ---------------- |
| Sidebar       | Hidden (hamburger)  | Collapsed         | Expanded         |
| Tables        | Card layout         | Horizontal scroll | Full table       |
| Stats cards   | 2-column stack      | 4-column          | 4-column         |
| Team switcher | Full-width dropdown | Compact dropdown  | Compact dropdown |
| Forms         | Single column       | Two column        | Two column       |

### 10.4 Touch Considerations

- Minimum touch target: 44x44px
- Adequate spacing between touch targets
- Swipe gestures for common actions (where appropriate)
- No hover-dependent functionality

### 10.5 Offline Support (Phase 2)

**Cache Strategy:**

- Cache recent inventory data
- Cache team contact information
- Queue form submissions when offline
- Sync when connectivity returns

**Offline Indicators:**

- Clear visual indication of offline state
- Show cached data with "last updated" timestamp
- Queue actions with "will sync when online" message

---

## Appendix A: Wireframe Reference

Low-fidelity wireframes for key screens are available in:
`/docs/wireframes/` (to be created during implementation)

## Appendix B: Prototype Links

Interactive prototypes will be created for:

- [ ] Onboarding flow
- [ ] Order approval flow (Discord + Web)
- [ ] Parent permission signing
- [ ] Inventory management

## Appendix C: Competitor Analysis

Reference implementations to study:

- **GitHub.com** — Org/repo model, public/private pages
- **Linear** — Clean dashboard, keyboard navigation
- **Notion** — Team switching, sidebar navigation
- **Slack** — Notification patterns, multi-workspace

---

## Document History

| Version | Date       | Author | Changes       |
| ------- | ---------- | ------ | ------------- |
| 1.0     | 2025-12-29 | Claude | Initial draft |
