import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Internal queries for orders, used by the agent.
 */

export const list = internalQuery({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, status }) => {
    let orders;

    if (status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_team_status", (q) =>
          q.eq("teamId", teamId).eq("status", status)
        )
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();
    }

    // Enrich with vendor names
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const vendor = await ctx.db.get(order.vendorId);
        const itemCount = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          id: order._id,
          status: order.status,
          totalCents: order.totalCents,
          totalFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
          vendorName: vendor?.name || "Unknown",
          itemCount: itemCount.length,
          notes: order.notes,
        };
      })
    );

    return ordersWithDetails;
  },
});

export const get = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      return null;
    }

    const vendor = await ctx.db.get(order.vendorId);

    // Get line items
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    // Enrich items with part names
    const itemsWithParts = await Promise.all(
      orderItems.map(async (item) => {
        const part = await ctx.db.get(item.partId);
        return {
          id: item._id,
          partName: part?.name || "Unknown",
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.quantity * item.unitPriceCents,
        };
      })
    );

    return {
      id: order._id,
      status: order.status,
      totalCents: order.totalCents,
      totalFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
      vendor: vendor
        ? {
            id: vendor._id,
            name: vendor.name,
            website: vendor.website,
          }
        : null,
      notes: order.notes,
      rejectionReason: order.rejectionReason,
      items: itemsWithParts,
    };
  },
});

export const summary = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Count by status
    const statusCounts: Record<string, number> = {};
    let pendingTotal = 0;
    let approvedTotal = 0;

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      if (order.status === "pending") {
        pendingTotal += order.totalCents;
      } else if (order.status === "approved") {
        approvedTotal += order.totalCents;
      }
    }

    return {
      totalOrders: orders.length,
      byStatus: statusCounts,
      pendingValue: `$${(pendingTotal / 100).toFixed(2)}`,
      approvedValue: `$${(approvedTotal / 100).toFixed(2)}`,
      awaitingAction:
        (statusCounts["pending"] || 0) + (statusCounts["approved"] || 0),
    };
  },
});
