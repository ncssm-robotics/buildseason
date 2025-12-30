# BuildSeason
## Technical Specification

**Version:** 1.0
**Date:** December 29, 2025
**Status:** Draft
**Companion Document:** [requirements.md](./requirements.md)

---

## Executive Summary

This document specifies HOW BuildSeason will be built, complementing the requirements document which defines WHAT we're building. The architecture prioritizes:

1. **Agent-First Design** — The Discord agent is the primary interface; the web app is the "back office"
2. **Durable Workflows** — Long-running processes (order approval, permission escalation) survive restarts
3. **Progressive Scaling** — Start simple, add complexity only when needed
4. **No Lock-in** — Current implementation choices don't constrain future architecture

**Key Technology Decisions:**
- **Temporal.io** for workflow orchestration (sagas, escalation, monitoring)
- **Claude Agent SDK** for intelligent Discord interactions (personality, NLU, context)
- **Turso** for database with path to multi-region
- **Hono + React** for API and web interface

**Multi-Team from Day One:**
BuildSeason supports multiple teams in a single deployment from Phase 1. Initial deployment targets NCSSM robotics programs:
- **FTC Teams:** Aperture Science (5064), Sigmacorns (20377), RoboKnights (8569)
- **FRC Team:** Zebracorns (900) — to be added after FTC validation
- **Future Programs:** MATE underwater, VEX, Rocketry

