import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get the Discord guild ID for a team.
 */
export const getTeamGuild = internalQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }
    return {
      discordGuildId: team.discordGuildId,
      teamName: team.name,
      teamNumber: team.number,
    };
  },
});
