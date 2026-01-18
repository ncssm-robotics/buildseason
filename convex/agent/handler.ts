import Anthropic from "@anthropic-ai/sdk";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildTools, executeToolCall } from "./tools";
import { buildSystemPrompt } from "./prompts";

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

    // Build system prompt with team context and YPP guardrails
    const systemPrompt = buildSystemPrompt(
      { ...context, userName: args.userName },
      {} // SafetyContext - will be populated by pre-screening later
    );

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
