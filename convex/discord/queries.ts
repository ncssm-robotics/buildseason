import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get team by Discord guild ID
 * In a full implementation, you'd have a discordGuildId field on teams
 * For now, this is a placeholder that returns the first team
 */
export const getTeamByGuild = internalQuery({
  args: {
    guildId: v.string(),
  },
  handler: async (ctx, { guildId: _guildId }) => {
    // TODO: Add discordGuildId to teams schema and look up properly
    // For now, return the first team for testing
    // In production, you'd query: .filter(q => q.eq(q.field("discordGuildId"), _guildId))

    const teams = await ctx.db.query("teams").take(1);
    return teams[0] || null;
  },
});