The architecture follows a GitHub-style org/team model:
- **Organizations** group multiple teams (like GitHub orgs)
- **Teams** can exist standalone or within an organization (like GitHub repos)
- **Users** can belong to multiple organizations and teams
- Shared resources (vendors, mentors) can be scoped to org or team level

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Architecture Vision](#2-architecture-vision)
3. [Implementation Phases](#3-implementation-phases)
4. [Technology Decisions](#4-technology-decisions)
5. [Data Model Evolution](#5-data-model-evolution)
6. [Integration Architecture](#6-integration-architecture)
7. [Security & Compliance](#7-security--compliance)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Migration Paths](#9-migration-paths)

---

## 1. Current State

### 1.1 Repository Structure

```
buildseason/
├── apps/
│   ├── api/           # Hono backend API
│   │   ├── src/
│   │   │   ├── db/           # Drizzle schema and database
│   │   │   ├── lib/          # Auth, utilities
│   │   │   ├── middleware/   # Auth middleware
│   │   │   └── routes/       # API route handlers
│   │   └── package.json
│   └── web/           # React frontend
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── routes/       # TanStack Router pages
│       │   └── lib/          # API client, auth, utils
│       └── package.json
├── drizzle/           # Database migrations
├── docs/              # Documentation
└── package.json       # Workspace root
```

### 1.2 Current Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun | Fast JavaScript runtime with workspaces |
| API Framework | Hono | Lightweight, fast HTTP framework with RPC |
| Frontend | React + TanStack Router/Query | Type-safe routing and data fetching |
| UI Components | shadcn/ui + Tailwind CSS | Component library and styling |
| Database | Turso (libSQL) | SQLite-compatible distributed database |
| ORM | Drizzle | Type-safe SQL with migrations |
| Authentication | Better-Auth | Session-based auth with OAuth support |

### 1.3 Current Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication                           │
│  users ─── sessions ─── accounts ─── verifications          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Teams & Seasons                       │
│  teams ─── teamSeasons ─── teamMembers ─── teamInvites      │
│    │            │                                            │
│    │            └── robots ─── bomItems                      │
│    │                  │                                      │
│    ├── vendors (team-specific + global)                     │
│    ├── parts (team inventory, persists across seasons)      │
│    └── orders ─── orderItems                                │
└─────────────────────────────────────────────────────────────┘
```

**Key Entities:**
- **Teams** — FTC/FRC teams (persist across years)
- **Team Seasons** — A team's participation in a specific season (e.g., "2024-2025 Into The Deep")
- **Team Members** — Scoped to a season (handles yearly roster churn)
- **Robots** — Named robots built during a season (e.g., "Cheddar", "Pepperjack", "Parmesan")
- **Parts** — Team inventory items (persist across seasons, not tied to robots)
- **BOM Items** — Parts needed for a specific robot (not team-wide)
- **Orders** — Purchase orders with approval workflow status
- **Vendors** — Global (seeded) and team-specific suppliers

### 1.3.1 Robots and BOM Philosophy

**Core Insight:** Teams build multiple robots per season. Each robot has its own BOM.

**Real-World Example (FTC Team 5064, 2024-2025 "Into The Deep"):**
```
Team 5064 - Aperture Science
└── Season: 2024-2025 "Into The Deep"
    ├── Robot: "Cheddar" (competition robot)
    │   └── BOM: 47 parts, $1,234
    ├── Robot: "Pepperjack" (practice robot)
    │   └── BOM: 42 parts, $987
    └── Robot: "Parmesan" (prototype/backup)
        └── BOM: 23 parts, $456
```

**Robot Lifecycle:**
1. **Created** — Robot is named, BOM starts empty
2. **Active** — Parts allocated from inventory to BOM, being built
3. **Competition Ready** — BOM complete, robot operational
4. **Disassembled** — Parts returned to inventory, robot archived

**Parts Flow:**
```
Team Inventory ──allocate──► Robot BOM (Cheddar)
                                    │
                              disassemble
                                    │
Team Inventory ◄──return────────────┘
```

**Why This Matters:**
- A team's parts inventory persists across seasons and robots
- When a robot is disassembled, parts go back to inventory
- BOM shows what a specific robot needs, not what the team needs overall
- Multiple robots can share parts (one in inventory, allocated to robot that needs it first)

### 1.4 Multi-Organization Architecture (GitHub-Style)

BuildSeason uses a GitHub-inspired organization model where teams can exist standalone or within organizations:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub-Style Hierarchy                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Organization: NCSSM Robotics                              │   │
│  │   ├── Aperture Science (5064) - FTC                      │   │
│  │   ├── Sigmacorns (20377) - FTC                           │   │
│  │   ├── RoboKnights (8569) - FTC                           │   │
│  │   ├── Zebracorns (900) - FRC                             │   │
│  │   └── [Future: MATE, VEX, Rocketry]                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Organization: Durham Academy Robotics                     │   │
│  │   ├── DA Cavaliers (12345) - FTC                         │   │
│  │   └── DA Robotics (6789) - FRC                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Standalone Team (no org)                                  │   │
│  │   └── Garage Robotics (99999) - FTC                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Principles:**
- **Teams can exist without an organization** (like personal GitHub repos)
- **Organizations group related teams** (like GitHub orgs)
- **Users have roles at both levels** (org-level and team-level)
- **Resources can be scoped** to global, org, or team level

**Hierarchy:**
| Level | Examples | Scope |
|-------|----------|-------|
| Global | Seeded vendors (REV, goBILDA), community data | All users |
| Organization | Shared vendors, org mentors, unified budget | All org teams |
| Team | Parts inventory, BOM, orders, team-specific vendors | Team members |

**Organization Benefits (when used):**
- **Shared mentors**: One login, access to all teams you mentor
- **Org-wide dashboard**: See all teams' status at a glance
- **Shared vendors**: Org-level vendor relationships
- **Cross-team visibility**: Mentors see parts across teams
- **Unified budget view**: Organization-level financial tracking
- **Competition type agnostic**: FTC, FRC, MATE, VEX, Rocketry all work the same

**Standalone Team Benefits:**
- **Simple setup**: No org overhead for single-team programs
- **Full autonomy**: Team controls all settings and resources
- **Easy upgrade**: Can join/create an org later without migration

**Competition Types:**

| Type | Competition | Scale | Key Differences |
|------|-------------|-------|-----------------|
| FTC | FIRST Tech Challenge | 15 students | Smaller robots, standard parts |
| FRC | FIRST Robotics Competition | 25+ students | Larger robots, more fabrication |
| MATE | Marine ROV | Varies | Underwater, waterproofing concerns |
| VEX | VEX Robotics | Varies | VEX-specific parts ecosystem |
| Rocketry | Team America Rocketry | Varies | Consumables, safety protocols |

The data model accommodates these differences through:
- `teams.program` field (ftc, frc, mate, vex, tarc, other)
- Competition-type-specific vendor seeds
- Flexible subsystem definitions per team
- Configurable role structures

### 1.5 URL Structure & Team Identity

**Team numbers ARE the identity** — no UUIDs in URIs:

```
buildseason.org/team/ftc/5064           → Aperture Science public page
buildseason.org/team/frc/900            → Zebracorns public page
buildseason.org/team/ftc/5064/parts     → Parts inventory (auth required)
buildseason.org/team/ftc/5064/orders    → Orders (auth required)
```

**Public Team Pages** (like GitHub public repos):
- Visible without authentication
- Shows: name, number, location, sponsors, description, logo
- Links to: team website, GitHub, social media
- Upcoming: outreach events, competitions
- Stats: FTC stats integration (OPR, awards, etc.)
- Contact: how to reach the team (filtered through BuildSeason)

**Authenticated Views** add:
- Parts inventory, BOM, orders
- Budget information
- Member directory with roles
- Internal discussions

### 1.6 Role System

**Team Roles:**

| Role | Description | Capabilities |
|------|-------------|--------------|
| admin | Team leads, head coach | All permissions, manage members, billing |
| mentor | Adult volunteers, coaches | Approve orders, view budget, manage inventory |
| student | Team members | Request orders, update inventory, view BOM |
| parent | Parent/guardian of a student | View their child's activity, sign permission forms, emergency contact |
| alumni | Former team members | Read-only access, can be re-activated |

**Parent Role Details:**
- Linked to specific student(s) via `parentOfMemberId`
- Can view: their child's participation, upcoming events, permission forms needed
- Can action: sign permission slips, update emergency contact info, dietary restrictions
- Cannot view: other students' data, team budget, order details
- Receives: event notifications, permission form requests, emergency alerts

**Permission Slip Flow:**
```
1. Event created requiring permission
2. Agent identifies students needing forms
3. Parents receive notification (Discord DM, email, or both)
4. Parent logs in → sees pending permission forms
5. Parent reviews event details, signs digitally
6. Student's status updates to "cleared"
7. Agent notifies coach when all forms complete (or escalates)
```

### 1.7 Multi-Team Membership

A core design principle: **users can and do belong to multiple teams simultaneously.**

**Real-World Examples:**
- **Mentors** often coach multiple teams (e.g., Marcus mentors both Aperture Science and Sigmacorns)
- **Students** may be members of multiple teams (e.g., Pete was on two FTC teams last year)
- **Parents** may have children on different teams (or the same child on multiple teams)
- **Alumni** may stay connected to their original team while mentoring another

**Architecture Implications:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    User: Marcus Chen                             │
│                                                                  │
│   ┌────────────────────┐   ┌────────────────────┐               │
│   │ Aperture Science   │   │ Sigmacorns         │               │
│   │ FTC 5064           │   │ FTC 20377          │               │
│   │ Role: admin        │   │ Role: mentor       │               │
│   └────────────────────┘   └────────────────────┘               │
│                                                                  │
│   Dashboard shows: Team switcher with both teams                │
│   Discord: Can query either team by context/mention             │
│   Notifications: Aggregated or per-team (user preference)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    User: Pete Denning                            │
│                                                                  │
│   ┌────────────────────┐   ┌────────────────────┐               │
│   │ Aperture Science   │   │ Cosmic Brownies    │               │
│   │ FTC 5064           │   │ FTC 20377          │               │
│   │ Role: student      │   │ Role: student      │               │
│   └────────────────────┘   └────────────────────┘               │
│                                                                  │
│   Activities tracked separately per team                        │
│   BOM contributions scoped to team                              │
│   Orders submitted in team context                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    User: Mrs. Denning (Parent)                   │
│                                                                  │
│   Parent of: Pete Denning                                        │
│                                                                  │
│   Sees permissions for:                                          │
│   • Pete @ Aperture Science (FTC 5064)                          │
│   • Pete @ Cosmic Brownies (FTC 20377)                          │
│                                                                  │
│   Single parent account, linked to child across teams           │
└─────────────────────────────────────────────────────────────────┘
```

**Data Model Support:**
- `teamMembers` table allows multiple rows per user (one per team)
- Each membership has its own role (user can be admin on one team, student on another)
- Parent-student links are per-membership (parent of Pete on Team A, same parent of Pete on Team B)
- User preferences can be global or team-scoped

**UI/UX Patterns:**
- Team switcher in header (always visible)
- "All Teams" dashboard view for users on multiple teams
- Notification preferences per-team or aggregated
- Discord bot uses channel context or explicit team mention

---

## 2. Architecture Vision

### 2.1 Core Principle: Agent-First

From the requirements document:

> "The agent isn't a feature bolted onto a database. The agent IS the experience."

This has profound architectural implications:

1. **Discord is the primary interface** — Most interactions happen in Discord, not the web app
2. **Proactive, not reactive** — The system initiates conversations, doesn't just respond
3. **Personality is functional** — GLaDOS quips are the delivery mechanism for operational data
4. **Escalation over nagging** — The agent handles reminders; humans get involved only when needed

### 2.2 System Architecture (Target State)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Clients                                    │
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │ Discord Bot  │   │   Web App    │   │  Mobile PWA  │            │
│  │   (Primary)  │   │ (Back Office)│   │   (Future)   │            │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway                                   │
│                     (Hono on Fly.io)                                 │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  REST API   │  │  Hono RPC   │  │  Webhooks   │                 │
│  │  (Public)   │  │  (Frontend) │  │  (OnShape)  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Temporal     │ │  Claude Agent   │ │   Background    │
│   Workflows     │ │      SDK        │ │    Workers      │
│                 │ │                 │ │                 │
│ • Order Sagas   │ │ • NL Parsing    │ │ • Monitoring    │
│ • Escalation    │ │ • Personality   │ │ • Notifications │
│ • Travel Coord  │ │ • Context Mgmt  │ │ • Vendor Checks │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Turso Primary  │  │    Embedded     │  │  Redis/Valkey   │     │
│  │   (Writes)      │  │    Replicas     │  │  (Real-time)    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Key Architectural Principles

**1. Separation of Concerns**
- API handles CRUD and business logic
- Temporal handles durable workflows
- Claude Agent SDK handles natural language
- Workers handle background monitoring

**2. Event-Driven Where It Matters**
- OnShape webhooks → BOM sync
- Order status changes → Notifications
- Time-based triggers → Temporal schedules

**3. Graceful Degradation**
- If Temporal is down, API still works (no new workflows)
- If Discord is down, web interface still works
- Offline-capable PWA for competition venues

---

## 3. Implementation Phases

### 3.1 Phase 1: Foundation (Current → MVP)

**Goal:** Working core product for a single team to use end-to-end.

**Timeline Scope:** First functional deployment

**Stack:**
| Component | Technology | Notes |
|-----------|------------|-------|
| Hosting | Fly.io (single region, US) | Simple, fast deploys |
| Database | Turso (single instance) | Managed SQLite |
| API | Hono | Current implementation |
| Frontend | React + TanStack | Current implementation |
| Auth | Better-Auth | Current implementation |
| Discord | Discord.js | Basic slash commands only |

**Features:**
- [ ] Team creation and member management with roles
- [ ] Parts inventory CRUD with search
- [ ] BOM management tied to parts and subsystems
- [ ] Order tracking with manual status updates
- [ ] Vendor directory (seeded + team-specific)
- [ ] Basic Discord bot with slash commands
- [ ] Webhook notifications to Discord channels

**Architecture Notes:**
- Monolithic API (no microservices)
- No Temporal yet (simple cron jobs if needed)
- Focus on data model correctness
- Basic permission checks in middleware

**Discord Commands (Phase 1):**
```
/inventory search <query>     - Find parts
/inventory check <sku>        - Check stock level
/order status <order-id>      - Get order status
/budget remaining             - Check remaining budget
/parts low-stock              - List parts below reorder point
```

---

### 3.2 Phase 2: Agent Intelligence

**Goal:** GLaDOS personality, natural language, proactive intelligence.

**Timeline Scope:** After Phase 1 is stable and teams are using it

**New Stack Components:**
| Component | Technology | Notes |
|-----------|------------|-------|
| Workflows | Temporal.io | Temporal Cloud or self-hosted |
| Agent Intelligence | Claude Agent SDK | NLU + personality + tools |
| Workers | Bun workers | Background monitoring |

**Features:**
- [ ] Natural language Discord interactions
- [ ] Personality system (GLaDOS, Wheatley, neutral, etc.)
- [ ] Graduated escalation workflows
- [ ] OnShape webhook integration (real-time BOM sync)
- [ ] Proactive notifications (lead time alerts, pattern detection)
- [ ] Meal coordination workflow (MakerFaire scenario from requirements)
- [ ] Sponsor moment detection

**Temporal Workflows:**

```
OrderApprovalWorkflow
├─ createOrder()
├─ notifyApprovers()
├─ waitForApproval(timeout: 72h)
│   ├─ [24h] sendReminder()
│   └─ [48h] escalateToMentor()
├─ onApproved() → notifyRequester(), updateInventoryCommitment()
├─ onRejected() → notifyRequester(reason)
└─ onTimeout() → escalateToCoach(), createIncident()

PermissionFormWorkflow
├─ sendInitialRequest(student, event)
├─ scheduleReminders(every: 48h, max: 3)
│   ├─ [Reminder 1] gentleNudge()
│   ├─ [Reminder 2] urgentReminder()
│   └─ [Reminder 3] finalWarning()
├─ escalateToParent() if no response
├─ escalateToCoach() if parent unresponsive
└─ complete() or markExpired()

MealCoordinationWorkflow (from requirements)
├─ gatherDietaryRestrictions(attendees)
├─ searchRestaurants(venue, budget, restrictions)
├─ presentOptions(to: chaperone)
├─ runStudentPoll(in: discord_channel)
├─ compileResults()
├─ prepareOrderDetails()
├─ sendDayOfReminders()
├─ trackDelivery()
└─ collectFeedback()

OnShapeSyncWorkflow
├─ receiveWebhook(assembly_updated)
├─ fetchBOMDiff(assembly_id)
├─ crossReferenceInventory(parts)
├─ calculateLeadTimes(missing_parts)
├─ notifyDesigner(discord_dm)
└─ offerQuickActions(add_to_order, find_alternative)
```

**Claude Agent SDK Integration:**

```typescript
// Personality definitions
const personalities = {
  glados: {
    systemPrompt: `You are GLaDOS from Portal, now managing a robotics team.
      You're helpful but passive-aggressive. You make dry observations about
      humans' tendency to forget things. You never directly insult, but your
      compliments have an edge. Example: "Congratulations on remembering to
      order parts this time. The robot is almost impressed."`,
    temperature: 0.7,
  },
  wheatley: {
    systemPrompt: `You are Wheatley, enthusiastic but chaotic. You try your
      best and get genuinely excited about robotics. You sometimes go on
      tangents but always come back to being helpful.`,
    temperature: 0.9,
  },
  neutral: {
    systemPrompt: `You are a professional team management assistant.
      Be concise, helpful, and direct.`,
    temperature: 0.3,
  },
};

// Discord handler with Claude Agent SDK
async function handleMessage(message: Message) {
  const team = await getTeamFromGuild(message.guild.id);
  const personality = personalities[team.agentPersonality || 'glados'];

  const agent = new ClaudeAgent({
    ...personality,
    tools: [
      inventoryQueryTool,
      budgetCheckTool,
      orderStatusTool,
      leadTimeCalculatorTool,
    ],
    context: {
      teamId: team.id,
      userId: message.author.id,
      recentMessages: await getChannelContext(message.channel.id),
    },
  });

  const response = await agent.respond(message.content);

  // Handle tool calls
  for (const toolCall of response.toolCalls) {
    await executeToolAndReply(message, toolCall);
  }

  // Reply with personality
  await message.reply(response.text);
}
```

---

### 3.3 Phase 3: Scale & International

**Goal:** Multi-region deployment, international team support, advanced features.

**Timeline Scope:** After significant adoption and international demand

**Stack Evolution:**
| Component | Technology | Notes |
|-----------|------------|-------|
| Hosting | Fly.io (multi-region) | US, EU, APAC |
| Database | Turso (multi-region) | Regional primaries + global replica |
| Cache | Redis/Valkey | Real-time state, rate limiting |
| CDN | Fly CDN or Cloudflare | Static assets, edge caching |

**Features:**
- [ ] Travel & logistics management (Worlds scenario from requirements)
- [ ] Multi-currency budget tracking with exchange rates
- [ ] Customs documentation generation
- [ ] Flight monitoring integrations
- [ ] Sponsor relationship nurturing with moment detection
- [ ] Community intelligence (aggregated lead times, vendor scores)
- [ ] Outreach hour tracking for grants
- [ ] Parent visibility portal

**Database Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Write Path                                    │
│                                                                      │
│  Team in US ──────► US Primary ──────► Global Sync                  │
│  Team in EU ──────► EU Primary ──────► Global Sync                  │
│  Team in APAC ────► APAC Primary ────► Global Sync                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Read Path                                     │
│                                                                      │
│  Team Data ───────► Regional Primary (low latency)                  │
│  Vendor Catalog ──► Global Read Replica (any region)                │
│  Parts Library ───► Global Read Replica (any region)                │
│  Community Data ──► Global Read Replica (any region)                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Data Locality:
┌─────────────┬─────────────────────────────────────────────────────┐
│ Data Type   │ Storage Strategy                                    │
├─────────────┼─────────────────────────────────────────────────────┤
│ Team data   │ Regional primary where team is based               │
│ User data   │ Same region as their primary team                   │
│ Orders      │ Same region as team                                 │
│ Vendors     │ Global (seeded), Regional (team-specific)          │
│ Parts cat.  │ Global read replica, local for team inventory      │
│ Travelers   │ Same region as team (sensitive data)               │
│ Community   │ Global read replica (aggregated, anonymized)       │
└─────────────┴─────────────────────────────────────────────────────┘
```

**New Entities for Phase 3:**

```typescript
// Travelers (for Worlds travel scenario)
travelers: {
  id, tripId, userId,
  passportNumber, passportExpiry, passportCountry,
  visaStatus, visaType, visaExpiry,
  dietaryRestrictions: ['vegetarian', 'nut-allergy', 'halal'],
  medicalNotes, emergencyContact, emergencyPhone,
  roomingAssignment, seatPreference,
}

// Trips
trips: {
  id, teamId, name, // "Worlds 2025"
  startDate, endDate,
  legs: [{ type: 'flight' | 'hotel' | 'ground', details }],
  contingencyPlans,
  customsDeclarations,
}

// Sponsors
sponsors: {
  id, teamId, name, type: 'corporate' | 'individual' | 'grant',
  amount, currency, restrictions,
  contacts: [{ name, email, role }],
  deliverables: [{ type, dueDate, status }],
  interests: ['stem-careers', 'outreach', 'competition'],
  lastContactDate, renewalDate,
}

// Events (Outreach, Competitions)
events: {
  id, teamId, type: 'outreach' | 'competition' | 'build-session',
  name, date, location,
  attendees: [{ userId, status, permissionFormStatus }],
  equipment: [{ partId, assignedTo }],
  meals: [{ type, vendorId, status }],
  outreachHours, // For grant tracking
}

// Community Metrics (Aggregated)
communityMetrics: {
  vendorId, destinationRegion,
  avgLeadTimeDays, leadTimeStdDev,
  reliabilityScore, // 0-100
  sampleSize, lastUpdated,
}
```

---

## 4. Technology Decisions

### 4.1 Temporal.io for Workflow Orchestration

**The Problem:**
Many BuildSeason operations are inherently long-running and multi-step:
- Order approval (wait hours/days for human input)
- Permission form collection (escalating reminders over days)
- Travel coordination (monitor flights for weeks)
- Sponsor nurturing (detect moments, suggest outreach)

Traditional approaches fail:
- Cron jobs: Stateless, hard to debug, lose context on restart
- Simple queues: No built-in timeout, retry, or saga support
- In-memory state: Lost on deployment, single-machine limit

**Why Temporal:**
- **Durable execution**: Workflows survive restarts, deployments, crashes
- **Built-in primitives**: Timers, retries, sagas, signals, queries
- **Visibility**: See all running workflows, their state, history
- **Language-native**: Write workflows in TypeScript, not YAML

**Example: Order Approval Saga**

```typescript
// workflows/orderApproval.ts
import { proxyActivities, sleep, condition } from '@temporalio/workflow';
import type * as activities from '../activities/order';

const {
  notifyApprovers,
  sendReminder,
  escalateToMentor,
  markApproved,
  markRejected,
  notifyRequester,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function orderApprovalWorkflow(orderId: string): Promise<void> {
  let approved = false;
  let rejected = false;
  let rejectionReason: string | null = null;

  // Notify approvers
  await notifyApprovers(orderId);

  // Wait up to 72 hours with escalating reminders
  const deadlineHours = 72;
  const reminderHours = 24;
  const escalationHours = 48;

  // Set up reminder timer
  const reminderPromise = (async () => {
    await sleep(`${reminderHours} hours`);
    if (!approved && !rejected) {
      await sendReminder(orderId);
    }
  })();

  // Set up escalation timer
  const escalationPromise = (async () => {
    await sleep(`${escalationHours} hours`);
    if (!approved && !rejected) {
      await escalateToMentor(orderId);
    }
  })();

  // Wait for approval signal or timeout
  const approvedInTime = await condition(
    () => approved || rejected,
    `${deadlineHours} hours`
  );

  if (approved) {
    await markApproved(orderId);
    await notifyRequester(orderId, 'approved');
  } else if (rejected) {
    await markRejected(orderId, rejectionReason);
    await notifyRequester(orderId, 'rejected', rejectionReason);
  } else {
    // Timed out
    await escalateToMentor(orderId);
    await notifyRequester(orderId, 'expired');
  }
}

// Signal handlers
export const approveSignal = defineSignal('approve');
export const rejectSignal = defineSignal<[string]>('reject');
```

**Alternatives Considered:**

| Option | Pros | Cons |
|--------|------|------|
| Bull/BullMQ | Simple, Redis-based | No durable workflows, no sagas |
| Inngest | Good DX, serverless | Less mature, fewer primitives |
| Trigger.dev | Modern, easy setup | Less battle-tested |
| Custom solution | Full control | Enormous effort, bugs |

**Decision:** Temporal.io (Temporal Cloud for simplicity, or self-hosted on Fly for cost)

---

### 4.2 Claude Agent SDK for Intelligent Interactions

**The Problem:**
The requirements demand a conversational agent that:
- Understands natural language queries ("can we afford 4 servos?")
- Maintains personality (GLaDOS, Wheatley, etc.)
- Has context about the team, inventory, budget
- Can take actions (add to order queue, check status)
- Feels like a team member, not a chatbot

**Why Claude Agent SDK:**
- **Native tool use**: Define tools, Claude calls them appropriately
- **Personality control**: System prompts + temperature tuning
- **Context management**: Conversation history, team context
- **Reasoning**: Can analyze data, make recommendations
- **Streaming**: Real-time responses for Discord

**Tool Definitions:**

```typescript
// tools/inventory.ts
export const inventoryQueryTool = {
  name: 'query_inventory',
  description: 'Search for parts in team inventory by name, SKU, or description',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      teamId: { type: 'string', description: 'Team ID' },
    },
    required: ['query', 'teamId'],
  },
  execute: async ({ query, teamId }) => {
    const parts = await db.query.parts.findMany({
      where: and(
        eq(parts.teamId, teamId),
        or(
          like(parts.name, `%${query}%`),
          like(parts.sku, `%${query}%`),
        )
      ),
      with: { vendor: true },
    });
    return parts;
  },
};

export const budgetCheckTool = {
  name: 'check_budget',
  description: 'Check remaining budget for a team, optionally for a specific category',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: 'string' },
      category: { type: 'string', description: 'Optional: parts, travel, registration' },
    },
    required: ['teamId'],
  },
  execute: async ({ teamId, category }) => {
    // Calculate committed + spent vs allocated
    const budget = await calculateBudget(teamId, category);
    return budget;
  },
};

export const addToOrderQueueTool = {
  name: 'add_to_order_queue',
  description: 'Add a part to the order queue for the team',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: 'string' },
      partId: { type: 'string' },
      quantity: { type: 'number' },
      requestedBy: { type: 'string', description: 'User ID requesting' },
    },
    required: ['teamId', 'partId', 'quantity', 'requestedBy'],
  },
  execute: async ({ teamId, partId, quantity, requestedBy }) => {
    // Add to pending order or create new draft
    const result = await addToOrderQueue(teamId, partId, quantity, requestedBy);
    return result;
  },
};
```

**Personality Examples (from requirements):**

```typescript
// GLaDOS response to "can we afford 4 servos?"
`The REV Smart Servo is $24.99 each, so 4 would be $99.96.
You have $212 remaining in parts budget. Yes, you can afford them.

However: Your current BOM shows 2 servos in the intake design.
Are you adding 4 to that (total 6) or replacing them? If adding,
I'd note that 6 servos will draw more current than your current
PDP configuration supports—you'd need to rebalance breakers.

Also, goBILDA has a comparable servo for $19.99 that several
teams have used successfully. Want me to pull up the comparison?`

// Wheatley response to same question
`OH! Servos! I LOVE servos! Let me check...
*rummages through the budget spreadsheet*

Right! Four servos at $24.99 each... that's...
*counts on virtual fingers*... about a hundred dollars!

And you've got $212 left! So YES! Absolutely!
You can totally afford them! This is BRILLIANT!

Wait, wait—should I add them to the order? I can do that!
I'm very helpful! 🎉`
```

---

### 4.3 OnShape Integration

**The Problem:**
The "magic" moment from requirements:
> Student updates OnShape assembly at 10pm. By 10:02pm, in #design:
> "I see you've added REV-41-1877 to the arm assembly. Checking...
> We have 0 in stock. REV has them, 5-day lead time, $51.96 for 4..."

This requires real-time awareness of CAD changes.

**Architecture:**

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│   OnShape   │        │ BuildSeason │        │   Discord   │
│    Cloud    │        │     API     │        │   Channel   │
└──────┬──────┘        └──────┬──────┘        └──────┬──────┘
       │                      │                      │
       │ 1. Assembly updated  │                      │
       ├─────────────────────►│                      │
       │    (Webhook POST)    │                      │
       │                      │                      │
       │                      │ 2. Fetch BOM diff    │
       │                      │    via OnShape API   │
       │◄─────────────────────┤                      │
       │                      │                      │
       │                      │ 3. Cross-reference   │
       │                      │    with inventory    │
       │                      │                      │
       │                      │ 4. Start workflow    │
       │                      ├─────────────────────►│
       │                      │    (Temporal)        │
       │                      │                      │
       │                      │ 5. Notify designer   │
       │                      ├─────────────────────►│
       │                      │    in Discord        │
       │                      │                      │
```

**Webhook Handler:**

```typescript
// routes/webhooks/onshape.ts
app.post('/webhooks/onshape', async (c) => {
  const signature = c.req.header('x-onshape-signature');
  if (!verifyOnShapeSignature(signature, await c.req.raw.text())) {
    return c.text('Invalid signature', 401);
  }

  const payload = await c.req.json();

  if (payload.event === 'onshape.model.translation.complete' ||
      payload.event === 'onshape.revision.created') {
    // Trigger BOM sync workflow
    await temporal.workflow.start(onShapeSyncWorkflow, {
      args: [payload.documentId, payload.elementId],
      taskQueue: 'onshape-sync',
      workflowId: `onshape-sync-${payload.documentId}-${Date.now()}`,
    });
  }

  return c.text('OK');
});
```

**BOM Diff Logic:**

```typescript
// activities/onshape.ts
export async function fetchBOMDiff(
  documentId: string,
  elementId: string,
  teamId: string
): Promise<BOMDiff> {
  // Fetch current BOM from OnShape
  const currentBOM = await onshape.getBillOfMaterials(documentId, elementId);

  // Fetch previous BOM from our database
  const previousBOM = await db.query.bomSnapshots.findFirst({
    where: eq(bomSnapshots.documentId, documentId),
    orderBy: desc(bomSnapshots.createdAt),
  });

  // Calculate diff
  const added = currentBOM.items.filter(
    item => !previousBOM?.items.find(p => p.partNumber === item.partNumber)
  );
  const removed = previousBOM?.items.filter(
    item => !currentBOM.items.find(c => c.partNumber === item.partNumber)
  ) || [];
  const quantityChanged = currentBOM.items.filter(item => {
    const prev = previousBOM?.items.find(p => p.partNumber === item.partNumber);
    return prev && prev.quantity !== item.quantity;
  });

  // Cross-reference with inventory
  for (const item of [...added, ...quantityChanged]) {
    const inventoryPart = await matchPartToInventory(item, teamId);
    item.inventoryStatus = inventoryPart ? {
      inStock: inventoryPart.quantity,
      onOrder: await getOnOrderQuantity(inventoryPart.id),
      reorderPoint: inventoryPart.reorderPoint,
    } : null;
  }

  return { added, removed, quantityChanged };
}
```

---

### 4.4 GitHub Integration

**The Problem:**
Software teams need the same operational support as mechanical teams:
- Track progress on robot code across PRs
- Get AI-assisted code reviews
- Surface blockers and stalled work
- Connect commits to robot functionality

**Architecture:**

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│   GitHub    │        │ BuildSeason │        │   Discord   │
│    Org      │        │     API     │        │   Channel   │
└──────┬──────┘        └──────┬──────┘        └──────┬──────┘
       │                      │                      │
       │ 1. PR opened/updated │                      │
       ├─────────────────────►│                      │
       │    (Webhook)         │                      │
       │                      │                      │
       │                      │ 2. Analyze PR        │
       │                      │    (Claude Agent)    │
       │                      │                      │
       │ 3. Post review       │                      │
       │◄─────────────────────┤                      │
       │    (GitHub API)      │                      │
       │                      │                      │
       │                      │ 4. Notify team       │
       │                      ├─────────────────────►│
       │                      │    in Discord        │
       │                      │                      │
```

**Webhook Events:**
| Event | Action |
|-------|--------|
| `pull_request.opened` | Analyze PR, suggest reviewers, post initial review |
| `pull_request.synchronize` | Re-analyze on new commits |
| `pull_request.review_requested` | Notify reviewer in Discord |
| `push` to main | Update software progress dashboard |
| `issues.opened` | Track software tasks alongside parts/orders |
| `workflow_run.completed` | Report CI/CD status, flag failures |

**Agent Capabilities:**
- **Code Review**: Claude analyzes PR diffs, suggests improvements, catches bugs
- **Progress Tracking**: "Robot code is 73% complete based on open issues"
- **Blocker Detection**: "PR #42 has been waiting for review for 5 days"
- **Integration Awareness**: "This PR changes autonomous mode—make sure to test on the practice field"

**Example Discord Notification:**

```
🔀 New PR: "Add vision-based alignment for scoring"
├─ Author: @marcus
├─ Files: 4 changed, +127 -23
├─ Tests: ✅ Passing
├─ Review: Claude suggests checking null handling in VisionProcessor.java:47
└─ Action: React 👀 to claim review
```

**Example AI Review Comment:**

```markdown
## BuildSeason Code Review

### Summary
This PR adds vision-based alignment for the scoring mechanism.
The approach looks solid, but I have a few suggestions.

### Suggestions
1. **Line 47**: `getTarget()` can return null if no AprilTag is visible.
   Consider adding a null check before accessing `.getX()`.

2. **Line 82**: The PID constants are hardcoded. These might need
   tuning per-robot. Consider moving to Constants.java.

3. **General**: Good use of the Command pattern! The structure
   will make testing easier.

---
🤖 *Review by BuildSeason Agent (GLaDOS mode)*
*"The code is acceptable. For now."*
```

**Skills for Software Teams:**
- `github-pr-review` — AI-powered code review with team context
- `github-progress` — Track issues/PRs against milestones
- `github-notify` — Smart notifications (don't spam, escalate when needed)
- `github-ci-monitor` — Watch for failed builds, suggest fixes

---

### 4.5 Discord Architecture

**Bot Structure:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Discord Bot                                    │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Slash     │  │   Natural   │  │  Reaction   │                 │
│  │  Commands   │  │  Language   │  │  Handlers   │                 │
│  │             │  │  (Claude)   │  │             │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Message Router                              │ │
│  │                                                                │ │
│  │  • Slash command? → Command handler                           │ │
│  │  • Mentions bot? → Claude Agent SDK                           │ │
│  │  • Reaction on bot message? → Action handler                  │ │
│  │  • DM? → Claude Agent SDK (private context)                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Outbound Messages                           │ │
│  │                                                                │ │
│  │  • Channel-aware (post to #parts, #orders, #travel)           │ │
│  │  • Thread management (long conversations)                     │ │
│  │  • DM support (private notifications)                         │ │
│  │  • Reaction prompts (✅ to approve, 📦 to mark received)      │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Channel Strategy:**

| Channel | Purpose | Bot Behavior |
|---------|---------|--------------|
| #general | Team chat | Responds to mentions only |
| #parts | Parts/inventory | Proactive low-stock alerts |
| #orders | Order tracking | Order status updates, approvals needed |
| #design | CAD/OnShape | BOM change notifications |
| #travel | Travel logistics | Flight updates, document reminders |
| #budget | Financial | Budget warnings, expense tracking |
| DMs | Private | Personal reminders, escalations |

**Slash Commands (Phase 2):**

```
/inventory
  search <query>           - Find parts by name/SKU
  check <sku>              - Check stock level
  add <sku> <qty>          - Add to inventory (requires role)
  low-stock                - List parts below reorder point

/order
  status [order-id]        - Check order status (default: recent)
  create                   - Start new order
  approve <order-id>       - Approve pending order (requires role)
  track                    - List all pending orders

/budget
  remaining [category]     - Check remaining budget
  committed                - Show committed (not yet spent)
  breakdown                - Category-by-category view

/bom
  sync                     - Force OnShape sync
  diff                     - Show changes since last sync
  gaps                     - Parts in BOM not in inventory

/team
  roster                   - List team members
  roles                    - Show role assignments
  invite <email> <role>    - Send invite (requires admin)
```

---

## 5. Data Model Evolution

### 5.1 Phase 1 Schema (Multi-Team from Day One)

```sql
-- Authentication (Better-Auth)
users (id, email, emailVerified, name, image, createdAt, updatedAt)
sessions (id, userId, expiresAt, token, ipAddress, userAgent, ...)
accounts (id, userId, accountId, providerId, accessToken, ...)
verifications (id, identifier, value, expiresAt, ...)

-- Organizations (NEW: Multi-team support)
organizations (
  id, name, slug,  -- "NCSSM Robotics", "ncssm"
  createdAt, updatedAt
)
organizationMembers (
  id, organizationId, userId,
  role,  -- 'owner', 'admin', 'member'
  createdAt
)

-- Teams (GitHub-style: can be standalone or in an org)
-- PRIMARY KEY is (program, number) - no UUIDs in URIs
-- Example: buildseason.org/team/ftc/5064 → Aperture Science
-- Teams persist across seasons - they are the permanent entity
teams (
  program,  -- 'ftc', 'frc', 'mate', 'vex', 'tarc', 'other'
  number,   -- Team number (e.g., '5064', '900')
  -- PRIMARY KEY (program, number)

  organizationId,  -- NULLABLE: null = standalone, set = org team
  name,            -- "Aperture Science", "Zebracorns"

  -- Public profile (visible without auth, like GitHub public repos)
  isPublic,        -- Whether team has public profile page
  location,        -- "Durham, NC"
  website,         -- Team website URL
  description,     -- Short bio
  logoUrl,

  -- Integrations
  discordGuildId,
  githubOrg,       -- GitHub org/user for software integration
  onshapeTeamId,   -- OnShape team for CAD integration

  createdAt, updatedAt
)

-- Team Seasons - a team's participation in a specific competition season
-- Handles yearly roster churn, multiple robots per season
teamSeasons (
  id,
  program, number,  -- FK to teams

  seasonYear,       -- "2024-2025"
  seasonName,       -- "Into The Deep", "CenterStage", "Decode"

  isActive,         -- Current active season for this team
  startDate,        -- Season start (typically September)
  endDate,          -- Season end (typically April/Worlds)

  createdAt, updatedAt
)

-- Robots - named robots built during a season
-- A team may build multiple robots per season (competition, practice, prototype)
robots (
  id,
  teamSeasonId,     -- FK to teamSeasons

  name,             -- "Cheddar", "Pepperjack", "Parmesan", "v1", "v2"
  description,      -- "Competition robot", "Practice robot"
  status,           -- 'planning', 'building', 'competition_ready', 'disassembled', 'archived'

  -- When disassembled, parts return to inventory
  disassembledAt,   -- NULL if still active
  disassembledNotes,

  createdAt, updatedAt
)

-- Team Members - scoped to a season (handles yearly roster churn)
teamMembers (
  id, visibleId,  -- visibleId for public display (e.g., "marcus")

  teamSeasonId,     -- FK to teamSeasons (membership is per-season)
  userId,           -- FK to users (nullable for invited-but-not-joined)

  role,  -- 'admin', 'mentor', 'student', 'parent', 'alumni'

  -- Parent-specific fields (when role = 'parent')
  parentOfMemberId,  -- Links parent to their student

  -- Public profile fields
  displayName,
  isPublic,  -- Show on public team page

  -- Status within season
  isActive,         -- Can be deactivated mid-season without deletion

  createdAt
)

teamInvites (id, teamSeasonId, token, role, expiresAt, usedAt, createdBy, createdAt)

-- Vendors (support global, org-level, and team-level)
vendors (
  id, name, website, avgLeadTimeDays, notes,
  isGlobal,  -- Seeded vendors (REV, goBILDA, AndyMark, etc.)
  organizationId,  -- Org-level vendors (shared across teams)
  program, number,  -- Team-specific vendors (FK to teams)
  createdAt
)
-- Vendor scoping: isGlobal=true OR organizationId=X OR (program, number)=Y

-- Parts & Inventory (team-level, persists across seasons and robots)
parts (
  id,
  program, number,  -- FK to teams (NOT teamSeasons - parts persist!)
  vendorId, name, sku, description,

  -- Inventory tracking
  quantity,         -- Total in inventory (not allocated to any robot)
  reorderPoint,     -- Alert when below this
  location,         -- "Shelf A-3, Bin 12"

  unitPriceCents, imageUrl,
  createdAt, updatedAt
)

-- Bill of Materials (per-robot, NOT per-team)
-- Each robot has its own BOM
bomItems (
  id,
  robotId,          -- FK to robots (BOM is for a specific robot!)
  partId,           -- FK to parts

  subsystem,        -- 'drivetrain', 'intake', 'lift', 'scoring', 'electronics', 'hardware', 'other'
  quantityNeeded,   -- How many of this part the robot needs
  quantityAllocated,-- How many have been pulled from inventory for this robot

  notes,
  createdAt, updatedAt
)
-- Note: quantityAllocated lets us track parts "in use" vs "in inventory"
-- When robot is disassembled, quantityAllocated moves back to parts.quantity

-- Orders (team-level, can be for any purpose)
orders (
  id,
  program, number,  -- FK to teams
  robotId,          -- NULLABLE: if ordering for a specific robot, link it

  vendorId, status, totalCents, notes, rejectionReason,
  createdById, approvedById,
  createdAt, submittedAt, approvedAt, orderedAt, receivedAt, updatedAt
)
orderItems (id, orderId, partId, quantity, unitPriceCents, createdAt)
```

### 5.2 Phase 2 Additions

```sql
-- Agent & Workflow State
agentConversations (
  id, program, number, channelId, userId,  -- FK to teams
  messages JSONB,  -- Conversation history for context
  createdAt, updatedAt
)

-- Permission Forms (parent workflow)
permissionForms (
  id,
  program, number,  -- FK to teams
  eventId,          -- FK to events
  studentMemberId,  -- FK to teamMembers (the student)
  parentMemberId,   -- FK to teamMembers (the parent)
  status,           -- 'pending', 'sent', 'signed', 'expired'
  formType,         -- 'standard', 'medical', 'travel', 'media'
  signedAt,
  signatureData JSONB,  -- Digital signature details
  createdAt, updatedAt
)

-- Emergency Contacts (managed by parents)
emergencyContacts (
  id,
  studentMemberId,  -- FK to teamMembers
  name, phone, relationship,
  isPrimary,
  medicalNotes TEXT,  -- Encrypted
  dietaryRestrictions TEXT[],
  createdAt, updatedAt
)

workflowCorrelations (
  id, workflowId, workflowType,
  entityType, entityId,  -- e.g., 'order', 'abc123'
  status, startedAt, completedAt
)

notifications (
  id, teamId, userId,
  type, title, body, actionUrl,
  channel,  -- 'discord', 'email', 'push'
  sentAt, readAt, createdAt
)

-- Preferences
teamPreferences (
  id, teamId,
  agentPersonality,  -- 'glados', 'wheatley', 'neutral'
  discordGuildId, discordChannels JSONB,
  notificationSettings JSONB,
  createdAt, updatedAt
)

userPreferences (
  id, userId,
  discordUserId,
  notificationPreferences JSONB,
  dietaryRestrictions TEXT[],
  createdAt, updatedAt
)

-- OnShape Integration
onshapeConnections (
  id, teamId,
  documentId, elementId, name,
  lastSyncedAt, webhookId,
  createdAt, updatedAt
)

bomSnapshots (
  id, teamId, documentId,
  items JSONB,  -- Snapshot of BOM at this point
  createdAt
)

-- GitHub Integration
githubConnections (
  id, teamId,
  owner,  -- GitHub org or user
  installationId,  -- GitHub App installation
  repos TEXT[],  -- List of connected repos (or '*' for all)
  webhookSecret,
  createdAt, updatedAt
)

codeReviews (
  id, teamId, githubConnectionId,
  prNumber, prTitle, prUrl,
  author, authorGithubId,
  reviewStatus,  -- 'pending', 'reviewed', 'approved', 'changes_requested'
  agentReview JSONB,  -- AI-generated review content
  createdAt, reviewedAt
)
```

### 5.3 Phase 3 Additions

```sql
-- Travel & Logistics
travelers (
  id, tripId, userId,
  passportNumber, passportExpiry, passportCountry,
  visaStatus, visaType, visaExpiry,
  dietaryRestrictions TEXT[],
  medicalNotes TEXT,  -- Encrypted
  emergencyContactName, emergencyContactPhone,
  roomingAssignment,
  createdAt, updatedAt
)

trips (
  id, teamId, name,
  type,  -- 'competition', 'outreach', 'worlds'
  startDate, endDate,
  status,  -- 'planning', 'confirmed', 'in-progress', 'completed'
  legs JSONB,  -- Array of flight/hotel/ground segments
  contingencyPlans JSONB,
  customsDocuments JSONB,
  createdAt, updatedAt
)

-- Sponsors
sponsors (
  id, teamId,
  name, type,  -- 'corporate', 'individual', 'grant'
  amount INTEGER, currency TEXT,
  restrictions TEXT[],  -- 'parts-only', 'outreach-only'
  interests TEXT[],  -- 'stem-careers', 'competition'
  contacts JSONB,
  lastContactDate, renewalDate,
  createdAt, updatedAt
)

sponsorDeliverables (
  id, sponsorId,
  type,  -- 'logo-placement', 'social-post', 'facility-visit'
  description, dueDate,
  status,  -- 'pending', 'scheduled', 'completed', 'documented'
  evidence JSONB,  -- Photos, links
  createdAt, completedAt
)

sponsorMoments (
  id, sponsorId, teamId,
  type,  -- 'award', 'achievement', 'milestone'
  description, relatedUserId,
  suggestedMessage TEXT,
  status,  -- 'detected', 'draft-ready', 'sent', 'dismissed'
  createdAt, sentAt
)

-- Events & Outreach
events (
  id, teamId,
  type,  -- 'competition', 'outreach', 'build-session', 'scrimmage'
  name, date, endDate,
  location, venue JSONB,
  status,  -- 'planning', 'confirmed', 'completed'
  createdAt, updatedAt
)

eventAttendees (
  id, eventId, userId,
  status,  -- 'invited', 'confirmed', 'declined', 'attended'
  permissionFormStatus,  -- 'needed', 'sent', 'signed', 'expired'
  role,  -- 'driver', 'pit-crew', 'scout', 'presenter'
  createdAt, updatedAt
)

eventEquipment (
  id, eventId, partId,
  assignedTo,  -- userId
  status,  -- 'assigned', 'packed', 'verified', 'returned'
  createdAt
)

outreachHours (
  id, eventId, userId,
  hours DECIMAL,
  notes TEXT,
  createdAt
)

-- Community Intelligence
communityMetrics (
  id, vendorId,
  destinationRegion,  -- 'US', 'EU', 'APAC'
  avgLeadTimeDays DECIMAL,
  leadTimeStdDev DECIMAL,
  reliabilityScore INTEGER,  -- 0-100
  sampleSize INTEGER,
  lastUpdated TIMESTAMP
)

communityContributions (
  id, teamId,  -- Anonymized source
  metricType,  -- 'lead-time', 'vendor-reliability', 'customs-time'
  vendorId, value JSONB,
  createdAt
)
```

---

## 6. Integration Architecture

### 6.1 External Service Integrations

```
┌─────────────────────────────────────────────────────────────────────┐
│                     External Integrations                            │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   OnShape   │  │   GitHub    │  │   Discord   │  │ FTC Stats  │ │
│  │   (CAD)     │  │   (Code)    │  │   (Comms)   │  │  (Scores)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│  Webhook│         Webhook│         Gateway│          Scrape│        │
│    ▼    │           ▼    │           ▼    │            ▼   │        │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────┴──────┐ │
│  │  /webhooks  │  │  /webhooks  │  │  Discord.js │  │  Scheduler │ │
│  │  /onshape   │  │  /github    │  │  Bot Client │  │  (Daily)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Vendor     │  │  Restaurant │  │  Shipping   │  │ FlightAware│ │
│  │  APIs       │  │  APIs       │  │  Tracking   │  │  (Travel)  │ │
│  │  (REV, etc) │  │  (Yelp,etc) │  │  (17track)  │  │            │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│  Skills │         Skills │         Skills │         Polling│        │
│    ▼    │           ▼    │           ▼    │            ▼   │        │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────┴──────┐ │
│  │  Vendor     │  │  Meal       │  │  Shipping   │  │  Flight    │ │
│  │  Monitor    │  │  Planner    │  │  Monitor    │  │  Monitor   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 FTC Stats / FIRST Data Integration

**Purpose:** Populate public team pages with competition data.

**Data Sources:**
- **FTC Stats** (ftcstats.org) — OPR, awards, match history
- **FIRST API** — Official event data, team info
- **The Orange Alliance** — Community-maintained FTC data

**Sync Strategy:**
- Daily scheduled job during competition season
- On-demand refresh when viewing team page
- Cache results with 24-hour TTL

**Data Displayed on Public Pages:**
```
Team 5064 - Aperture Science
├─ Current Season: 2024-2025
│   ├─ OPR: 127.3 (Regional rank: 12)
│   ├─ Events: 3 attended
│   └─ Awards: Inspire Award (NC State)
│
├─ History:
│   ├─ 2023-2024: Worlds qualifier
│   ├─ 2022-2023: State champion
│   └─ Founded: 2012
│
└─ Upcoming:
    ├─ NC State Championship (Feb 15)
    └─ Open House at NCSSM (Jan 20)
```

### 6.3 Skills Architecture

Skills are modular capabilities that can be added, removed, or updated independently.

```typescript
// Skill interface
interface Skill {
  name: string;
  description: string;
  version: string;

  // Capabilities
  canHandle: (intent: string) => boolean;
  execute: (params: unknown, context: SkillContext) => Promise<SkillResult>;

  // Optional: Scheduled execution
  schedule?: CronExpression;
  onSchedule?: (context: SkillContext) => Promise<void>;

  // Optional: Webhook handler
  webhookPath?: string;
  onWebhook?: (payload: unknown, context: SkillContext) => Promise<void>;
}

// Example: Vendor Monitor Skill
const vendorMonitorSkill: Skill = {
  name: 'vendor-monitor',
  description: 'Monitors vendor websites for stock changes and price updates',
  version: '1.0.0',

  canHandle: (intent) => intent.includes('check stock') || intent.includes('price'),

  execute: async ({ vendorId, partNumber }, context) => {
    const status = await checkVendorStock(vendorId, partNumber);
    return {
      inStock: status.available,
      price: status.price,
      leadTime: status.estimatedLeadTime,
    };
  },

  schedule: '0 */6 * * *', // Every 6 hours

  onSchedule: async (context) => {
    // Check all watched parts for changes
    const watchedParts = await getWatchedParts(context.teamId);
    for (const part of watchedParts) {
      const status = await checkVendorStock(part.vendorId, part.sku);
      if (status.changed) {
        await notifyTeam(context.teamId, {
          type: 'stock-change',
          part,
          previous: part.lastStatus,
          current: status,
        });
      }
    }
  },
};
```

### 6.4 Webhook Security

All incoming webhooks are verified:

```typescript
// middleware/webhookSecurity.ts
export function verifyWebhook(source: 'onshape' | 'discord' | 'stripe') {
  return async (c: Context, next: Next) => {
    const signature = c.req.header(`x-${source}-signature`);
    const body = await c.req.text();

    const secret = getWebhookSecret(source);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expected)
    )) {
      return c.text('Invalid signature', 401);
    }

    // Parse body and continue
    c.set('webhookPayload', JSON.parse(body));
    await next();
  };
}
```

### 6.5 Vendor Parts Catalog

**The Problem:**
Students typing part numbers manually is error-prone. Mentors waste time looking up prices. Nobody knows if a part is in stock until they try to order.

**Solution: Scraped Vendor Catalogs**

Maintain a synchronized catalog of parts from major FTC/FRC vendors:
- **REV Robotics** — Primary FTC vendor
- **goBILDA** — Popular FTC vendor
- **AndyMark** — FTC and FRC
- **ServoCity** — Components
- **The Robot Space** — UK/EU vendor (Phase 3)

**What We Track:**
```
vendorCatalogItems (
  id,
  vendorId,                -- FK to vendors
  sku,                     -- Vendor part number (e.g., "REV-41-1301")
  name,                    -- "HD Hex Motor"
  description,
  category,                -- "Motors", "Wheels", "Electronics"
  priceCents,              -- Current price
  priceUpdatedAt,
  inStock,                 -- Boolean
  stockLevel,              -- 'in-stock', 'low-stock', 'out-of-stock', 'discontinued'
  leadTimeDays,            -- Estimated if out of stock
  imageUrl,
  productUrl,              -- Deep link to vendor page
  specs JSONB,             -- Weight, dimensions, voltage, etc.
  relatedSkus TEXT[],      -- "Teams who buy this also buy..."
  lastScrapedAt,
  createdAt, updatedAt
)
```

**Sync Strategy (Temporal Workflow):**
```
VendorCatalogSyncWorkflow
├─ Schedule: Daily at 3am (low traffic)
├─ For each vendor:
│   ├─ Fetch sitemap or known product pages
│   ├─ Scrape product details
│   ├─ Diff against existing catalog
│   ├─ Update changed items
│   └─ Flag discontinued items
├─ Generate price change alerts
└─ Update "related items" based on order history
```

**UI Integration:**
- **Autocomplete**: When typing a part name or SKU, suggest from catalog
- **Price display**: Show current price from vendor when adding to inventory
- **Stock warnings**: "⚠️ REV shows this as out of stock" before ordering
- **One-click add**: Add catalog item to inventory with all details pre-filled

**Example Autocomplete:**
```
User types: "REV-41-13"

Suggestions:
┌────────────────────────────────────────────────────────────┐
│ REV-41-1301  HD Hex Motor                    $24.99  ✓ In Stock │
│ REV-41-1300  Core Hex Motor                  $17.99  ✓ In Stock │
│ REV-41-1310  HD Hex Motor 20:1               $24.99  ⚠️ Low      │
└────────────────────────────────────────────────────────────┘
```

**Note on Scope:**
- We catalog major robotics vendors (REV, goBILDA, AndyMark, etc.)
- NOT Amazon, McMaster-Carr, Home Depot (catalogs too large)
- Team-added "generic" parts don't need catalog matching

---

### 6.6 Community Intelligence

**The Vision:**
Anonymized, aggregated insights from across all BuildSeason teams create a shared intelligence layer that helps every team make better decisions.

**"Teams who buy X also buy Y" (Frequently Bought Together)**

When a team adds a REV Ultraplanetary motor to their BOM, suggest:
- Ultraplanetary cartridges (20:1, 5:1)
- Motor mounting bracket
- Encoder cable
- Sonic hub (they'll need it!)

```
frequentlyBoughtTogether (
  id,
  sourcePartCatalogId,     -- The part being viewed/added
  relatedPartCatalogId,    -- The suggested part
  cooccurrenceCount,       -- How many teams bought both
  confidence,              -- Statistical confidence
  relationship,            -- 'required', 'recommended', 'popular'
  lastCalculatedAt
)
```

**Example Agent Interaction:**
```
Student adds "REV-41-1310 HD Hex Motor" to cart

Agent: "Heads up—that motor needs a Sonic Hub (REV-31-1595) to connect
to the Control Hub. 87% of teams who order this motor also order the
Sonic Hub. You have 0 in stock. Add to order? ✅"
```

**"Teams using X have upgraded to Y" (Library/Firmware Intelligence)**

For software teams (via GitHub integration):
- "12 teams using FTC SDK 9.0 have issues with the OTOS driver. 8 have already upgraded to the patched version."
- "Teams using your version of the RoadRunner library have 3 known issues. Latest version fixes all three."

```
libraryVersionIntelligence (
  id,
  libraryName,             -- "FtcRobotController", "RoadRunner", "OTOS-Driver"
  versionPattern,          -- Regex or semver range
  knownIssues JSONB,       -- [{description, severity, fixVersion}]
  recommendedVersion,
  teamsOnVersion INTEGER,  -- Anonymized count
  teamsUpgraded INTEGER,   -- Count who upgraded from this version
  lastUpdatedAt
)
```

**Lead Time Intelligence**

Aggregate actual lead times from all teams:
- "Average lead time for REV orders to North Carolina: 4.2 days (based on 127 orders)"
- "⚠️ goBILDA lead times have increased 40% this week—competition season rush"

**Proactive Design-Phase Alerts**

The agent monitors trending parts across the community and vendor stock:

```
Agent (in #design channel, unprompted):

"⚠️ Heads up on your intake design...

I noticed you've been looking at goBILDA Gecko Wheels (3211-0001-0002).
They're popular this year—42 teams in my network have added them to BOMs.

Problem: goBILDA shows them as OUT OF STOCK with no ETA.

Plan B options:
• REV Grip Wheels (REV-41-1354) — In stock, similar grip profile
• AndyMark Compliant Wheels — In stock, different mounting
• Wait it out — Based on past patterns, goBILDA restocks ~3 weeks

Want me to compare specs? Or add the REV option to your cart as backup?"
```

This combines:
- Community intelligence (what parts are trending)
- Vendor catalog (real-time stock status)
- Proactive monitoring (watching parts mentioned in team's OnShape/Discord)
- Actionable alternatives (not just "out of stock" but actual options)

**Data Anonymization:**
- All community metrics are aggregated (minimum 10 data points)
- Individual team data never exposed
- Teams can opt out of contributing (but still receive insights)

---

### 6.7 Email Integration

**The Problem:**
Order tracking is fragmented—confirmation emails in Gmail, shipping notifications in another inbox, tracking numbers scattered across browser tabs. Mentors manually update BuildSeason when orders ship, often forgetting.

**Solution: Team Email Inbox**

Each team gets a dedicated email address:
```
ftc5064@buildseason.org
frc900@buildseason.org
```

**Usage Patterns:**

1. **CC on Orders**: When placing orders, CC the team email
   - BuildSeason parses confirmation emails
   - Auto-creates or updates order records
   - Extracts order numbers, totals, items

2. **Forward Shipping Notifications**: Forward shipping emails
   - BuildSeason extracts tracking numbers
   - Links to existing orders
   - Auto-updates order status to "shipped"

3. **Auto-Forward Rule**: Set up Gmail filter to auto-forward
   - From: `orders@revrobotics.com`, `shipping@gobilda.com`
   - Forward to: `ftc5064@buildseason.org`

**Email Processing (Temporal Workflow):**
```
EmailProcessingWorkflow
├─ Receive email via webhook (SendGrid, Postmark, etc.)
├─ Parse email content:
│   ├─ Identify email type (order confirmation, shipping, invoice)
│   ├─ Extract vendor (from sender or content)
│   ├─ Extract order number, items, prices, tracking
│   └─ Match to existing order or create new
├─ Update order record
├─ Notify team in Discord:
│   └─ "📦 REV order #12345 shipped! Tracking: 1Z999..."
└─ Store email for audit trail
```

**Data Model:**
```sql
teamEmailInboxes (
  id,
  program, number,         -- FK to teams
  emailAddress,            -- "ftc5064@buildseason.org"
  isActive,
  createdAt
)

inboundEmails (
  id,
  inboxId,                 -- FK to teamEmailInboxes
  fromAddress,
  subject,
  bodyText,
  bodyHtml,
  rawEmail TEXT,           -- Full RFC822 for audit
  parsedData JSONB,        -- Extracted order/shipping info
  processingStatus,        -- 'pending', 'processed', 'failed', 'ignored'
  linkedOrderId,           -- FK to orders (if matched)
  receivedAt,
  processedAt
)
```

**Vendor Email Patterns:**

| Vendor | Order Confirmation | Shipping Notification |
|--------|-------------------|----------------------|
| REV Robotics | orders@revrobotics.com | shipping@revrobotics.com |
| goBILDA | orders@gobilda.com | Contains "has shipped" |
| AndyMark | Contains "Order Confirmation" | Contains tracking number pattern |

**Agent Integration:**
```
Agent (in #orders channel):
"📬 Just received a shipping notification from REV!

Order #REV-12345 (placed Dec 20 by Sofia)
• 4x HD Hex Motor
• 2x Ultraplanetary Cartridge 20:1

Tracking: 1Z999AA10123456784
Expected delivery: Dec 28

React 📦 when you receive it to update inventory."
```

**Phase 2 Enhancement: Gmail/OAuth Integration**

For teams who prefer direct integration:
- OAuth connect to team Gmail account
- Auto-scan for vendor emails (with consent)
- No forwarding required
- Full automation

**Privacy Considerations:**
- Only vendor-related emails are processed
- Personal emails are ignored (pattern matching)
- Teams control which vendors are monitored
- Raw emails stored with encryption
- 90-day retention, then archived

---

## 7. Security & Compliance

### 7.1 Data Classification

| Category | Examples | Storage | Access |
|----------|----------|---------|--------|
| Public | Team name, competition results | Standard | Anyone |
| Internal | Parts inventory, orders | Standard | Team members |
| Confidential | Budget details, sponsor info | Standard | Mentors, admins |
| Sensitive | Student contact, medical | Encrypted | Need-to-know |
| Restricted | Passport numbers, SSN | Encrypted + audit | Travel coordinator only |

### 7.2 Compliance Considerations

**FERPA (Student Data)**
- Student educational records require parental consent
- De-identification for analytics
- Right to access and correct

**COPPA (Children Under 13)**
- FTC teams include students as young as 12
- Parental consent required
- Limited data collection

**GDPR (EU Teams)**
- Data minimization
- Right to erasure
- Data portability
- Privacy by design

### 7.3 Security Controls

```typescript
// Role-based access control
const roles = {
  student: {
    can: ['read:own-data', 'read:inventory', 'create:order-request'],
    cannot: ['approve:order', 'access:budget', 'manage:team'],
  },
  mentor: {
    can: ['*:inventory', '*:orders', 'read:budget', 'approve:order'],
    cannot: ['manage:team', 'access:sensitive'],
  },
  admin: {
    can: ['*:*'],
    cannot: [],
  },
};

// Middleware
export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const teamMember = c.get('teamMember');

    if (!hasPermission(teamMember.role, permission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

// Audit logging for sensitive operations
export function auditLog(action: string) {
  return async (c: Context, next: Next) => {
    const before = Date.now();
    await next();
    const after = Date.now();

    await db.insert(auditLogs).values({
      userId: c.get('user')?.id,
      action,
      resourceType: c.req.path.split('/')[2],
      resourceId: c.req.param('id'),
      duration: after - before,
      statusCode: c.res.status,
      ipAddress: c.req.header('x-forwarded-for'),
      userAgent: c.req.header('user-agent'),
      createdAt: new Date(),
    });
  };
}
```

### 7.4 Encryption

```typescript
// Sensitive field encryption
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encryptSensitive(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSensitive(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage in schema
export const travelers = sqliteTable('travelers', {
  // ...
  passportNumber: text('passport_number'), // Encrypted before storage
  medicalNotes: text('medical_notes'), // Encrypted before storage
});
```

---

## 8. Deployment Strategy

### 8.1 Phase 1 Deployment

```yaml
# fly.toml (Phase 1 - Single region)
app = "buildseason"
primary_region = "iad"  # US East

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]

[[services.ports]]
  port = 80
  handlers = ["http"]
```

```dockerfile
# Dockerfile (Phase 1)
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/web/dist ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

### 8.2 Phase 2 Deployment

```yaml
# fly.toml (Phase 2 - Separate services)
# API
[processes]
  api = "bun run dist/api/index.js"
  bot = "bun run dist/bot/index.js"
  worker = "bun run dist/worker/index.js"

[[services]]
  processes = ["api"]
  internal_port = 3000
  # ...

# Temporal Worker connects to Temporal Cloud
[env]
  TEMPORAL_ADDRESS = "your-namespace.tmprl.cloud:7233"
  TEMPORAL_NAMESPACE = "buildseason-prod"
```

### 8.3 Phase 3 Deployment

```yaml
# fly.toml (Phase 3 - Multi-region)
primary_region = "iad"

[env]
  TURSO_PRIMARY_URL = "${TURSO_PRIMARY_URL}"
  # Set per-region in fly secrets

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

# Regional deployment
[processes]
  api = "bun run dist/api/index.js"

# Fly will deploy to multiple regions
[[regions]]
  region = "iad"

[[regions]]
  region = "ams"

[[regions]]
  region = "nrt"
```

### 8.4 Database Configuration

```typescript
// db/index.ts (Phase 1)
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);

// db/index.ts (Phase 3 - Embedded replicas)
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // Embedded replica for low-latency reads
  syncUrl: process.env.TURSO_SYNC_URL,
  syncInterval: 60, // Sync every 60 seconds
});

export const db = drizzle(client);
```

---

## 9. Migration Paths

### 9.1 Phase 1 → Phase 2

**Adding Temporal:**
1. Deploy Temporal (Cloud or self-hosted)
2. Add Temporal SDK to codebase
3. Implement workflows for existing flows (order approval, etc.)
4. Migrate flows one-by-one:
   - Keep old flow working
   - Add feature flag for new workflow
   - Test with subset of teams
   - Roll out fully
   - Remove old flow

**Adding Claude Agent SDK:**
1. Add Claude Agent SDK dependency
2. Implement basic query tools
3. Add alongside existing slash commands (not replacing)
4. Natural language as an opt-in feature
5. Gather feedback, iterate on personality
6. Expand capabilities based on usage

**Database migrations:**
```sql
-- Add Phase 2 tables (safe, additive)
CREATE TABLE agent_conversations (...);
CREATE TABLE workflow_correlations (...);
CREATE TABLE notifications (...);
CREATE TABLE team_preferences (...);
CREATE TABLE user_preferences (...);
CREATE TABLE onshape_connections (...);
CREATE TABLE bom_snapshots (...);
```

### 9.2 Phase 2 → Phase 3

**Multi-region database:**
1. Contact Turso for multi-region setup
2. Create regional primaries
3. Update connection logic:
   ```typescript
   function getDatabaseUrl(teamRegion: string) {
     return process.env[`TURSO_${teamRegion}_URL`];
   }
   ```
4. Migrate teams to regional primaries
5. Add embedded replicas for read performance

**Multi-region Fly:**
1. Update `fly.toml` with regions
2. Deploy to new regions
3. Configure routing (Fly handles this automatically)
4. Monitor latency and adjust

**New features:**
- Add tables for travelers, trips, sponsors, events
- Implement new workflows (travel monitoring, sponsor nurturing)
- Add new integrations (FlightAware, restaurant APIs)

---

## Appendix A: API Contracts

### REST API (Public)

```
GET  /api/v1/teams/:id/parts
POST /api/v1/teams/:id/parts
GET  /api/v1/teams/:id/orders
POST /api/v1/teams/:id/orders
POST /api/v1/webhooks/onshape
POST /api/v1/webhooks/discord-interactions
```

### Hono RPC (Frontend)

```typescript
// Defined in apps/api/src/routes/index.ts
type AppType = typeof app;

// Used in apps/web with hc client
const client = hc<AppType>('/api');
await client.teams.$get();
await client.teams[':id'].parts.$get({ param: { id: 'team-123' } });
```

### Temporal Workflows

```
OrderApprovalWorkflow(orderId: string)
PermissionFormWorkflow(studentId: string, eventId: string)
MealCoordinationWorkflow(eventId: string)
OnShapeSyncWorkflow(documentId: string, elementId: string)
TravelMonitorWorkflow(tripId: string)
SponsorNurturingWorkflow(sponsorId: string)
```

---

## Appendix B: Environment Variables

```bash
# Required - Phase 1
DATABASE_URL=libsql://db.turso.io
TURSO_AUTH_TOKEN=xxx
BETTER_AUTH_SECRET=xxx
DISCORD_BOT_TOKEN=xxx
DISCORD_CLIENT_ID=xxx

# Required - Phase 2
TEMPORAL_ADDRESS=xxx.tmprl.cloud:7233
TEMPORAL_NAMESPACE=buildseason
TEMPORAL_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
ONSHAPE_ACCESS_KEY=xxx
ONSHAPE_SECRET_KEY=xxx

# Required - Phase 3
TURSO_US_URL=xxx
TURSO_EU_URL=xxx
TURSO_APAC_URL=xxx
REDIS_URL=xxx
ENCRYPTION_KEY=xxx
FLIGHTAWARE_API_KEY=xxx
```

---

## Appendix C: Monitoring & Observability

### Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| api_request_duration_ms | API latency | p99 > 500ms |
| workflow_duration_s | Temporal workflow time | > 1 hour for approval |
| discord_message_latency_ms | Bot response time | > 3000ms |
| db_query_duration_ms | Database query time | p99 > 100ms |
| error_rate | 5xx responses / total | > 1% |

### Logging

```typescript
// Structured logging
logger.info('Order created', {
  orderId: order.id,
  teamId: order.teamId,
  total: order.totalCents,
  itemCount: order.items.length,
});

// Trace context for distributed tracing
logger.info('Workflow started', {
  workflowId: context.workflowId,
  runId: context.runId,
  traceId: context.traceId,
});
```

### Dashboards

- **API Health**: Request rate, latency, error rate
- **Workflows**: Running workflows, completion rate, failures
- **Discord Bot**: Message rate, response latency, command usage
- **Database**: Query performance, connection pool, storage

---

*This specification will evolve as we learn from users and the platform grows.*
