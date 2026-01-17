---
name: convex-agent-patterns
description: >-
  Patterns for building Claude agents inside Convex actions.
  Use when implementing agent actions, building tools, creating context loaders,
  or setting up Discord webhook handlers.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bun:*)
---

# Convex Agent Patterns

Patterns for implementing Claude agents inside Convex actions.

**See also:** `docs/ARCHITECTURE.md` for full architecture overview.

## Agent Action Structure

The main agent handler lives in a Convex action:

```typescript
// convex/agent/handler.ts
import Anthropic from "@anthropic-ai/sdk";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildTools } from "./tools";

export const handleMessage = action({
  args: {
    message: v.string(),
    teamId: v.id("teams"),
    userId: v.id("users"),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Load context
    const context = await ctx.runQuery(internal.agent.context.loadTeamContext, {
      teamId: args.teamId,
    });

    // 2. Build tools
    const tools = buildTools(ctx, args.teamId);

    // 3. Initialize Claude
    const client = new Anthropic();

    // 4. Run conversation loop
    let messages: Anthropic.MessageParam[] = [
      { role: "user", content: args.message },
    ];

    while (true) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: buildSystemPrompt(context),
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
        messages,
      });

      // Check for tool use
      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (!toolUse) {
        // No tool use - return text response
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === "text"
        );
        return textBlock?.text ?? "";
      }

      // Execute tool
      const tool = tools.find((t) => t.name === toolUse.name);
      if (!tool) {
        throw new Error(`Unknown tool: ${toolUse.name}`);
      }

      const result = await tool.execute(toolUse.input);

      // Add to messages and continue
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          },
        ],
      });
    }
  },
});

function buildSystemPrompt(context: TeamContext): string {
  return `You are GLaDOS, the AI assistant for BuildSeason robotics team management.

Current team: ${context.team.name} (#${context.team.number})
Season: ${context.season?.name ?? "No active season"}

Inventory Summary:
- Total parts: ${context.inventorySummary.totalParts}
- Low stock items: ${context.inventorySummary.lowStockCount}

Pending orders: ${context.pendingOrders.length}

You help teams manage their robotics season. Be concise and helpful.`;
}
```

## Tool Builder Pattern

Tools wrap Convex queries and mutations:

```typescript
// convex/agent/tools/index.ts
import { ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { buildPartsTools } from "./parts";
import { buildOrderTools } from "./orders";

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (input: unknown) => Promise<unknown>;
}

export function buildTools(ctx: ActionCtx, teamId: Id<"teams">): AgentTool[] {
  return [...buildPartsTools(ctx, teamId), ...buildOrderTools(ctx, teamId)];
}
```

```typescript
// convex/agent/tools/parts.ts
import { ActionCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { AgentTool } from "./index";

export function buildPartsTools(
  ctx: ActionCtx,
  teamId: Id<"teams">
): AgentTool[] {
  return [
    {
      name: "get_parts_inventory",
      description:
        "Get current parts inventory. Can filter by 'low_stock' or subsystem name.",
      input_schema: {
        type: "object" as const,
        properties: {
          filter: {
            type: "string",
            description: "Filter: 'low_stock', 'all', or subsystem name",
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
      description: "Update quantity of a part in inventory",
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

Load team state before agent runs:

```typescript
// convex/agent/context.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const loadTeamContext = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Load inventory
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const lowStockParts = parts.filter((p) => p.quantity <= p.reorderPoint);

    // Load pending orders
    const pendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Load season
    const season = team.activeSeasonId
      ? await ctx.db.get(team.activeSeasonId)
      : null;

    return {
      team,
      season,
      inventorySummary: {
        totalParts: parts.length,
        lowStockCount: lowStockParts.length,
        lowStockParts: lowStockParts.slice(0, 10).map((p) => ({
          id: p._id,
          name: p.name,
          quantity: p.quantity,
          reorderPoint: p.reorderPoint,
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

export type TeamContext = Awaited<ReturnType<typeof loadTeamContext.handler>>;
```

## Discord Webhook Handler

HTTP endpoint for Discord:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Discord webhook
http.route({
  path: "/discord/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get headers
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    // Verify signature (implement verifyDiscordSignature)
    if (!(await verifyDiscordSignature(signature, timestamp, body))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle Discord ping (required for webhook setup)
    if (payload.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle slash command
    if (payload.type === 2) {
      // Defer response for long-running operation
      // In practice, use interaction callbacks

      const response = await ctx.runAction(
        internal.agent.handler.handleMessage,
        {
          message: extractMessage(payload),
          teamId: extractTeamId(payload),
          userId: payload.member.user.id,
          channelId: payload.channel_id,
        }
      );

      return new Response(
        JSON.stringify({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
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

Proactive checks with scheduled functions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check inventory every hour
crons.interval(
  "check-inventory",
  { hours: 1 },
  internal.agent.monitoring.checkInventory
);

// Daily order status check
crons.daily(
  "check-orders",
  { hourUTC: 14, minuteUTC: 0 },
  internal.agent.monitoring.checkOrders
);

export default crons;
```

```typescript
// convex/agent/monitoring.ts
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const checkInventory = internalAction({
  handler: async (ctx) => {
    const teams = await ctx.runQuery(internal.teams.listAll);

    for (const team of teams) {
      const context = await ctx.runQuery(
        internal.agent.context.loadTeamContext,
        { teamId: team._id }
      );

      if (context.inventorySummary.lowStockCount > 0) {
        // Compose alert message
        const message = await composeAlert(ctx, context);

        // Send to Discord
        await ctx.runAction(internal.discord.sendMessage, {
          teamId: team._id,
          message,
        });
      }
    }
  },
});
```

## Internal Functions

Use internal functions for agent tools (not exposed to frontend):

```typescript
// convex/parts.ts
import { internalQuery, internalMutation } from "./_generated/server";

// For agent use
export const getForAgent = internalQuery({
  args: {
    teamId: v.id("teams"),
    filter: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, filter }) => {
    let query = ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId));

    const parts = await query.collect();

    if (filter === "low_stock") {
      return parts.filter((p) => p.quantity <= p.reorderPoint);
    }

    return parts;
  },
});

export const updateQuantity = internalMutation({
  args: {
    partId: v.id("parts"),
    quantity: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { partId, quantity, reason }) => {
    await ctx.db.patch(partId, { quantity });
    // Optionally log the change with reason
    return { success: true };
  },
});
```

## Directory Structure

```
convex/
├── agent/
│   ├── handler.ts        # Main agent action
│   ├── context.ts        # Context loader
│   ├── monitoring.ts     # Scheduled checks
│   └── tools/
│       ├── index.ts      # Tool builder
│       ├── parts.ts      # Parts tools
│       ├── orders.ts     # Order tools
│       └── bom.ts        # BOM tools
├── http.ts               # HTTP endpoints
├── crons.ts              # Scheduled jobs
├── schema.ts             # Database schema
└── [domain].ts           # Domain functions
```

## Testing Agent Tools

```typescript
// convex/agent/tools/parts.test.ts
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../schema";

describe("parts tools", () => {
  it("get_parts_inventory returns low stock items", async () => {
    const t = convexTest(schema);

    // Setup test data
    const teamId = await t.run(async (ctx) => {
      return ctx.db.insert("teams", {
        name: "Test",
        number: "1234",
        program: "ftc",
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("parts", {
        teamId,
        name: "Bolt",
        quantity: 2,
        reorderPoint: 10,
      });
    });

    // Test the query
    const result = await t.query(internal.parts.getForAgent, {
      teamId,
      filter: "low_stock",
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bolt");
  });
});
```
