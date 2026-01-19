import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Audit log mutation for YPP compliance.
 * Creates an append-only log of agent interactions.
 */
export const log = internalMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
    channelId: v.optional(v.string()),
    userMessage: v.string(),
    agentResponse: v.string(),
    toolCalls: v.optional(
      v.array(
        v.object({
          name: v.string(),
          input: v.string(),
          output: v.optional(v.string()),
          error: v.optional(v.string()),
        })
      )
    ),
    containsSafetyAlert: v.optional(v.boolean()),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentAuditLogs", {
      teamId: args.teamId,
      userId: args.userId,
      channelId: args.channelId,
      timestamp: Date.now(),
      userMessage: args.userMessage,
      agentResponse: args.agentResponse,
      toolCalls: args.toolCalls,
      containsSafetyAlert: args.containsSafetyAlert,
      messageType: args.messageType,
    });
  },
});
