/**
 * Debug utilities for email parsing
 *
 * All functions are internal-only to prevent unauthorized access.
 * Call these from the Convex dashboard or other internal functions.
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * List recent inbound emails with their parsed data
 */
export const listRecentEmails = internalQuery({
  args: {},
  handler: async (ctx) => {
    const emails = await ctx.db.query("inboundEmails").order("desc").take(20);

    return emails.map((e) => ({
      id: e._id,
      from: e.fromAddress,
      subject: e.subject,
      status: e.status,
      type: e.emailType,
      vendor: e.parsedVendor,
      orderNumber: e.parsedOrderNumber,
      tracking: e.parsedTrackingNumber,
      // Agent extraction data
      itemCount: e.parsedItems?.length ?? 0,
      totalCents: e.totalCents,
      mentorNotes: e.mentorNotes,
      extractionNotes: e.extractionNotes,
      error: e.processingError,
      receivedAt: new Date(e.receivedAt).toISOString(),
    }));
  },
});

/**
 * Reprocess a failed email
 */
export const reprocessEmail = internalMutation({
  args: {
    emailId: v.id("inboundEmails"),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      throw new Error(`Email ${args.emailId} not found`);
    }

    // Reset status to pending
    await ctx.db.patch(args.emailId, {
      status: "pending",
      processingError: undefined,
      emailType: undefined,
      parsedVendor: undefined,
      parsedOrderNumber: undefined,
      parsedTrackingNumber: undefined,
      parsedItems: undefined,
      mentorNotes: undefined,
      extractionNotes: undefined,
      totalCents: undefined,
      processedAt: undefined,
    });

    // Schedule reprocessing
    await ctx.scheduler.runAfter(
      0,
      internal.email.inbound.processInboundEmail,
      {
        emailId: args.emailId,
      }
    );

    return { success: true, emailId: args.emailId };
  },
});

/**
 * Reprocess all failed emails
 */
export const reprocessAllFailed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const failedEmails = await ctx.db
      .query("inboundEmails")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    const reprocessed = [];
    for (const email of failedEmails) {
      // Reset status to pending
      await ctx.db.patch(email._id, {
        status: "pending",
        processingError: undefined,
        emailType: undefined,
        parsedVendor: undefined,
        parsedOrderNumber: undefined,
        parsedTrackingNumber: undefined,
        parsedItems: undefined,
        mentorNotes: undefined,
        extractionNotes: undefined,
        totalCents: undefined,
        processedAt: undefined,
      });

      // Schedule reprocessing
      await ctx.scheduler.runAfter(
        0,
        internal.email.inbound.processInboundEmail,
        {
          emailId: email._id,
        }
      );

      reprocessed.push(email._id);
    }

    return { reprocessed: reprocessed.length, emailIds: reprocessed };
  },
});

/**
 * List all global vendors with contact info (for debugging vendor extraction)
 */
export const listVendors = internalQuery({
  args: {},
  handler: async (ctx) => {
    const vendors = await ctx.db.query("vendors").collect();
    return vendors.map((v) => ({
      id: v._id,
      name: v.name,
      domain: v.domain,
      website: v.website,
      orderSupportEmail: v.orderSupportEmail,
      orderSupportPhone: v.orderSupportPhone,
      techSupportEmail: v.techSupportEmail,
      techSupportPhone: v.techSupportPhone,
      returnsContact: v.returnsContact,
    }));
  },
});

/**
 * List team-vendor links with team-specific data (for debugging)
 */
export const listTeamVendors = internalQuery({
  args: {},
  handler: async (ctx) => {
    const teamVendors = await ctx.db.query("teamVendors").collect();
    return teamVendors.map((tv) => ({
      id: tv._id,
      teamId: tv.teamId,
      vendorId: tv.vendorId,
      accountNumber: tv.accountNumber,
      leadTimeDays: tv.leadTimeDays,
      notes: tv.notes,
      isPreferred: tv.isPreferred,
    }));
  },
});

/**
 * Migration: Remove legacy fields from vendors table
 * The vendors table was refactored to be global-only, removing isGlobal, teamId, and accountNumber fields.
 * Account numbers now live in teamVendors junction table.
 * Run this once to clean up existing vendor documents.
 */
export const migrateVendorsRemoveLegacyFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const vendors = await ctx.db.query("vendors").collect();
    let migrated = 0;
    const teamVendorsCreated: string[] = [];

    for (const vendor of vendors) {
      // Check if vendor has legacy fields (using any to access untyped fields)
      const rawVendor = vendor as Record<string, unknown>;
      const hasLegacyFields =
        "isGlobal" in rawVendor ||
        "teamId" in rawVendor ||
        "accountNumber" in rawVendor;

      if (hasLegacyFields) {
        const legacyTeamId = rawVendor.teamId as string | undefined;
        const legacyAccountNumber = rawVendor.accountNumber as
          | string
          | undefined;

        // If there was a teamId and accountNumber, create a teamVendors junction
        if (legacyTeamId && legacyAccountNumber) {
          // Check if junction already exists
          const existing = await ctx.db
            .query("teamVendors")
            .withIndex("by_team_vendor", (q) =>
              q
                .eq("teamId", legacyTeamId as unknown as Id<"teams">)
                .eq("vendorId", vendor._id)
            )
            .first();

          if (!existing) {
            await ctx.db.insert("teamVendors", {
              teamId: legacyTeamId as unknown as Id<"teams">,
              vendorId: vendor._id,
              accountNumber: legacyAccountNumber,
            });
            teamVendorsCreated.push(vendor.name);
          }
        }

        // Replace the document with only the valid fields
        await ctx.db.replace(vendor._id, {
          name: vendor.name,
          website: vendor.website,
          domain: vendor.domain,
          orderSupportEmail: vendor.orderSupportEmail,
          orderSupportPhone: vendor.orderSupportPhone,
          techSupportEmail: vendor.techSupportEmail,
          techSupportPhone: vendor.techSupportPhone,
          returnsContact: vendor.returnsContact,
        });
        migrated++;
      }
    }

    return { migrated, total: vendors.length, teamVendorsCreated };
  },
});

/**
 * Get full details of a specific email including parsed items
 */
export const getEmailDetails = internalQuery({
  args: {
    emailId: v.id("inboundEmails"),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      throw new Error(`Email ${args.emailId} not found`);
    }

    return {
      id: email._id,
      from: email.fromAddress,
      to: email.toAddress,
      subject: email.subject,
      status: email.status,
      emailType: email.emailType,
      vendor: email.parsedVendor,
      orderNumber: email.parsedOrderNumber,
      tracking: email.parsedTrackingNumber,
      // Agent extraction data
      items: email.parsedItems,
      totalCents: email.totalCents,
      mentorNotes: email.mentorNotes,
      extractionNotes: email.extractionNotes,
      // Metadata
      error: email.processingError,
      receivedAt: new Date(email.receivedAt).toISOString(),
      processedAt: email.processedAt
        ? new Date(email.processedAt).toISOString()
        : undefined,
    };
  },
});
