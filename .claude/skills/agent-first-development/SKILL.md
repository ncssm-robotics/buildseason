---
name: agent-first-development
description: >-
  Agent-first development philosophy and decision framework.
  Use when planning new features, deciding between UI and agent approaches,
  or evaluating whether work aligns with agent-first architecture.
allowed-tools: Read, Glob, Grep
---

# Agent-First Development

BuildSeason is an agent-first platform. The agent IS the product. This skill helps evaluate features against that philosophy.

**See also:** `docs/PHILOSOPHY.md` and `docs/ARCHITECTURE.md`

## The Question Framework

Before implementing any feature, ask these questions in order:

### 1. Can the agent handle this entirely through conversation?

If yes → Build it as agent tools and context, not UI.

Examples:

- "What parts do we need to order?" → Agent query, not dashboard
- "Add 10 M3 bolts to inventory" → Agent mutation, not form
- "What's the status of our REV order?" → Agent query, not status page

### 2. If not, can the agent initiate and hand off for human completion?

If yes → Build minimal UI for the human-judgment piece only.

Examples:

- "Create a purchase order for low-stock items" → Agent drafts, human approves
- "Review the suggested vendor for this part" → Agent suggests, human confirms
- "Assign this task to a team member" → Agent proposes, mentor approves

### 3. Does this truly require human judgment that benefits from a visual interface?

If yes → Build focused UI for that specific workflow.

Examples:

- Organization/team configuration (one-time setup)
- Permission management (security-critical)
- Visual BOM comparison (spatial relationships)
- Financial approvals (legal/audit requirements)

## Feature Categories

### Agent-Complete

Agent handles autonomously. No UI needed.

- Status queries ("how many parts do we have?")
- Simple mutations ("add this part", "update quantity")
- Alerts and notifications
- Routine follow-ups
- Data synthesis and reporting

### Agent-Initiated

Agent starts, human completes. Minimal UI.

- Purchase approvals (agent drafts → human approves)
- Member invitations (agent suggests → human confirms)
- Deadline changes (agent recommends → human decides)

### UI-Primary

Human judgment requires visual interface.

- Initial team/org setup
- Access control configuration
- Visual comparisons (CAD BOM vs inventory)
- Compliance/audit workflows

## Anti-Patterns

### Building UI When Agent Could Handle

**Bad:** "We need a parts search page with filters"
**Good:** Agent answers "what parts do we have from REV?" directly

### Dashboard-First Thinking

**Bad:** "Let's build a dashboard showing order status"
**Good:** Agent proactively alerts when orders need attention

### Form for Everything

**Bad:** "Add a form to create purchase orders"
**Good:** Agent drafts order from conversation, presents for approval

### Notification Center

**Bad:** "Build a notification inbox page"
**Good:** Agent sends relevant updates to Discord where team already is

## Decision Tree

```
New Feature Request
        │
        ▼
   Is it a query?
        │
    ┌───┴───┐
   Yes      No
    │        │
    ▼        ▼
Agent tool  Is it a mutation?
    │            │
    │       ┌────┴────┐
    │      Yes       No
    │       │         │
    │       ▼         ▼
    │   Agent can    Is it configuration?
    │   execute?          │
    │       │        ┌────┴────┐
    │   ┌───┴───┐   Yes       No
    │  Yes      No   │         │
    │   │       │    ▼         ▼
    │   ▼       ▼   Minimal   Rethink
    │ Agent   Approval  UI    the
    │ tool    workflow        feature
    │
    └─────────► No UI needed
```

## Checklist for New Features

- [ ] Can this be a conversation with the agent?
- [ ] If UI is needed, is it for human judgment or just information display?
- [ ] Would this feature be better as a proactive alert?
- [ ] Does the agent have the context needed to handle this?
- [ ] Am I building this UI because it's necessary or because it's familiar?

## Examples

### Parts Inventory

**Old thinking:** Build parts table with search, filters, pagination
**Agent-first:** Agent answers questions about parts directly

Queries like:

- "What parts are low stock?"
- "How many M3 bolts do we have?"
- "What did we order from goBILDA last month?"

The agent knows the answer. No table needed.

### Order Management

**Old thinking:** Order status page with timeline visualization
**Agent-first:** Agent alerts when orders need attention

- Order shipped → Agent tells Discord
- Order delayed → Agent alerts with options
- Order received → Agent asks "mark as received?"

The team learns status through conversation, not by checking a page.

### BOM Comparison

**Agent-first exception:** Visual comparison may genuinely help

When comparing CAD BOM to inventory, spatial layout helps humans spot issues. This is a valid UI case - but the agent should still drive:

- "Compare intake BOM to inventory" triggers the comparison view
- Agent summarizes differences
- UI shows spatial detail for human review
