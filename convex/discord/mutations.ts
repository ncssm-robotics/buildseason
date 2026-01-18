import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../lib/permissions";

/**
 * Link a team to a Discord server.
 * This should be called when setting up Discord integration for a team.
 */
export const linkTeamToGuild = internalMutation({
  args: {
    teamId: v.id("teams"),
    guildId: v.string(),
  },
  handler: async (ctx, { teamId, guildId }) => {
    // Check if another team is already linked to this guild
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_discord_guild", (q) => q.eq("discordGuildId", guildId))
      .first();

    if (existingTeam && existingTeam._id !== teamId) {
      throw new Error(
        `Discord server is already linked to team ${existingTeam.number} (${existingTeam.name})`
      );
    }

    // Update the team with the guild ID
    await ctx.db.patch(teamId, { discordGuildId: guildId });

    return { success: true };
  },
});

/**
 * Unlink a team from Discord.
 */
export const unlinkTeamFromGuild = internalMutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    await ctx.db.patch(teamId, { discordGuildId: undefined });
    return { success: true };
  },
});

/**
 * Public mutation for team admins to link their Discord server.
 * Requires authentication and team admin role.
 */
export const linkDiscordServer = mutation({
  args: {
    teamId: v.id("teams"),
    guildId: v.string(),
  },
  handler: async (ctx, { teamId, guildId }) => {
    // Require authenticated user with admin role on this team
    await requireRole(ctx, teamId, "admin");

    // Check if another team is already linked to this guild
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_discord_guild", (q) => q.eq("discordGuildId", guildId))
      .first();

    if (existingTeam && existingTeam._id !== teamId) {
      throw new Error(
        `Discord server is already linked to another team. Each server can only be linked to one team.`
      );
    }

    // Update the team with the guild ID
    await ctx.db.patch(teamId, { discordGuildId: guildId });

    return { success: true, message: "Discord server linked successfully" };
  },
});
