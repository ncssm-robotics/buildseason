/**
 * Debug utilities for email parsing
 * Temporary file for testing - can be removed after validation
 */

import { query } from "../_generated/server";

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
