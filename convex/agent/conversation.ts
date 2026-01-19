import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Conversation memory module for multi-turn agent interactions.
 * Stores and retrieves conversation history scoped to team + channel.
 */

/**
 * Get recent conversation history for a channel.
 * Returns the last N messages to provide context to the agent.
 */
export const getRecent = internalQuery({
  args: {
    teamId: v.id("teams"),
    channelId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_team_channel", (q) =>
        q.eq("teamId", args.teamId).eq("channelId", args.channelId)
      )
      .first();

    if (!conversation) {
      return [];
    }

    // Return the most recent messages, up to the limit
    const messages = conversation.messages || [];
    return messages.slice(-limit);
  },
});

/**
 * Append messages to a conversation.
 * Creates the conversation if it doesn't exist.
 */
export const append = internalMutation({
  args: {
    teamId: v.id("teams"),
    channelId: v.string(),
    userId: v.string(),
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_team_channel", (q) =>
        q.eq("teamId", args.teamId).eq("channelId", args.channelId)
      )
      .first();

    if (existing) {
      // Append to existing conversation
      const updatedMessages = [...existing.messages, ...args.messages];

      // Keep only the last 50 messages to prevent unbounded growth
      const MAX_MESSAGES = 50;
      const trimmedMessages = updatedMessages.slice(-MAX_MESSAGES);

      await ctx.db.patch(existing._id, {
        messages: trimmedMessages,
        lastActivity: Date.now(),
      });
    } else {
      // Create new conversation
      await ctx.db.insert("conversations", {
        teamId: args.teamId,
        channelId: args.channelId,
        userId: args.userId,
        messages: args.messages,
        lastActivity: Date.now(),
      });
    }
  },
});

/**
 * Clear conversation history for a channel.
 * Useful for "forget" or "reset" commands.
 */
export const clear = internalMutation({
  args: {
    teamId: v.id("teams"),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_team_channel", (q) =>
        q.eq("teamId", args.teamId).eq("channelId", args.channelId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { cleared: true };
    }

    return { cleared: false, message: "No conversation history found" };
  },
});

/**
 * Cleanup old conversations.
 * Can be called periodically to remove stale conversations.
 * Limits deletions per invocation to prevent timeout issues.
 */
export const cleanupStale = internalMutation({
  args: {
    maxAgeMs: v.optional(v.number()),
    maxDeletePerRun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Default to 7 days
    const maxAge = args.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    // Limit deletions per run to prevent timeout (default 100)
    const limit = args.maxDeletePerRun ?? 100;

    const staleConversations = await ctx.db
      .query("conversations")
      .withIndex("by_last_activity", (q) => q.lt("lastActivity", cutoff))
      .take(limit);

    for (const conv of staleConversations) {
      await ctx.db.delete(conv._id);
    }

    return {
      deleted: staleConversations.length,
      hasMore: staleConversations.length === limit,
    };
  },
});
