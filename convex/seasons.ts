import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const seasons = await ctx.db
      .query("seasons")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    return seasons;
  },
});

export const get = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, { seasonId }) => {
    const season = await ctx.db.get(seasonId);
    if (!season) {
      return null;
    }

    await requireTeamMember(ctx, season.teamId);
    return season;
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    year: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.teamId, "admin");

    const seasonId = await ctx.db.insert("seasons", {
      ...args,
      isArchived: false,
    });

    return seasonId;
  },
});

export const update = mutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.optional(v.string()),
    year: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { seasonId, ...updates }) => {
    const season = await ctx.db.get(seasonId);
    if (!season) {
      throw new Error("Season not found");
    }

    await requireRole(ctx, season.teamId, "admin");

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(seasonId, filteredUpdates);
    return seasonId;
  },
});

export const archive = mutation({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, { seasonId }) => {
    const season = await ctx.db.get(seasonId);
    if (!season) {
      throw new Error("Season not found");
    }

    await requireRole(ctx, season.teamId, "admin");

    // If this is the active season, clear it from the team
    const team = await ctx.db.get(season.teamId);
    if (team?.activeSeasonId === seasonId) {
      await ctx.db.patch(season.teamId, { activeSeasonId: undefined });
    }

    await ctx.db.patch(seasonId, { isArchived: true });
    return seasonId;
  },
});

export const unarchive = mutation({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, { seasonId }) => {
    const season = await ctx.db.get(seasonId);
    if (!season) {
      throw new Error("Season not found");
    }

    await requireRole(ctx, season.teamId, "admin");
    await ctx.db.patch(seasonId, { isArchived: false });

    return seasonId;
  },
});

export const setActive = mutation({
  args: {
    teamId: v.id("teams"),
    seasonId: v.id("seasons"),
  },
  handler: async (ctx, { teamId, seasonId }) => {
    await requireRole(ctx, teamId, "admin");

    const season = await ctx.db.get(seasonId);
    if (!season || season.teamId !== teamId) {
      throw new Error("Season not found");
    }

    if (season.isArchived) {
      throw new Error("Cannot set an archived season as active");
    }

    await ctx.db.patch(teamId, { activeSeasonId: seasonId });
    return teamId;
  },
});
