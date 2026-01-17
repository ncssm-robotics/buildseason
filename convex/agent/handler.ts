import Anthropic from "@anthropic-ai/sdk";
import { action } from "../_generated/server";
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
export const handleMessage = action({
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
  return `You are GLaDOS, an AI assistant for FTC robotics team ${context.team?.number} (${context.team?.name}).

## YOUR ROLE
You help the team manage their robotics season by:
- Tracking parts inventory and alerting on low stock
- Managing the bill of materials (BOM)
- Helping with order management and procurement
- Answering questions about team operations

## CURRENT TEAM CONTEXT
Team: ${context.team?.name} (#${context.team?.number})
Program: ${context.team?.program?.toUpperCase()}
Active Season: ${context.season?.name || "No active season"} (${context.season?.year || "N/A"})

Inventory Summary:
- Total parts tracked: ${context.inventorySummary.totalParts}
- Low stock items: ${context.inventorySummary.lowStockCount}
${
  context.inventorySummary.lowStockCount > 0
    ? `- Items needing attention: ${context.inventorySummary.lowStockParts.map((p) => `${p.name} (${p.quantity} remaining)`).join(", ")}`
    : ""
}

Pending Orders: ${context.pendingOrders.length}
${
  context.pendingOrders.length > 0
    ? `- Total pending value: $${(context.pendingOrders.reduce((sum, o) => sum + o.totalCents, 0) / 100).toFixed(2)}`
    : ""
}

## COMMUNICATION STYLE
- Be helpful, concise, and professional
- Use a slightly playful tone inspired by the Portal game character, but stay professional
- Focus on actionable information
- When presenting data, format it clearly

## LIMITATIONS
- You can only access information for this team
- You cannot make purchases or approve orders directly
- For complex requests, suggest the user check the web dashboard`;
}
