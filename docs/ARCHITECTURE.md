# BuildSeason Architecture

Agent-first platform architecture using Convex + Claude Agent SDK.

## Overview

BuildSeason is an agent-first platform where the Claude agent IS the primary interface. The architecture centers on Convex actions that host the agent, with mutations and queries as agent tools.

```
Discord/Web → HTTP Endpoint → Convex Action → Claude Agent → Mutations/Queries
```

**Key insight:** The agent isn't a feature of the platform. The agent IS the platform. Convex provides the data layer and execution environment; Claude provides the intelligence.

## Core Pattern: Agent IS Convex Actions

The agent runs inside Convex actions. This gives us:

- Serverless execution with automatic scaling
- Direct access to the database through internal functions
- Real-time capabilities through Convex subscriptions
- Scheduled functions for proactive monitoring

```typescript
// convex/agent/handler.ts
import Anthropic from "@anthropic-ai/sdk";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const handleMessage = action({
  args: {
    message: v.string(),
    teamId: v.id("teams"),
    userId: v.id("users"),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Load team context
    const context = await ctx.runQuery(internal.agent.context.loadTeamContext, {
      teamId: args.teamId,
    });

    // Initialize Claude with tools
    const client = new Anthropic();
    const tools = buildTools(ctx, args.teamId);

    // Run agent loop
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(context),
      tools,
      messages: [{ role: "user", content: args.message }],
    });

    // Process tool calls, continue conversation as needed
    return processResponse(ctx, response, tools);
  },
});
```

## Data Flow

### Discord → Agent → Database

```
1. User sends message in Discord
2. Discord webhook calls Convex HTTP endpoint
3. HTTP handler triggers agent action
4. Agent loads team context
5. Agent processes message with Claude
6. Agent calls mutations/queries as tools
7. Agent returns response
8. HTTP handler sends response back to Discord
```

### Scheduled Monitoring

```
1. Scheduled function runs (e.g., every hour)
2. Query checks for conditions (low stock, delayed orders)
3. If action needed, trigger agent action
4. Agent composes message
5. Send to Discord webhook
```

## Tool Pattern

Tools are thin wrappers around Convex mutations and queries. The agent calls tools; tools execute Convex functions.

```typescript
// convex/agent/tools/parts.ts
import { internal } from "../_generated/api";

export function buildPartsTools(ctx: ActionCtx, teamId: Id<"teams">) {
  return [
    {
      name: "get_parts_inventory",
      description: "Get current parts inventory for the team",
      input_schema: {
        type: "object" as const,
        properties: {
          filter: {
            type: "string",
            description:
              "Optional filter: 'low_stock', 'all', or subsystem name",
          },
        },
      },
      execute: async (input: { filter?: string }) => {
        return ctx.runQuery(internal.parts.getForAgent, {
          teamId,
          filter: input.filter,
        });
      },
    },
    {
      name: "update_part_quantity",
      description: "Update the quantity of a part in inventory",
      input_schema: {
        type: "object" as const,
        properties: {
          partId: { type: "string", description: "Part ID" },
          quantity: { type: "number", description: "New quantity" },
          reason: { type: "string", description: "Reason for change" },
        },
        required: ["partId", "quantity"],
      },
      execute: async (input: {
        partId: string;
        quantity: number;
        reason?: string;
      }) => {
        return ctx.runMutation(internal.parts.updateQuantity, {
          partId: input.partId as Id<"parts">,
          quantity: input.quantity,
          reason: input.reason,
        });
      },
    },
  ];
}
```

## Context Loader Pattern

Before each agent interaction, load relevant team context. This gives the agent awareness without requiring explicit queries.

```typescript
// convex/agent/context.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const loadTeamContext = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);

    // Get current inventory state
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const lowStockParts = parts.filter((p) => p.quantity <= p.reorderPoint);

    // Get pending orders
    const pendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Get active season
    const season = team?.activeSeasonId
      ? await ctx.db.get(team.activeSeasonId)
      : null;

    return {
      team,
      season,
      inventorySummary: {
        totalParts: parts.length,
        lowStockCount: lowStockParts.length,
        lowStockParts: lowStockParts.map((p) => ({
          id: p._id,
          name: p.name,
          quantity: p.quantity,
        })),
      },
      pendingOrders: pendingOrders.map((o) => ({
        id: o._id,
        status: o.status,
        totalCents: o.totalCents,
      })),
    };
  },
});
```

