# Research: OpenClaw as Agent for GLaDOS

**Date:** 2026-02-01
**Status:** Completed
**Conclusion:** Not recommended as a replacement; adopt memory, workflow, and Discord patterns

## What is OpenClaw?

OpenClaw (formerly Clawdbot, then Moltbot) is an open-source autonomous AI personal assistant created by Peter Steinberger (PSPDFKit founder). Released late 2025, it hit 100k+ GitHub stars in ~2 months.

- **Website:** [openclaw.ai](https://openclaw.ai/)
- **Docs:** [docs.openclaw.ai](https://docs.openclaw.ai/)
- **GitHub:** [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

### Architecture

- **Gateway** — central daemon managing all channels, sessions, tools, and WebSocket connections
- **Two-layer memory** — daily append-only logs + curated long-term `MEMORY.md` with hybrid BM25/vector search via SQLite
- **Skills system** — 700+ community skills via ClawHub registry; agent can auto-install new ones
- **Lobster** — typed workflow pipelines with approval gates (composable, resumable)
- **Model-agnostic** — Claude, GPT, Gemini, local models via Ollama
- **Multi-channel** — Discord, Slack, WhatsApp, Telegram, Signal, iMessage, Teams, Matrix, Google Chat

### Current State (Feb 2026)

- Hosted platform launched Jan 31, 2026 (OpenClawd.ai)
- Cloudflare published [Moltworker](https://github.com/cloudflare/moltworker) — deploys OpenClaw on Workers + Sandbox + Browser Rendering
- 700+ community skills
- Significant security concerns (Cisco: 26% of skills have vulnerabilities)
- Cost: $30-70/month typical, power users $3,600+/month

## Why OpenClaw Does NOT Fit as a Replacement

| Dimension | GLaDOS (Current) | OpenClaw |
|---|---|---|
| **Integration** | Deeply embedded in Convex backend | Standalone Gateway daemon |
| **Data access** | Direct Convex queries/mutations | MCP/skill-based, external APIs |
| **Tool control** | Controlled, audited tool set | 700+ community skills, self-installs |
| **Security** | Team-scoped, YPP-compliant, audit-logged | User-configured, documented gaps |
| **Multi-tenancy** | One agent serving N teams | One container per deployment |
| **Context** | Full team state injected per request | Generic memory (daily logs + MEMORY.md) |

---

## Patterns Worth Adopting

### 1. Two-Layer Durable Memory

**OpenClaw pattern:** Daily append-only logs + curated long-term `MEMORY.md` + hybrid BM25/vector search. Before session compaction, a silent agentic turn flushes important context to durable memory.

**GLaDOS today:** `conversations` table stores last 50 messages per team+channel, 7-day cleanup. Only the last 10 messages are loaded as agent context. When messages are trimmed or cleaned up, that context is gone forever.

**What to build:**

#### a. Team Memory Table

New `teamMemory` table for durable facts that survive conversation trimming:

```
teamMemory {
  teamId: Id<"teams">
  category: "preference" | "decision" | "lesson" | "context"
  content: string           // The fact itself
  source: string            // What conversation/event created it
  createdAt: number
  createdBy: string         // userId or "agent"
  supersededBy?: Id<"teamMemory">  // For updated facts
}
  .index("by_team", ["teamId"])
  .index("by_team_category", ["teamId", "category"])
```

Examples:
- `preference`: "Team prefers goBILDA over REV for structural channels"
- `decision`: "Using 5:1 gear ratio on arm after testing showed 3:1 was too fast"
- `lesson`: "McMaster orders take 3 days to arrive, not 1"
- `context`: "Robot name is 'Scorch'. Competition is Feb 15."

#### b. Agent Memory Tool

New tool `memory_save` that the agent calls when it recognizes a durable fact:

```typescript
// convex/agent/tools/memory.ts
memory_save: {
  description: "Save an important fact about the team for long-term reference",
  parameters: {
    category: "preference | decision | lesson | context",
    content: "string - the fact to remember",
  }
}
memory_search: {
  description: "Search team memory for relevant past context",
  parameters: {
    query: "string - what to search for",
  }
}
```

#### c. Pre-Compaction Flush

Before trimming conversations (in `conversation.ts:append`), when messages would be dropped, call a Haiku summarization pass to extract durable facts into `teamMemory`. This mirrors OpenClaw's "flush before compaction" pattern.

**Implementation approach:**
1. When `append()` trims messages, check if any are being dropped
2. If yes, schedule an internal action that sends dropped messages to Haiku
3. Haiku extracts any facts worth preserving → insert into `teamMemory`
4. Agent's system prompt includes relevant team memories (loaded in `context.ts`)

#### d. Context Loader Integration

Update `convex/agent/context.ts:loadTeamContext` to include recent team memories in the context object. The system prompt in `prompts/systemPrompt.ts` would include a "Team Memory" section with the most relevant facts.

---

### 2. Workflow Pipelines with Approval Gates

**OpenClaw pattern:** Lobster typed pipelines — deterministic multi-step workflows with explicit approval gates. Steps are data (YAML/JSON), not code. Halted workflows return a resume token. Side effects wait for approval.

**GLaDOS today:** Order status transitions are manual mutations (`submit()`, `approve()`, `markOrdered()`, `markReceived()`). No automated multi-step workflows. No way for the agent to orchestrate a sequence with pauses for human approval.

**What to build:**

#### a. Workflow Table

```
workflows {
  teamId: Id<"teams">
  type: "order_fulfillment" | "inventory_restock" | "competition_prep"
  status: "running" | "awaiting_approval" | "completed" | "failed"
  currentStep: number
  steps: [{
    name: string
    status: "pending" | "in_progress" | "awaiting_approval" | "completed" | "skipped"
    toolCall?: { name: string, args: object }
    result?: string
    approvedBy?: string        // userId who approved
    approvedAt?: number
  }]
  context: object              // Workflow-scoped data (order ID, etc.)
  createdAt: number
  updatedAt: number
}
  .index("by_team_status", ["teamId", "status"])
```

#### b. Example: Order Fulfillment Workflow

When a mentor approves an order, GLaDOS could create a workflow:

```
Step 1: Verify order details are complete          [auto]
Step 2: Check part availability in inventory       [auto]
Step 3: Calculate total cost                       [auto]
Step 4: Notify mentor with summary for final OK    [approval gate]
Step 5: Mark order as "ordered"                    [auto after approval]
Step 6: Watch for confirmation email               [auto, async]
Step 7: Link email to order, update status         [auto]
Step 8: Notify team in Discord                     [auto]
```

The agent would check for `awaiting_approval` workflows on each invocation and prompt mentors. Approval could come via Discord reaction or slash command.

#### c. Agent Workflow Tools

```typescript
// convex/agent/tools/workflows.ts
workflow_create: {
  description: "Create a multi-step workflow with approval gates",
  parameters: { type: string, context: object }
}
workflow_status: {
  description: "Check status of active workflows",
  parameters: { teamId: Id<"teams"> }
}
workflow_advance: {
  description: "Execute the next step of a workflow",
  parameters: { workflowId: Id<"workflows"> }
}
```

---

### 3. Proactive Agent Messaging

**OpenClaw pattern:** Agent can reach out to users proactively — morning briefings, deadline reminders, status alerts. Not just reactive to commands.

**GLaDOS today:** Purely reactive. Only responds when `/glados` or `/ask` is used in Discord. Has `discord_send_message` tool but no mechanism to trigger it proactively.

**What to build:**

#### a. Scheduled Check-Ins

Use Convex `crons` to trigger GLaDOS proactively:

```typescript
// convex/crons.ts
crons.interval("daily-team-briefing", { hours: 24 }, internal.agent.proactive.dailyBriefing);
crons.interval("order-status-check", { hours: 4 }, internal.agent.proactive.checkOrderStatus);
crons.interval("competition-countdown", { hours: 24 }, internal.agent.proactive.competitionReminder);
```

#### b. Proactive Action Handler

```typescript
// convex/agent/proactive.ts
export const dailyBriefing = internalAction(async (ctx) => {
  // For each active team:
  //   1. Load team context
  //   2. Check: pending orders, low stock, upcoming events, stale workflows
  //   3. If anything noteworthy, compose a brief message
  //   4. Send to team's #glados or #general channel
  //   5. Only send if there's real information (no empty "good morning!" messages)
});
```

#### c. Event-Triggered Messages

Beyond crons, trigger proactive messages on specific events:
- Order status changes → notify team channel
- Email parsed with tracking info → "Your McMaster order shipped!"
- Inventory drops below BOM requirement → "Heads up: we're short 3 servo motors"
- Competition within 7 days → daily countdown with checklist

---

### 4. Discord Interaction Improvements

**OpenClaw pattern:** DM pairing codes for unknown users. Guild channel isolation (conversations in #build-log stay separate from #orders). Bot-to-bot safeguards. Mention-only activation with per-channel overrides.

**GLaDOS today:** Slash commands only (`/glados`, `/ask`). Discord link tokens exist for account connection. Conversations scoped by team+channel already. No DM support. No @mention activation.

**What to build:**

#### a. @Mention Activation

Add message handler (not just slash commands) so GLaDOS responds when @mentioned in any channel. This is more natural than slash commands for quick questions.

In `convex/discord/handler.ts`, handle `MESSAGE_CREATE` events alongside `INTERACTION_CREATE`:

```
- Check if GLaDOS is @mentioned in message
- If yes, extract the message content (minus the mention)
- Route through the same agent handler
- Respond in-thread (or inline) rather than as a slash command follow-up
```

#### b. DM Support with Pairing

When someone DMs the bot:
1. Check if their Discord ID is linked (`discordLinks` table)
2. If linked → route to their team's agent context
3. If not linked → send pairing instructions (existing `discordLinkTokens` flow)
4. DM conversations stay private (separate channel scope)

#### c. Thread-Aware Conversations

Conversations in Discord threads should share context with the parent channel but be separately addressable. Update the `channelId` scoping to include thread IDs.

---

## Implementation Priority

| Pattern | Effort | Impact | Priority |
|---|---|---|---|
| Team memory table + agent tool | Medium | High — stops losing institutional knowledge | **1** |
| Pre-compaction memory flush | Medium | High — automatic fact preservation | **2** |
| Proactive messaging (crons) | Low | High — agent becomes useful without being asked | **3** |
| @Mention activation | Low | Medium — more natural Discord interaction | **4** |
| Workflow pipelines | High | Medium — orders already have manual flow | **5** |
| DM support | Medium | Low — most interaction is in team channels | **6** |

## References

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Memory System](https://docs.openclaw.ai/memory)
- [OpenClaw Browser Tool](https://docs.openclaw.ai/tools/browser)
- [OpenClaw Discord Integration](https://docs.openclaw.ai/channels/discord)
- [OpenClaw Exec Approvals](https://docs.openclaw.ai/tools/exec-approvals)
- [Lobster Workflow Shell](https://github.com/openclaw/lobster)
- [Cloudflare Moltworker](https://github.com/cloudflare/moltworker)
- [Cloudflare Blog: Moltworker](https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/)
- [Microsoft Playwright MCP Server](https://github.com/microsoft/playwright-mcp)
- [Cisco: "Personal AI Agents like OpenClaw Are a Security Nightmare"](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [VentureBeat: "OpenClaw proves agentic AI works."](https://venturebeat.com/security/openclaw-agentic-ai-security-risk-ciso-guide)
