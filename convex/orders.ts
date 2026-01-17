import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireTeamMember,
  requireRole,
  canApproveOrders,
} from "./lib/permissions";

export const list = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, status }) => {
    await requireTeamMember(ctx, teamId);

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

    // Fetch vendor and user details
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const vendor = await ctx.db.get(order.vendorId);
        const createdBy = await ctx.db.get(order.createdBy);
        const approvedBy = order.approvedBy
          ? await ctx.db.get(order.approvedBy)
          : null;

        // Get order items count
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          ...order,
          vendorName: vendor?.name,
          createdByName: createdBy?.name,
          approvedByName: approvedBy?.name,
          itemCount: items.length,
        };
      })
    );

    return ordersWithDetails;
  },
});

export const get = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      return null;
    }

    await requireTeamMember(ctx, order.teamId);

    const vendor = await ctx.db.get(order.vendorId);
    const createdBy = await ctx.db.get(order.createdBy);
    const approvedBy = order.approvedBy
      ? await ctx.db.get(order.approvedBy)
      : null;

    // Get order items
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    // Fetch part details for each item
    const itemsWithParts = await Promise.all(
      items.map(async (item) => {
        const part = await ctx.db.get(item.partId);
        return {
          ...item,
          partName: part?.name,
          partSku: part?.sku,
        };
      })
    );

    return {
      ...order,
      vendor,
      createdBy,
      approvedBy,
      items: itemsWithParts,
    };
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    vendorId: v.id("vendors"),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        partId: v.id("parts"),
        quantity: v.number(),
        unitPriceCents: v.number(),
      })
    ),
  },
  handler: async (ctx, { teamId, vendorId, notes, items }) => {
    const { user } = await requireTeamMember(ctx, teamId);

    // Calculate total
    const totalCents = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0
    );

    // Create the order
    const orderId = await ctx.db.insert("orders", {
      teamId,
      vendorId,
      status: "draft",
      totalCents,
      notes,
      createdBy: user._id,
    });

    // Create order items
    for (const item of items) {
      await ctx.db.insert("orderItems", {
        orderId,
        partId: item.partId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      });
    }

    return orderId;
  },
});

export const submit = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await requireTeamMember(ctx, order.teamId);

    if (order.status !== "draft") {
      throw new Error("Can only submit draft orders");
    }

    await ctx.db.patch(orderId, { status: "pending" });
    return orderId;
  },
});

export const approve = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const { user } = await requireRole(ctx, order.teamId, "mentor");

    if (order.status !== "pending") {
      throw new Error("Can only approve pending orders");
    }

    await ctx.db.patch(orderId, {
      status: "approved",
      approvedBy: user._id,
    });

    return orderId;
  },
});

export const reject = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
  },
  handler: async (ctx, { orderId, reason }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await requireRole(ctx, order.teamId, "mentor");

    if (order.status !== "pending") {
      throw new Error("Can only reject pending orders");
    }

    await ctx.db.patch(orderId, {
      status: "rejected",
      rejectionReason: reason,
    });

    return orderId;
  },
});

export const markOrdered = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await requireRole(ctx, order.teamId, "mentor");

    if (order.status !== "approved") {
      throw new Error("Can only mark approved orders as ordered");
    }

    await ctx.db.patch(orderId, { status: "ordered" });
    return orderId;
  },
});

export const markReceived = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await requireTeamMember(ctx, order.teamId);

    if (order.status !== "ordered") {
      throw new Error("Can only mark ordered items as received");
    }

    // Update inventory quantities
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();

    for (const item of items) {
      const part = await ctx.db.get(item.partId);
      if (part) {
        await ctx.db.patch(item.partId, {
          quantity: part.quantity + item.quantity,
        });
      }
    }

    await ctx.db.patch(orderId, { status: "received" });
    return orderId;
  },
});

export const canApprove = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    return await canApproveOrders(ctx, teamId);
  },
});