## Discord Webhook Handler

HTTP endpoint that receives Discord webhook events and routes to agent.

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/discord/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify Discord signature
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    if (!verifyDiscordSignature(signature, timestamp, body)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle Discord ping
    if (payload.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle message
    if (payload.type === 2) {
      const response = await ctx.runAction(
        internal.agent.handler.handleMessage,
        {
          message: payload.data.options[0].value,
          teamId: payload.data.options[1].value,
          userId: payload.member.user.id,
          channelId: payload.channel_id,
        }
      );

      return new Response(
        JSON.stringify({
          type: 4,
          data: { content: response },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("OK");
  }),
});

export default http;
```

## Scheduled Monitoring

Proactive agent that monitors conditions and alerts when needed.

```typescript
// convex/agent/monitoring.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check inventory levels every hour
crons.interval(
  "check-inventory-levels",
  { hours: 1 },
  internal.agent.monitoring.checkInventoryLevels
);

// Check order status daily
crons.daily(
  "check-order-status",
  { hourUTC: 14, minuteUTC: 0 }, // 9am EST
  internal.agent.monitoring.checkOrderStatus
);

export default crons;
```

```typescript
// convex/agent/monitoring.ts
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const checkInventoryLevels = internalAction({
  handler: async (ctx) => {
    // Get all teams
    const teams = await ctx.runQuery(internal.teams.listAll);

    for (const team of teams) {
      const context = await ctx.runQuery(
        internal.agent.context.loadTeamContext,
        {
          teamId: team._id,
        }
      );

      // If there are critical low-stock items, alert
      if (context.inventorySummary.lowStockCount > 0) {
        const message = await ctx.runAction(
          internal.agent.handler.composeAlert,
          {
            teamId: team._id,
            type: "low_stock",
            context: context.inventorySummary,
          }
        );

        await ctx.runAction(internal.discord.sendMessage, {
          teamId: team._id,
          message,
        });
      }
    }
  },
});
```

## Conversation Context Storage

Store conversation history for multi-turn interactions.

```typescript
// Add to schema.ts
conversations: defineTable({
  teamId: v.id("teams"),
  userId: v.string(), // Discord user ID
  channelId: v.string(),
  messages: v.array(v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  })),
  lastActivity: v.number(),
})
  .index("by_team_channel", ["teamId", "channelId"])
  .index("by_last_activity", ["lastActivity"]),
```

## Interface Hierarchy

1. **Discord (Primary):** Agent conversations, alerts, commands
2. **Web (Secondary):** Configuration, reports, approval workflows
3. **API (Tertiary):** External integrations, webhooks

The web interface should be minimal:

- Team/organization settings
- Member management and permissions
- Visual reports and dashboards
- Approval workflows that benefit from UI
- Configuration of agent behaviors

## Directory Structure

```
convex/
├── agent/
│   ├── handler.ts       # Main agent action
│   ├── context.ts       # Context loader
│   ├── monitoring.ts    # Scheduled checks
│   └── tools/
│       ├── parts.ts     # Parts inventory tools
│       ├── orders.ts    # Order management tools
│       ├── bom.ts       # BOM tools
│       └── index.ts     # Tool builder
├── http.ts              # HTTP endpoints (Discord webhook)
├── crons.ts             # Scheduled jobs
├── schema.ts            # Database schema
└── [domain].ts          # Domain functions (parts, orders, etc.)
```

## Security Considerations

1. **Discord Signature Verification:** Always verify webhook signatures
2. **Team Isolation:** All queries/mutations are scoped to team
3. **Permission Checks:** Verify user has permission for requested action
4. **Rate Limiting:** Implement rate limits on HTTP endpoints
5. **Audit Logging:** Log all agent actions for accountability

## Real-Time Updates

Convex's reactive queries enable real-time updates:

```typescript
// Frontend can subscribe to changes
const orders = useQuery(api.orders.listPending, { teamId });

// Agent mutations automatically trigger re-renders
// No polling, no manual refresh
```

This pairs with Discord: the web shows live state, Discord delivers proactive updates.
