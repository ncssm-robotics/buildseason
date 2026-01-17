import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Add a user to a team
 */
export const addTeamMember = internalMutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    role: v.string(), // "admin", "mentor", "student"
  },
  handler: async (ctx, { userId, teamId, role }) => {
    // Check if already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", userId).eq("teamId", teamId)
      )
      .first();

    if (existing) {
      return {
        message: "User is already a member of this team",
        memberId: existing._id,
      };
    }

    const memberId = await ctx.db.insert("teamMembers", {
      userId,
      teamId,
      role,
    });

    return { message: "Added user to team", memberId };
  },
});

/**
 * Create a team (admin/setup use only)
 */
export const createTeam = internalMutation({
  args: {
    name: v.string(),
    number: v.string(),
    program: v.string(),
    discordGuildId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      number: args.number,
      program: args.program,
      discordGuildId: args.discordGuildId,
    });
    return { teamId, message: `Created team ${args.name} (#${args.number})` };
  },
});

/**
 * Create a dev team with Discord linked (convenience function)
 */
export const createDevTeam = internalMutation({
  args: {
    discordGuildId: v.string(),
  },
  handler: async (ctx, { discordGuildId }) => {
    // Check if dev team already exists
    const existing = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("number"), "1010"))
      .first();

    if (existing) {
      // Just update the discord guild ID
      await ctx.db.patch(existing._id, { discordGuildId });
      return {
        teamId: existing._id,
        message: `Updated existing dev team with Discord guild`,
        created: false,
      };
    }

    const teamId = await ctx.db.insert("teams", {
      name: "BS-Devs",
      number: "1010",
      program: "ftc",
      discordGuildId,
    });

    return {
      teamId,
      message: `Created dev team BS-Devs (#1010) linked to Discord`,
      created: true,
    };
  },
});
