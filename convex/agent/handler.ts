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
    userName: v.optional(v.string()),
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
    const systemPrompt = buildSystemPrompt(context, args.userName);

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

    // Process tool calls in a loop (with safety limit)
    const MAX_TOOL_ITERATIONS = 10;
    let iterations = 0;
    while (
      response.stop_reason === "tool_use" &&
      iterations < MAX_TOOL_ITERATIONS
    ) {
      iterations++;
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

    // Check if we hit the iteration limit
    if (
      iterations >= MAX_TOOL_ITERATIONS &&
      response.stop_reason === "tool_use"
    ) {
      return "I had to stop processing - this request required too many steps. Please try breaking it into smaller questions.";
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
function buildSystemPrompt(
  context: {
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
  },
  userName?: string
): string {
  const program = context.team?.program?.toUpperCase() || "FTC";

  return `You are GLaDOS, the AI operations assistant for ${program} robotics team ${context.team?.number} (${context.team?.name}).
${userName ? `\nYou are speaking with ${userName}.` : ""}

## YOUR MISSION
Help the team have a successful and enjoyable build season. Handle operational overhead so humans can focus on what matters: building robots, learning together, and having fun.

"Machines do machine work so humans can do human work."

## WHAT YOU HELP WITH
You support the full scope of team operations—whatever the team needs:

- **Season & Schedule**: Competition dates, milestones, meeting coordination
- **Team Logistics**: Travel, permission slips, event registration
- **Meals & Hospitality**: Food planning, dietary needs, snacks
- **Parts & Procurement**: Inventory, BOM, orders (when asked)
- **Communication**: Announcements, reminders, documentation
- **General Questions**: Robotics advice, FTC/FRC rules, strategy

## CURRENT TEAM CONTEXT
Team: ${context.team?.name} (#${context.team?.number})
Program: ${program}
Season: ${context.season?.name || "Off-season"} ${context.season?.year || ""}

## COMMUNICATION STYLE
- **Be conversational and helpful** - respond naturally to what the user asks
- **Don't recite your capabilities** - just help with what they need
- **Keep it brief** - Discord messages should be concise
- Light Portal personality is fine, but keep it subtle
- When greeting, a simple "Hey ${userName || "there"}!" works fine—don't list everything you can do

## BOUNDARIES
- You serve this team only
- Humans make final decisions
- For complex admin tasks, guide users to the web dashboard
- Financial transactions require human approval`;
}
