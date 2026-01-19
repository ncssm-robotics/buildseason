import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole } from "./lib/permissions";

/**
 * List all vendors available to a team
 * Returns global vendors with team-specific data (account number, notes, etc.) merged in
 */
export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    // Get all global vendors
    const vendors = await ctx.db.query("vendors").collect();

    // Get team-specific vendor data
    const teamVendorLinks = await ctx.db
      .query("teamVendors")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Create a map of vendorId -> teamVendor data
    const teamDataByVendor = new Map(
      teamVendorLinks.map((tv) => [tv.vendorId, tv])
    );

    // Merge global vendor data with team-specific data
    return vendors.map((vendor) => {
      const teamData = teamDataByVendor.get(vendor._id);
      return {
        ...vendor,
        // Team-specific overrides
        accountNumber: teamData?.accountNumber,
        leadTimeDays: teamData?.leadTimeDays,
        notes: teamData?.notes,
        isPreferred: teamData?.isPreferred ?? false,
        teamVendorId: teamData?._id, // For updating team-specific data
      };
    });
  },
});

/**
 * Get a single vendor with team-specific data
 */
export const get = query({
  args: {
    vendorId: v.id("vendors"),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, { vendorId, teamId }) => {
    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      return null;
    }

    // If team context provided, merge team-specific data
    if (teamId) {
      await requireTeamMember(ctx, teamId);

      const teamVendor = await ctx.db
        .query("teamVendors")
        .withIndex("by_team_vendor", (q) =>
          q.eq("teamId", teamId).eq("vendorId", vendorId)
        )
        .first();

      return {
        ...vendor,
        accountNumber: teamVendor?.accountNumber,
        leadTimeDays: teamVendor?.leadTimeDays,
        notes: teamVendor?.notes,
        isPreferred: teamVendor?.isPreferred ?? false,
        teamVendorId: teamVendor?._id,
      };
    }

    return vendor;
  },
});

/**
 * Create a new global vendor
 * Use this when a team discovers a new vendor that doesn't exist yet
 */
export const create = mutation({
  args: {
    teamId: v.id("teams"), // For permission check
    name: v.string(),
    website: v.optional(v.string()),
    domain: v.optional(v.string()),
    orderSupportEmail: v.optional(v.string()),
    orderSupportPhone: v.optional(v.string()),
    techSupportEmail: v.optional(v.string()),
    techSupportPhone: v.optional(v.string()),
    returnsContact: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, ...vendorData }) => {
    await requireTeamMember(ctx, teamId);

    // Check if vendor already exists by domain or name
    if (vendorData.domain) {
      const existing = await ctx.db
        .query("vendors")
        .withIndex("by_domain", (q) => q.eq("domain", vendorData.domain))
        .first();
      if (existing) {
        throw new Error(
          `Vendor with domain ${vendorData.domain} already exists`
        );
      }
    }

    const allVendors = await ctx.db.query("vendors").collect();
    const nameMatch = allVendors.find(
      (v) => v.name.toLowerCase() === vendorData.name.toLowerCase()
    );
    if (nameMatch) {
      throw new Error(`Vendor "${vendorData.name}" already exists`);
    }

    const vendorId = await ctx.db.insert("vendors", vendorData);
    return vendorId;
  },
});

/**
 * Update team-specific vendor data (account number, notes, preferences)
 */
export const updateTeamVendor = mutation({
  args: {
    teamId: v.id("teams"),
    vendorId: v.id("vendors"),
    accountNumber: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    notes: v.optional(v.string()),
    isPreferred: v.optional(v.boolean()),
  },
  handler: async (ctx, { teamId, vendorId, ...updates }) => {
    await requireTeamMember(ctx, teamId);

    // Check vendor exists
    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Find or create teamVendor junction
    const teamVendor = await ctx.db
      .query("teamVendors")
      .withIndex("by_team_vendor", (q) =>
        q.eq("teamId", teamId).eq("vendorId", vendorId)
      )
      .first();

    if (!teamVendor) {
      // Create new junction
      const teamVendorId = await ctx.db.insert("teamVendors", {
        teamId,
        vendorId,
        ...updates,
      });
      return teamVendorId;
    }

    // Update existing junction
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(teamVendor._id, filteredUpdates);
    return teamVendor._id;
  },
});

/**
 * Update global vendor contact info (mentor only)
 * This updates info visible to all teams
 */
export const update = mutation({
  args: {
    vendorId: v.id("vendors"),
    teamId: v.id("teams"), // For permission check
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    domain: v.optional(v.string()),
    orderSupportEmail: v.optional(v.string()),
    orderSupportPhone: v.optional(v.string()),
    techSupportEmail: v.optional(v.string()),
    techSupportPhone: v.optional(v.string()),
    returnsContact: v.optional(v.string()),
  },
  handler: async (ctx, { vendorId, teamId, ...updates }) => {
    await requireRole(ctx, teamId, "mentor");

    const vendor = await ctx.db.get(vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(vendorId, filteredUpdates);
    return vendorId;
  },
});

/**
 * Remove team's link to a vendor (removes team-specific data)
 * Does NOT delete the global vendor
 */
export const remove = mutation({
  args: {
    teamId: v.id("teams"),
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, { teamId, vendorId }) => {
    await requireRole(ctx, teamId, "lead_mentor");

    // Find teamVendor junction
    const teamVendor = await ctx.db
      .query("teamVendors")
      .withIndex("by_team_vendor", (q) =>
        q.eq("teamId", teamId).eq("vendorId", vendorId)
      )
      .first();

    if (teamVendor) {
      await ctx.db.delete(teamVendor._id);
    }

    // Note: We don't delete the global vendor, just the team link
    return vendorId;
  },
});
