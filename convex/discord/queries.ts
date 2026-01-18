import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get team by Discord guild ID.
 * Returns the team linked to this Discord server, or null if not linked.
 */
export const getTeamByGuild = internalQuery({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, { guildId }) => {
    if (!guildId) {
      return null;
    }

    const team = await ctx.db
      .query("teams")
      .withIndex("by_discord_guild", (q) => q.eq("discordGuildId", guildId))
      .first();

    return team;
  },
});
