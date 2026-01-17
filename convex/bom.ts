import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const items = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Fetch part details
    const itemsWithParts = await Promise.all(
      items.map(async (item) => {
        const part = await ctx.db.get(item.partId);
        return {
          ...item,
          partName: part?.name,
          partSku: part?.sku,
          currentQuantity: part?.quantity ?? 0,
          shortage: Math.max(0, item.quantityNeeded - (part?.quantity ?? 0)),
        };
      })
    );

    return itemsWithParts;
  },
});

export const listBySubsystem = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const items = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Fetch part details and group by subsystem
    const itemsWithParts = await Promise.all(
      items.map(async (item) => {
        const part = await ctx.db.get(item.partId);
        return {
          ...item,
          partName: part?.name,
          partSku: part?.sku,
          currentQuantity: part?.quantity ?? 0,
          shortage: Math.max(0, item.quantityNeeded - (part?.quantity ?? 0)),
        };
      })
    );

    // Group by subsystem
    const bySubsystem: Record<string, typeof itemsWithParts> = {};
    for (const item of itemsWithParts) {
      if (!bySubsystem[item.subsystem]) {
        bySubsystem[item.subsystem] = [];
      }
      bySubsystem[item.subsystem].push(item);
    }

    return bySubsystem;
  },
});

export const get = query({
  args: { bomItemId: v.id("bomItems") },
  handler: async (ctx, { bomItemId }) => {
    const item = await ctx.db.get(bomItemId);
    if (!item) {
      return null;
    }

    await requireTeamMember(ctx, item.teamId);

    const part = await ctx.db.get(item.partId);

    return {
      ...item,
      part,
      shortage: Math.max(0, item.quantityNeeded - (part?.quantity ?? 0)),
    };
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    partId: v.id("parts"),
    subsystem: v.string(),
    quantityNeeded: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeamMember(ctx, args.teamId);

    // Check if this part is already in the BOM for this subsystem
    const existing = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("partId"), args.partId),
          q.eq(q.field("subsystem"), args.subsystem)
        )
      )
      .unique();

    if (existing) {
      throw new Error("Part already exists in BOM for this subsystem");
    }

    const bomItemId = await ctx.db.insert("bomItems", args);
    return bomItemId;
  },
});

export const update = mutation({
  args: {
    bomItemId: v.id("bomItems"),
    quantityNeeded: v.optional(v.number()),
    subsystem: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { bomItemId, ...updates }) => {
    const item = await ctx.db.get(bomItemId);
    if (!item) {
      throw new Error("BOM item not found");
    }

    await requireTeamMember(ctx, item.teamId);

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(bomItemId, filteredUpdates);
    return bomItemId;
  },
});

export const remove = mutation({
  args: { bomItemId: v.id("bomItems") },
  handler: async (ctx, { bomItemId }) => {
    const item = await ctx.db.get(bomItemId);
    if (!item) {
      throw new Error("BOM item not found");
    }

    await requireTeamMember(ctx, item.teamId);
    await ctx.db.delete(bomItemId);

    return bomItemId;
  },
});

export const getShortages = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const items = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    const shortages = [];

    for (const item of items) {
      const part = await ctx.db.get(item.partId);
      const shortage = item.quantityNeeded - (part?.quantity ?? 0);

      if (shortage > 0) {
        shortages.push({
          ...item,
          partName: part?.name,
          partSku: part?.sku,
          currentQuantity: part?.quantity ?? 0,
          shortage,
        });
      }
    }

    return shortages;
  },
});

export const getSubsystems = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const items = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Get unique subsystems
    const subsystems = [...new Set(items.map((item) => item.subsystem))];
    return subsystems.sort();
  },
});
