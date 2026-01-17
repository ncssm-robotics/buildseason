# BuildSeason Philosophy

> "Machines do machine work so humans can do human work. Humanize the machine, don't mechanize the human."

## Core Belief

Robotics teams are drowning in operational overhead. Students spend more time fighting spreadsheets and chasing orders than designing and building robots. BuildSeason exists to flip this equation.

The agent handles the grind. Humans focus on what matters: creativity, strategy, and building things that move.

## The Agent IS the Experience

BuildSeason isn't a web app with an AI assistant bolted on. The agent IS the product.

**Discord is primary.** Teams already live in Discord. They shouldn't have to context-switch to a separate platform to manage their season. GLaDOS meets them where they are.

**Web is secondary.** The web interface exists for specific scenarios:

- Configuration that's easier with a visual interface
- Reports and dashboards that benefit from visual layout
- Administrative tasks that require human oversight
- Public-facing content (team pages, sponsor visibility)

**The question isn't "what UI do we build?"** It's "can the agent handle this conversation?"

## Proactive, Not Reactive

Traditional apps wait for users to open them and check status. GLaDOS doesn't wait.

- **Monitor and alert.** Don't make humans poll dashboards.
- **Anticipate needs.** Parts running low? Vendor shipment delayed? Tell the team before they ask.
- **Connect the dots.** If a CAD change affects the BOM which affects an order, surface that chain proactively.

The agent knows the team's state better than any dashboard could display it.

## Context-Aware Intelligence

Every interaction happens with full team context:

- Current BOM state and parts inventory
- Pending orders and their status
- Team member roles and responsibilities
- Season timeline and upcoming deadlines
- Historical patterns and preferences

When a mentor asks "what do we need to order?", the agent doesn't need the mentor to navigate to a page and run a report. The agent knows.

## Human Judgment for Human Decisions

The agent handles machine work. Humans handle human work.

**Agent handles:**

- Data gathering and synthesis
- Status monitoring and alerting
- Routine follow-ups and reminders
- Cross-referencing information sources
- Formatting and presenting information

**Humans handle:**

- Strategic decisions (what to build, when, how)
- Approval workflows (purchases, access, changes)
- Creative work (design, problem-solving, innovation)
- Relationship management (sponsors, volunteers, mentors)
- Edge cases requiring judgment

The boundary is clear: if it's mechanical, the agent does it. If it requires judgment, the agent surfaces the decision to a human.

## Design Principles

### 1. Conversation Over Clicks

Instead of: Navigate to Parts > Filter by Robot > Sort by Status > Export to CSV > Review
Agent: "Show me what parts we're missing for the intake"

Every feature should be tested against: "Could this be a conversation?"

### 2. Agent-Deliverable First

When designing a feature, start with: "How would the agent deliver this?"

A feature that requires a custom UI to be useful might be the wrong feature. A feature that the agent can explain, summarize, or act on in conversation is probably the right one.

### 3. Minimal Surface Area

The web interface should be small and focused. Every page must justify its existence:

- "Why can't the agent handle this?"
- "What human judgment requires this visual interface?"
- "Would a conversation be clearer than this form?"

### 4. Information Flows to Humans

Don't make humans hunt for information. Push status, alerts, and summaries to where humans already are (Discord). Pull is a fallback, not a primary pattern.

### 5. Trust the Agent

If we build the agent right, we should trust it. That means:

- Don't build dashboards to "double-check" agent work
- Don't require human verification of things the agent can verify
- Let the agent handle routine operations autonomously

Build confidence through transparency (the agent explains its reasoning) not through redundant human oversight.

## What This Means in Practice

**Before adding a feature, ask:**

1. Can the agent handle this entirely through conversation?
2. If not, can the agent initiate it and hand off for human completion?
3. If a UI is truly needed, is it because human judgment is required, or are we just being lazy about agent capabilities?

**The hierarchy:**

1. Agent handles it autonomously
2. Agent initiates, human approves/completes
3. UI exists for human-judgment tasks
4. API exists for external integrations

**Success looks like:**

- Students spend more time building robots
- Mentors spend less time on operational overhead
- Teams naturally talk to GLaDOS more than they click through the web app
- The web interface is small, focused, and rarely needed for daily operations
