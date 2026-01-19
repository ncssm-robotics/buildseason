import Anthropic from "@anthropic-ai/sdk";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildTools, executeToolCall } from "./tools";
import { buildSystemPrompt } from "./prompts";
import { prescreenMessage, RISK_LEVELS } from "./moderation";

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
    const channelId = args.channelId || "dm";

    // 1. Pre-screen message for YPP compliance
    const screening = await prescreenMessage(args.message);
    const behavior = screening.behavior;

    // If message should be blocked, return neutral response and escalate
    if (behavior.shouldBlock) {
      // Create safety alert for mentors
      await ctx.runMutation(internal.agent.mutations.safety.createAlert, {
        teamId: args.teamId,
        userId: args.userId,
        channelId: args.channelId,
        severity: "high",
        triggerReason:
          screening.classification.reasoning ||
          "Content blocked by pre-screening",
        messageContent: args.message,
      });

      // Log the blocked interaction
      await ctx.runMutation(internal.agent.auditLog.log, {
        teamId: args.teamId,
        userId: args.userId,
        channelId: args.channelId,
        userMessage: args.message,
        agentResponse: behavior.neutralResponse || "",
        containsSafetyAlert: true,
      });

      return (
        behavior.neutralResponse ||
        "I want to make sure you get the right support. Let me check with one of your mentors."
      );
    }

    // If message should alert mentor (but still proceed), create alert
    if (behavior.shouldAlertMentor) {
      await ctx.runMutation(internal.agent.mutations.safety.createAlert, {
        teamId: args.teamId,
        userId: args.userId,
        channelId: args.channelId,
        severity: "medium",
        triggerReason:
          screening.classification.reasoning ||
          "Content flagged during pre-screening",
        messageContent: args.message,
      });
    }

    // 2. Load team context for agent awareness
    const context = await ctx.runQuery(internal.agent.context.loadTeamContext, {
      teamId: args.teamId,
    });

    if (!context.team) {
      return "I couldn't find that team. Please make sure you're messaging from a registered team channel.";
    }

    // 2b. Load user's other teams for multi-team awareness
    const userTeams = await ctx.runQuery(internal.agent.context.loadUserTeams, {
      discordUserId: args.userId,
      currentTeamId: args.teamId,
    });

    // 3. Load conversation history for multi-turn context
    const history = await ctx.runQuery(internal.agent.conversation.getRecent, {
      teamId: args.teamId,
      channelId,
      limit: 10,
    });

    // Build tools available to the agent
    // Include native web search as a server tool
    const customTools = buildTools();
    // Server tools like web_search have a different schema than regular tools
    const webSearchTool = {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5,
    };
    const tools = [...customTools, webSearchTool] as Anthropic.Messages.Tool[];

    // Build system prompt with team context and safety context
    const systemPrompt = buildSystemPrompt(
      { ...context, userName: args.userName, userTeams },
      {
        seriousMode:
          screening.classification.riskLevel >= RISK_LEVELS.FLAG_ONLY,
      }
    );

    // Build messages array with history
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: "user", content: args.message });

    // 4. Agent loop - process until we get a final response
    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    // Track tool calls for audit logging
    const toolCallLog: Array<{
      name: string;
      input: string;
      output?: string;
      error?: string;
    }> = [];

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
          try {
            const result = await executeToolCall(
              ctx,
              args.teamId,
              block.name,
              block.input as Record<string, unknown>,
              args.userId,
              args.channelId
            );
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
            toolCallLog.push({
              name: block.name,
              input: JSON.stringify(block.input),
              output: JSON.stringify(result),
            });
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ error: errorMsg }),
              is_error: true,
            });
            toolCallLog.push({
              name: block.name,
              input: JSON.stringify(block.input),
              error: errorMsg,
            });
          }
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
    // Join with empty string since web search citations split text into fragments
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const responseText = textBlocks.map((block) => block.text).join("");

    // 5. Save conversation history
    // Wrap in try/catch to ensure response is returned even if persistence fails
    try {
      await ctx.runMutation(internal.agent.conversation.append, {
        teamId: args.teamId,
        channelId,
        userId: args.userId,
        messages: [
          { role: "user", content: args.message, timestamp: Date.now() },
          { role: "assistant", content: responseText, timestamp: Date.now() },
        ],
      });
    } catch (error) {
      console.error("Failed to save conversation history:", error);
      // Continue - don't fail the response due to persistence issues
    }

    // 6. Log for audit (if needed based on risk level)
    // Also wrapped in try/catch - audit failures shouldn't block responses
    if (behavior.shouldLog || toolCallLog.length > 0) {
      try {
        await ctx.runMutation(internal.agent.auditLog.log, {
          teamId: args.teamId,
          userId: args.userId,
          channelId: args.channelId,
          userMessage: args.message,
          agentResponse: responseText,
          toolCalls: toolCallLog.length > 0 ? toolCallLog : undefined,
          containsSafetyAlert: behavior.shouldAlertMentor,
        });
      } catch (error) {
        console.error("Failed to write audit log:", error);
        // Continue - audit failures shouldn't block responses
      }
    }

    return responseText;
  },
});
