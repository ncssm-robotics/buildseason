import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Load team context for agent awareness.
 * This query assembles the current state of the team so the agent
 * has full context before every interaction.
 */
export const loadTeamContext = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Get team info
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return {
        team: null,
        season: null,
        inventorySummary: {
          totalParts: 0,
          lowStockCount: 0,
          lowStockParts: [],
        },
        pendingOrders: [],
      };
    }

    // Get active season
    const season = team.activeSeasonId
      ? await ctx.db.get(team.activeSeasonId)
      : null;

    // Get parts inventory
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Identify low stock items
    const lowStockParts = parts.filter((p) => p.quantity <= p.reorderPoint);

    // Get pending orders
    const pendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Also get approved orders waiting to be placed
    const approvedOrders = await ctx.db
      .query("orders")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", args.teamId).eq("status", "approved")
      )
      .collect();

    const allPendingOrders = [...pendingOrders, ...approvedOrders];

    return {
      team: {
        _id: team._id,
        name: team.name,
        number: team.number,
        program: team.program,
      },
      season: season
        ? {
            name: season.name,
            year: season.year,
          }
        : null,
      inventorySummary: {
        totalParts: parts.length,
        lowStockCount: lowStockParts.length,
        lowStockParts: lowStockParts.map((p) => ({
          id: p._id,
          name: p.name,
          quantity: p.quantity,
        })),
      },
      pendingOrders: allPendingOrders.map((o) => ({
        id: o._id,
        status: o.status,
        totalCents: o.totalCents,
      })),
    };
  },
});
