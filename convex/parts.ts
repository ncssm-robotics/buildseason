import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Fetch vendor names
    const partsWithVendors = await Promise.all(
      parts.map(async (part) => {
        let vendor = null;
        if (part.vendorId) {
          vendor = await ctx.db.get(part.vendorId);
        }
        return {
          ...part,
          vendorName: vendor?.name,
        };
      })
    );

    return partsWithVendors;
  },
});

export const search = query({
  args: {
    teamId: v.id("teams"),
    query: v.string(),
  },
  handler: async (ctx, { teamId, query: searchQuery }) => {
    await requireTeamMember(ctx, teamId);

    if (!searchQuery.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("parts")
      .withSearchIndex("search_name", (q) =>
        q.search("name", searchQuery).eq("teamId", teamId)
      )
      .take(20);

    return results;
  },
});

export const get = query({
  args: { partId: v.id("parts") },
  handler: async (ctx, { partId }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      return null;
    }

    await requireTeamMember(ctx, part.teamId);

    let vendor = null;
    if (part.vendorId) {
      vendor = await ctx.db.get(part.vendorId);
    }

    return {
      ...part,
      vendor,
    };
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    vendorId: v.optional(v.id("vendors")),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.number(),
    reorderPoint: v.number(),
    location: v.optional(v.string()),
    unitPriceCents: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeamMember(ctx, args.teamId);

    const partId = await ctx.db.insert("parts", {
      ...args,
    });

    return partId;
  },
});

export const update = mutation({
  args: {
    partId: v.id("parts"),
    name: v.optional(v.string()),
    vendorId: v.optional(v.id("vendors")),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
    location: v.optional(v.string()),
    unitPriceCents: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { partId, ...updates }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      throw new Error("Part not found");
    }

    await requireTeamMember(ctx, part.teamId);

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(partId, filteredUpdates);
    return partId;
  },
});

export const remove = mutation({
  args: { partId: v.id("parts") },
  handler: async (ctx, { partId }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      throw new Error("Part not found");
    }

    await requireRole(ctx, part.teamId, "mentor");

    // Check if part is used in any orders
    const orderItems = await ctx.db
      .query("orderItems")
      .filter((q) => q.eq(q.field("partId"), partId))
      .first();

    if (orderItems) {
      throw new Error("Cannot delete part that is referenced in orders");
    }

    // Check if part is used in BOM
    const bomItems = await ctx.db
      .query("bomItems")
      .withIndex("by_part", (q) => q.eq("partId", partId))
      .first();

    if (bomItems) {
      throw new Error("Cannot delete part that is referenced in BOM");
    }

    await ctx.db.delete(partId);
    return partId;
  },
});

export const adjustQuantity = mutation({
  args: {
    partId: v.id("parts"),
    adjustment: v.number(),
  },
  handler: async (ctx, { partId, adjustment }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      throw new Error("Part not found");
    }

    await requireTeamMember(ctx, part.teamId);

    const newQuantity = part.quantity + adjustment;
    if (newQuantity < 0) {
      throw new Error("Cannot reduce quantity below zero");
    }

    await ctx.db.patch(partId, { quantity: newQuantity });
    return partId;
  },
});

export const getLowStock = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    return parts.filter((part) => part.quantity <= part.reorderPoint);
  },
});
