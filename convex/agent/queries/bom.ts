import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Internal queries for BOM (Bill of Materials), used by the agent.
 */

export const list = internalQuery({
  args: {
    teamId: v.id("teams"),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, subsystem }) => {
    let bomItems = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Filter by subsystem if specified
    if (subsystem) {
      bomItems = bomItems.filter(
        (item) => item.subsystem.toLowerCase() === subsystem.toLowerCase()
      );
    }

    // Enrich with part details
    const itemsWithParts = await Promise.all(
      bomItems.map(async (item) => {
        const part = await ctx.db.get(item.partId);
        return {
          id: item._id,
          subsystem: item.subsystem,
          quantityNeeded: item.quantityNeeded,
          notes: item.notes,
          part: part
            ? {
                id: part._id,
                name: part.name,
                quantity: part.quantity,
                sku: part.sku,
              }
            : null,
          fulfilled: part ? part.quantity >= item.quantityNeeded : false,
          shortfall: part
            ? Math.max(0, item.quantityNeeded - part.quantity)
            : item.quantityNeeded,
        };
      })
    );

    return itemsWithParts;
  },
});

export const status = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const bomItems = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    let fullyStocked = 0;
    let partiallyStocked = 0;
    let missing = 0;
    const subsystems: Record<
      string,
      { total: number; fulfilled: number; items: number }
    > = {};

    for (const item of bomItems) {
      const part = await ctx.db.get(item.partId);
      const currentQty = part?.quantity || 0;
      const needed = item.quantityNeeded;

      // Track subsystem stats
      if (!subsystems[item.subsystem]) {
        subsystems[item.subsystem] = { total: 0, fulfilled: 0, items: 0 };
      }
      subsystems[item.subsystem].total += needed;
      subsystems[item.subsystem].fulfilled += Math.min(currentQty, needed);
      subsystems[item.subsystem].items += 1;

      // Categorize
      if (currentQty >= needed) {
        fullyStocked++;
      } else if (currentQty > 0) {
        partiallyStocked++;
      } else {
        missing++;
      }
    }

    // Calculate subsystem percentages
    const subsystemStatus = Object.entries(subsystems).map(([name, stats]) => ({
      name,
      percentComplete: Math.round((stats.fulfilled / stats.total) * 100) || 0,
      itemCount: stats.items,
    }));

    return {
      totalItems: bomItems.length,
      fullyStocked,
      partiallyStocked,
      missing,
      overallPercent:
        bomItems.length > 0
          ? Math.round((fullyStocked / bomItems.length) * 100)
          : 100,
      bySubsystem: subsystemStatus,
    };
  },
});

export const shortages = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const bomItems = await ctx.db
      .query("bomItems")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    const shortages = [];

    for (const item of bomItems) {
      const part = await ctx.db.get(item.partId);
      const currentQty = part?.quantity || 0;

      if (currentQty < item.quantityNeeded) {
        shortages.push({
          id: item._id,
          subsystem: item.subsystem,
          partName: part?.name || "Unknown",
          partId: item.partId,
          needed: item.quantityNeeded,
          have: currentQty,
          shortfall: item.quantityNeeded - currentQty,
        });
      }
    }

    // Sort by shortfall (biggest gaps first)
    shortages.sort((a, b) => b.shortfall - a.shortfall);

    return shortages;
  },
});
