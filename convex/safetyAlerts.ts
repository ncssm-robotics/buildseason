import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { requireRole } from "./lib/permissions";

// Generate a secure random token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

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

// ============================================================================
// MENTOR ACKNOWLEDGMENT TRACKING
// ============================================================================

const ACK_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const ESCALATION_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create an acknowledgment token for a mentor DM link
 * Called when sending a safety alert DM to a mentor
 */
export const createAckToken = internalMutation({
  args: {
    alertId: v.id("safetyAlerts"),
    mentorDiscordId: v.string(),
  },
  handler: async (ctx, { alertId, mentorDiscordId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    const token = generateToken();
    const tokenId = await ctx.db.insert("alertAckTokens", {
      token,
      alertId,
      teamId: alert.teamId,
      mentorDiscordId,
      expiresAt: Date.now() + ACK_TOKEN_EXPIRY_MS,
    });

    // Update alert with notified mentor
    await ctx.db.patch(alertId, {
      notifiedMentorId: mentorDiscordId,
    });

    return { tokenId, token };
  },
});

/**
 * Get alert by acknowledgment token (for link validation)
 */
export const getByAckToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const tokenDoc = await ctx.db
      .query("alertAckTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!tokenDoc) {
      return { error: "invalid_token", alert: null };
    }

    if (tokenDoc.expiresAt < Date.now()) {
      return { error: "expired_token", alert: null };
    }

    if (tokenDoc.usedAt) {
      return { error: "already_used", alert: null };
    }

    const alert = await ctx.db.get(tokenDoc.alertId);
    if (!alert) {
      return { error: "alert_not_found", alert: null };
    }

    return {
      error: null,
      alert,
      teamId: tokenDoc.teamId,
    };
  },
});

/**
 * Acknowledge an alert via token link click
 * This is a public mutation (no auth required - token is auth)
 */
export const acknowledgeByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const tokenDoc = await ctx.db
      .query("alertAckTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!tokenDoc) {
      throw new Error("Invalid or expired token");
    }

    if (tokenDoc.expiresAt < Date.now()) {
      throw new Error("Token has expired");
    }

    if (tokenDoc.usedAt) {
      // Already acknowledged - just return success
      return { alertId: tokenDoc.alertId, teamId: tokenDoc.teamId };
    }

    const alert = await ctx.db.get(tokenDoc.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Mark token as used
    await ctx.db.patch(tokenDoc._id, {
      usedAt: Date.now(),
    });

    // Update alert with acknowledgment (only if not already acked)
    if (!alert.ackAt) {
      await ctx.db.patch(tokenDoc.alertId, {
        ackMethod: "link",
        ackAt: Date.now(),
        ackBy: tokenDoc.mentorDiscordId,
        status: alert.status === "pending" ? "reviewed" : alert.status,
      });
    }

    return { alertId: tokenDoc.alertId, teamId: tokenDoc.teamId };
  },
});

/**
 * Acknowledge an alert via Discord interaction (emoji or reply)
 * Called from Discord bot when mentor reacts/replies to alert DM
 */
export const acknowledgeByDiscord = internalMutation({
  args: {
    alertId: v.id("safetyAlerts"),
    mentorDiscordId: v.string(),
    method: v.string(), // "emoji" or "reply"
  },
  handler: async (ctx, { alertId, mentorDiscordId, method }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Only update if not already acknowledged
    if (!alert.ackAt) {
      await ctx.db.patch(alertId, {
        ackMethod: method,
        ackAt: Date.now(),
        ackBy: mentorDiscordId,
        status: alert.status === "pending" ? "reviewed" : alert.status,
      });
    }

    return alertId;
  },
});

/**
 * Get unacknowledged alerts that need escalation
 * Called by scheduled function to check for alerts past threshold
 */
export const getUnackedAlerts = internalQuery({
  args: {
    thresholdMs: v.optional(v.number()),
  },
  handler: async (ctx, { thresholdMs = ESCALATION_THRESHOLD_MS }) => {
    const cutoff = Date.now() - thresholdMs;

    // Get pending alerts that were created before cutoff and have no ack
    // Note: We scan all alerts since we need to filter by status without teamId
    const alerts = await ctx.db
      .query("safetyAlerts")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lt(q.field("createdAt"), cutoff),
          q.eq(q.field("ackAt"), undefined)
        )
      )
      .collect();

    return alerts;
  },
});

/**
 * Escalate an unacknowledged alert
 * Increments escalation count and triggers re-notification
 */
export const escalate = internalMutation({
  args: {
    alertId: v.id("safetyAlerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    const currentCount = alert.escalationCount ?? 0;

    await ctx.db.patch(alertId, {
      escalatedAt: Date.now(),
      escalationCount: currentCount + 1,
    });

    return {
      alertId,
      teamId: alert.teamId,
      escalationCount: currentCount + 1,
      severity: alert.severity,
    };
  },
});

/**
 * Get alerts needing escalation for a team
 */
export const getEscalationQueue = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    await requireRole(ctx, teamId, "mentor");

    const alerts = await ctx.db
      .query("safetyAlerts")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", teamId).eq("status", "pending")
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("ackAt"), undefined),
          q.gt(q.field("escalationCount") ?? 0, 0)
        )
      )
      .collect();

    return alerts;
  },
});
