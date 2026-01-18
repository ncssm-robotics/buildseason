import { internalMutation, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

/**
 * Create a safety alert and notify YPP contacts via Discord DM.
 *
 * This mutation:
 * 1. Creates a safetyAlert record
 * 2. Looks up the team's YPP contacts
 * 3. Sends a Discord DM to each contact (via scheduled action)
 * 4. Creates tracking tokens for acknowledgment
 */
export const createAlert = internalMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.optional(v.string()),
    severity: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    triggerReason: v.string(),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the safety alert record
    const alertId = await ctx.db.insert("safetyAlerts", {
      teamId: args.teamId,
      userId: args.userId,
      channelId: args.channelId,
      alertType: "escalation",
      severity: args.severity,
      triggerReason: args.triggerReason,
      messageContent: args.messageContent,
      status: "pending",
      createdAt: Date.now(),
    });

    // Get team info for context
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { alertId, notified: 0 };
    }

    // Get YPP contacts for the team
    const yppContacts = team.yppContacts || [];
    if (yppContacts.length === 0) {
      console.warn(`No YPP contacts configured for team ${args.teamId}`);
      return { alertId, notified: 0 };
    }

    // Look up Discord info for each YPP contact
    const contactsToNotify: Array<{
      userId: string;
      discordUserId: string;
      name: string;
    }> = [];

    for (const contactUserId of yppContacts) {
      const discordLink = await ctx.db
        .query("discordLinks")
        .withIndex("by_user", (q) => q.eq("userId", contactUserId))
        .first();

      if (discordLink?.discordUserId) {
        const user = await ctx.db.get(contactUserId);
        contactsToNotify.push({
          userId: contactUserId as string,
          discordUserId: discordLink.discordUserId,
          name: user?.name || "Mentor",
        });
      }
    }

    if (contactsToNotify.length === 0) {
      console.warn(
        `No YPP contacts with Discord linked for team ${args.teamId}`
      );
      return { alertId, notified: 0 };
    }

    // Schedule DM sending for each contact
    for (const contact of contactsToNotify) {
      // Create tracking token for acknowledgment using the correct table
      const tokenString = `alert-${alertId}-${Date.now()}-${crypto.randomUUID().replace(/-/g, "")}`;
      await ctx.db.insert("alertAckTokens", {
        token: tokenString,
        alertId,
        teamId: args.teamId,
        mentorDiscordId: contact.discordUserId,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Schedule the DM action
      await ctx.scheduler.runAfter(
        0,
        internal.agent.mutations.safety.sendAlertDM,
        {
          discordUserId: contact.discordUserId,
          mentorName: contact.name,
          teamName: team.name,
          teamNumber: team.number,
          severity: args.severity,
          triggerReason: args.triggerReason,
          alertId,
          trackingToken: tokenString,
        }
      );
    }

    return {
      alertId,
      notified: contactsToNotify.length,
    };
  },
});

/**
 * Send a Discord DM to a YPP contact about an alert.
 * This is an action so it can make external HTTP calls to Discord's API.
 */
export const sendAlertDM = internalAction({
  args: {
    discordUserId: v.string(),
    mentorName: v.string(),
    teamName: v.string(),
    teamNumber: v.string(),
    severity: v.string(),
    triggerReason: v.string(),
    alertId: v.id("safetyAlerts"),
    trackingToken: v.string(),
  },
  handler: async (_ctx, args) => {
    // Build the DM content
    const severityEmoji =
      args.severity === "high"
        ? "🚨"
        : args.severity === "medium"
          ? "⚠️"
          : "📋";

    const message = `${severityEmoji} **YPP Alert - Team ${args.teamNumber}**

Hi ${args.mentorName},

GLaDOS has flagged a concerning interaction that needs your attention.

**Severity:** ${args.severity.toUpperCase()}
**Reason:** ${args.triggerReason}

**How to acknowledge:**
• React to this message with ✅
• Reply to this DM
• Or visit: ${process.env.SITE_URL || "https://buildseason.app"}/ypp/alert/${args.trackingToken}

Your acknowledgment helps us ensure student safety concerns are addressed.`;

    // Log the DM that would be sent (actual Discord sending will be implemented in http.ts)
    console.log(
      `[YPP Alert] Would send DM to ${args.discordUserId}:\n${message}`
    );

    // TODO: Integrate with Discord bot to actually send the DM
    // This will be connected via the Discord webhook handler in http.ts
    // For now, we log the intent and the alert is tracked in the database

    return { success: true, discordUserId: args.discordUserId };
  },
});
