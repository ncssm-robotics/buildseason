import { query } from "../_generated/server";
import { v } from "convex/values";
import { calculateAge } from "../lib/ypp";

/**
 * Get YPP contacts for a team with their Discord info for DM sending
 */
export const getYppContacts = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team || !team.yppContacts || team.yppContacts.length === 0) {
      return [];
    }

    const contacts = await Promise.all(
      team.yppContacts.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        // Get Discord link for DM sending
        const discordLink = await ctx.db
          .query("discordLinks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        // Get team membership for role info
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_user_team", (q) =>
            q.eq("userId", userId).eq("teamId", args.teamId)
          )
          .first();

        return {
          userId,
          name: user.name,
          email: user.email,
          discordUserId: discordLink?.discordUserId ?? null,
          discordUsername: discordLink?.discordUsername ?? null,
          role: membership?.role ?? null,
        };
      })
    );

    return contacts.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

/**
 * Validate that all YPP contacts are adult mentors
 * Used during team setup to enforce the requirement
 */
export const validateYppContacts = query({
  args: {
    teamId: v.id("teams"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const errors: string[] = [];

    if (args.userIds.length === 0) {
      errors.push("At least one YPP contact is required");
      return { valid: false, errors };
    }

    for (const userId of args.userIds) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_user_team", (q) =>
          q.eq("userId", userId).eq("teamId", args.teamId)
        )
        .first();

      if (!membership) {
        errors.push(`User ${userId} is not a member of this team`);
        continue;
      }

      if (membership.role === "student") {
        errors.push(`User ${userId} is a student and cannot be a YPP contact`);
        continue;
      }

      // Check if adult (requires birthdate)
      if (!membership.birthdate) {
        errors.push(`User ${userId} has no birthdate on file`);
        continue;
      }

      const age = calculateAge(membership.birthdate);
      if (age < 18) {
        errors.push(`User ${userId} is under 18 and cannot be a YPP contact`);
      }
    }

    return { valid: errors.length === 0, errors };
  },
});
