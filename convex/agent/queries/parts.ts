import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Internal queries for parts, used by the agent.
 * These are simpler versions that don't require auth (agent handles auth).
 */

export const list = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Enrich with vendor names
    const partsWithVendors = await Promise.all(
      parts.map(async (part) => {
        let vendorName = null;
        if (part.vendorId) {
          const vendor = await ctx.db.get(part.vendorId);
          vendorName = vendor?.name;
        }
        return {
          id: part._id,
          name: part.name,
          sku: part.sku,
          quantity: part.quantity,
          reorderPoint: part.reorderPoint,
          location: part.location,
          unitPriceCents: part.unitPriceCents,
          vendorName,
          isLowStock: part.quantity <= part.reorderPoint,
        };
      })
    );

    return partsWithVendors;
  },
});

export const getLowStock = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    const lowStock = parts.filter((p) => p.quantity <= p.reorderPoint);

    return lowStock.map((part) => ({
      id: part._id,
      name: part.name,
      quantity: part.quantity,
      reorderPoint: part.reorderPoint,
      shortfall: part.reorderPoint - part.quantity,
    }));
  },
});

export const search = internalQuery({
  args: {
    teamId: v.id("teams"),
    query: v.string(),
  },
  handler: async (ctx, { teamId, query: searchQuery }) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("parts")
      .withSearchIndex("search_name", (q) =>
        q.search("name", searchQuery).eq("teamId", teamId)
      )
      .take(20);

    return results.map((part) => ({
      id: part._id,
      name: part.name,
      sku: part.sku,
      quantity: part.quantity,
      location: part.location,
    }));
  },
});

export const get = internalQuery({
  args: { partId: v.id("parts") },
  handler: async (ctx, { partId }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      return null;
    }

    let vendor = null;
    if (part.vendorId) {
      vendor = await ctx.db.get(part.vendorId);
    }

    return {
      id: part._id,
      name: part.name,
      sku: part.sku,
      description: part.description,
      quantity: part.quantity,
      reorderPoint: part.reorderPoint,
      location: part.location,
      unitPriceCents: part.unitPriceCents,
      vendor: vendor
        ? {
            id: vendor._id,
            name: vendor.name,
            website: vendor.website,
          }
        : null,
      isLowStock: part.quantity <= part.reorderPoint,
    };
  },
});
