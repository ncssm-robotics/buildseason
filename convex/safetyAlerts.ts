import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireRole } from "./lib/permissions";

/**
 * Create a safety alert - called from agent when concerning content detected
 * This is an internal mutation so it can be called from actions
 */
export const create = internalMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.optional(v.string()),
    alertType: v.string(), // "crisis", "escalation", "review"
    severity: v.string(), // "high", "medium", "low"
    triggerReason: v.string(),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert("safetyAlerts", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return alertId;
  },
});

/**
 * List alerts for a team - mentors only
 * Returns most recent alerts first
 */
export const listByTeam = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()), // Filter by status
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { teamId, status, limit = 50 }) => {
    // Only mentors can view safety alerts
    await requireRole(ctx, teamId, "mentor");

    const query = ctx.db
      .query("safetyAlerts")
      .withIndex("by_team_status", (q) => {
        const base = q.eq("teamId", teamId);
        if (status) {
          return base.eq("status", status);
        }
        return base;
      })
      .order("desc");

    const alerts = await query.take(limit);
    return alerts;
  },
});

/**
 * Get pending alerts count for a team - useful for badge/notification
 */
export const getPendingCount = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    // Only mentors can view safety alerts
    await requireRole(ctx, teamId, "mentor");

    const pendingAlerts = await ctx.db
      .query("safetyAlerts")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", teamId).eq("status", "pending")
      )
      .collect();

    return pendingAlerts.length;
  },
});

/**
 * Get a single alert by ID - mentors only
 */
export const get = query({
  args: {
    alertId: v.id("safetyAlerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      return null;
    }

    // Check permission
    await requireRole(ctx, alert.teamId, "mentor");

    return alert;
  },
});

/**
 * Mark an alert as reviewed - mentor has seen it
 */
export const markReviewed = mutation({
  args: {
    alertId: v.id("safetyAlerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Check permission
    const { user } = await requireRole(ctx, alert.teamId, "mentor");

    await ctx.db.patch(alertId, {
      status: "reviewed",
      reviewedBy: user._id,
    });

    return alertId;
  },
});

/**
 * Resolve an alert with optional notes
 */
export const resolve = mutation({
  args: {
    alertId: v.id("safetyAlerts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { alertId, notes }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Check permission
    const { user } = await requireRole(ctx, alert.teamId, "mentor");

    await ctx.db.patch(alertId, {
      status: "resolved",
      reviewedBy: user._id,
      reviewNotes: notes,
    });

    return alertId;
  },
});

/**
 * Get related audit logs for an alert (for context)
 */
export const getRelatedLogs = query({
  args: {
    alertId: v.id("safetyAlerts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { alertId, limit = 10 }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      return [];
    }

    // Check permission
    await requireRole(ctx, alert.teamId, "mentor");

    // Get recent audit logs for this user on this team
    const logs = await ctx.db
      .query("agentAuditLogs")
      .withIndex("by_team_user", (q) =>
        q.eq("teamId", alert.teamId).eq("userId", alert.userId)
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Get alert statistics for a team
 */
export const getStats = query({
  args: {
    teamId: v.id("teams"),
    since: v.optional(v.number()), // Unix timestamp
  },
  handler: async (ctx, { teamId, since }) => {
    await requireRole(ctx, teamId, "mentor");

    let query = ctx.db
      .query("safetyAlerts")
      .withIndex("by_team_status", (q) => q.eq("teamId", teamId));

    if (since) {
      query = query.filter((q) => q.gte(q.field("createdAt"), since));
    }

    const alerts = await query.collect();

    const pending = alerts.filter((a) => a.status === "pending").length;
    const reviewed = alerts.filter((a) => a.status === "reviewed").length;
    const resolved = alerts.filter((a) => a.status === "resolved").length;

    const bySeverity = {
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
      low: alerts.filter((a) => a.severity === "low").length,
    };

    const byType = {
      crisis: alerts.filter((a) => a.alertType === "crisis").length,
      escalation: alerts.filter((a) => a.alertType === "escalation").length,
      review: alerts.filter((a) => a.alertType === "review").length,
    };

    return {
      total: alerts.length,
      pending,
      reviewed,
      resolved,
      bySeverity,
      byType,
    };
  },
});
