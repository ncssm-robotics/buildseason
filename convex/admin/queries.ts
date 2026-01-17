import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * List all team members for a team
 */
export const listTeamMembers = internalQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          memberId: member._id,
          userId: member.userId,
          role: member.role,
          email: user?.email,
          name: user?.name,
        };
      })
    );

    return enriched;
  },
});

/**
 * Find user by team membership
 */
export const findUserInTeam = internalQuery({
  args: {
    teamNumber: v.string(),
  },
  handler: async (ctx, { teamNumber }) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("number"), teamNumber))
      .first();

    if (!team) {
      return { error: `Team ${teamNumber} not found` };
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    const enriched = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          role: member.role,
          email: user?.email,
          name: user?.name,
        };
      })
    );

    return {
      team: { id: team._id, name: team.name, number: team.number },
      members: enriched,
    };
  },
});
