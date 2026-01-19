/**
 * Debug utilities for email parsing
 * Temporary file for testing - can be removed after validation
 */

import { query, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * List recent inbound emails with their parsed data
 */
export const listRecentEmails = query({
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
      error: e.processingError,
      receivedAt: new Date(e.receivedAt).toISOString(),
    }));
  },
});

/**
 * Reprocess a failed email
 */
export const reprocessEmail = mutation({
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
export const reprocessAllFailed = mutation({
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
