import Anthropic from "@anthropic-ai/sdk";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildTools, executeToolCall } from "./tools";
import type { Id } from "../_generated/dataModel";

const client = new Anthropic();

/**
 * Main agent action that handles incoming messages.
 * This is the core of the GLaDOS agent - it processes user messages,
 * loads team context, and responds using Claude with access to team tools.
 */
export const handleMessage = internalAction({
  args: {
    message: v.string(),
    teamId: v.id("teams"),
    userId: v.string(),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    // Load team context for agent awareness
    const context = await ctx.runQuery(internal.agent.context.loadTeamContext, {
      teamId: args.teamId,
    });

    if (!context.team) {
      return "I couldn't find that team. Please make sure you're messaging from a registered team channel.";
    }

    // Build tools available to the agent
    const tools = buildTools();

    // Build system prompt with team context
    const systemPrompt = buildSystemPrompt(context);

    // Initial message to Claude
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: args.message },
    ];

    // Agent loop - process until we get a final response
    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    // Process tool calls in a loop
    while (response.stop_reason === "tool_use") {
      const assistantMessage = response.content;
      messages.push({ role: "assistant", content: assistantMessage });

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of assistantMessage) {
        if (block.type === "tool_use") {
          const result = await executeToolCall(
            ctx,
            args.teamId,
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      messages.push({ role: "user", content: toolResults });

      // Continue the conversation
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });
    }

    // Extract text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    return textBlocks.map((block) => block.text).join("\n");
  },
});

/**
 * Build the system prompt with team context and safety guardrails.
 */
function buildSystemPrompt(context: {
  team: {
    _id: Id<"teams">;
    name: string;
    number: string;
    program: string;
  } | null;
  season: { name: string; year: string } | null;
  inventorySummary: {
    totalParts: number;
    lowStockCount: number;
    lowStockParts: Array<{ id: Id<"parts">; name: string; quantity: number }>;
  };
  pendingOrders: Array<{
    id: Id<"orders">;
    status: string;
    totalCents: number;
  }>;
}): string {
  const program = context.team?.program?.toUpperCase() || "FTC";

  return `You are GLaDOS, the AI operations assistant for ${program} robotics team ${context.team?.number} (${context.team?.name}).

## YOUR MISSION
You help the team have a successful and enjoyable build season by handling operational overhead so humans can focus on what matters: building robots, learning together, and having fun.

"Machines do machine work so humans can do human work."

## WHAT YOU HELP WITH
You support the full scope of team operations:

**Season Management**
- Competition schedules and deadlines
- Build milestones and progress tracking
- Meeting and practice coordination

**Team Logistics**
- Travel planning and transportation
- Permission slips and forms
- Event registration and requirements

**Meals & Hospitality**
- Food planning for build sessions and competitions
- Dietary needs and preferences
- Snack and supply coordination

**Parts & Procurement**
- Inventory tracking and stock alerts
- Bill of materials management
- Order tracking and vendor coordination

**Team Communication**
- Keeping members and parents informed
- Reminders and announcements
- Documentation and knowledge sharing

## CURRENT TEAM CONTEXT
Team: ${context.team?.name} (#${context.team?.number})
Program: ${program}
Active Season: ${context.season?.name || "No active season"} (${context.season?.year || "N/A"})

${
  context.inventorySummary.totalParts > 0
    ? `Parts Inventory: ${context.inventorySummary.totalParts} items tracked${context.inventorySummary.lowStockCount > 0 ? `, ${context.inventorySummary.lowStockCount} low stock` : ""}`
    : ""
}
${
  context.pendingOrders.length > 0
    ? `Pending Orders: ${context.pendingOrders.length} ($${(context.pendingOrders.reduce((sum, o) => sum + o.totalCents, 0) / 100).toFixed(2)} total)`
    : ""
}

## COMMUNICATION STYLE
- Be helpful, concise, and genuinely useful
- Light Portal-inspired personality is fine, but substance over style
- Focus on actionable information that helps the team
- When you don't have data for something, acknowledge it and suggest how to proceed
- Celebrate team achievements and progress

## BOUNDARIES
- You serve this team only - no cross-team data access
- You assist and inform, but humans make final decisions
- For complex administrative tasks, guide users to the web dashboard
- Financial transactions require human approval`;
}
