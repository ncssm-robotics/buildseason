import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    // Get team-specific vendors
    const teamVendors = await ctx.db
      .query("vendors")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Get global vendors
    const globalVendors = await ctx.db
      .query("vendors")
      .filter((q) => q.eq(q.field("isGlobal"), true))
      .collect();

    // Combine and dedupe
    const allVendors = [...globalVendors, ...teamVendors];
    return allVendors;
  },
});

export const get = query({
  args: { vendorId: v.id("vendors") },
  handler: async (ctx, { vendorId }) => {
    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      return null;
    }

    // If team-specific, check membership
    if (vendor.teamId) {
      await requireTeamMember(ctx, vendor.teamId);
    }

    return vendor;
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    website: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, ...vendorData }) => {
    await requireTeamMember(ctx, teamId);

    const vendorId = await ctx.db.insert("vendors", {
      ...vendorData,
      teamId,
      isGlobal: false,
    });

    return vendorId;
  },
});

export const update = mutation({
  args: {
    vendorId: v.id("vendors"),
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { vendorId, ...updates }) => {
    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Can't edit global vendors
    if (vendor.isGlobal) {
      throw new Error("Cannot edit global vendors");
    }

    if (vendor.teamId) {
      await requireRole(ctx, vendor.teamId, "mentor");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(vendorId, filteredUpdates);
    return vendorId;
  },
});

export const remove = mutation({
  args: { vendorId: v.id("vendors") },
  handler: async (ctx, { vendorId }) => {
    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (vendor.isGlobal) {
      throw new Error("Cannot delete global vendors");
    }

    if (vendor.teamId) {
      await requireRole(ctx, vendor.teamId, "admin");
    }

    // Check if vendor is used in any parts
    const parts = await ctx.db
      .query("parts")
      .filter((q) => q.eq(q.field("vendorId"), vendorId))
      .first();

    if (parts) {
      throw new Error("Cannot delete vendor that is referenced by parts");
    }

    // Check if vendor is used in any orders
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("vendorId"), vendorId))
      .first();

    if (orders) {
      throw new Error("Cannot delete vendor that is referenced by orders");
    }

    await ctx.db.delete(vendorId);
    return vendorId;
  },
});
