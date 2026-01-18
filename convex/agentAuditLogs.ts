import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireRole } from "./lib/permissions";

// Tool call schema for validation
const toolCallValidator = v.object({
  name: v.string(),
  input: v.string(),
  output: v.optional(v.string()),
  error: v.optional(v.string()),
});

/**
 * Log an agent interaction - append-only, called from agent handler
 * This is an internal mutation so it can be called from actions without auth
 */
export const log = internalMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.optional(v.string()),
    userMessage: v.string(),
    agentResponse: v.string(),
    toolCalls: v.optional(v.array(toolCallValidator)),
    containsSafetyAlert: v.optional(v.boolean()),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("agentAuditLogs", {
      ...args,
      timestamp: Date.now(),
    });
    return logId;
  },
});

/**
 * List audit logs for a team - mentors only
 * Returns most recent logs first
 */
export const listByTeam = query({
  args: {
    teamId: v.id("teams"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { teamId, limit = 100 }) => {
    // Only mentors can view audit logs
    await requireRole(ctx, teamId, "mentor");

    const logs = await ctx.db
      .query("agentAuditLogs")
      .withIndex("by_team_timestamp", (q) => q.eq("teamId", teamId))
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * List audit logs for a specific user on a team - mentors only
 */
export const listByTeamUser = query({
  args: {
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { teamId, userId, limit = 100 }) => {
    // Only mentors can view audit logs
    await requireRole(ctx, teamId, "mentor");

    const logs = await ctx.db
      .query("agentAuditLogs")
      .withIndex("by_team_user", (q) =>
        q.eq("teamId", teamId).eq("userId", userId)
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Get logs with safety alerts for a team - mentors only
 * Useful for compliance review
 */
export const listSafetyAlerts = query({
  args: {
    teamId: v.id("teams"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { teamId, limit = 50 }) => {
    // Only mentors can view audit logs
    await requireRole(ctx, teamId, "mentor");

    const logs = await ctx.db
      .query("agentAuditLogs")
      .withIndex("by_team_timestamp", (q) => q.eq("teamId", teamId))
      .order("desc")
      .filter((q) => q.eq(q.field("containsSafetyAlert"), true))
      .take(limit);

    return logs;
  },
});

/**
 * Get a single audit log entry by ID - mentors only
 */
export const get = query({
  args: {
    logId: v.id("agentAuditLogs"),
  },
  handler: async (ctx, { logId }) => {
    const log = await ctx.db.get(logId);
    if (!log) {
      return null;
    }

    // Check permission
    await requireRole(ctx, log.teamId, "mentor");

    return log;
  },
});

/**
 * Count logs for a team in a time range - useful for dashboard
 */
export const countByTeam = query({
  args: {
    teamId: v.id("teams"),
    since: v.optional(v.number()), // Unix timestamp
  },
  handler: async (ctx, { teamId, since }) => {
    // Only mentors can view audit logs
    await requireRole(ctx, teamId, "mentor");

    let logsQuery = ctx.db
      .query("agentAuditLogs")
      .withIndex("by_team_timestamp", (q) => q.eq("teamId", teamId));

    if (since) {
      logsQuery = logsQuery.filter((q) => q.gte(q.field("timestamp"), since));
    }

    const logs = await logsQuery.collect();

    return {
      total: logs.length,
      withSafetyAlerts: logs.filter((l) => l.containsSafetyAlert).length,
      uniqueUsers: new Set(logs.map((l) => l.userId)).size,
    };
  },
});
