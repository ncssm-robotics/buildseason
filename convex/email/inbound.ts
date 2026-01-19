import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  internalMutation,
  internalAction,
  internalQuery,
} from "../_generated/server";
import { v } from "convex/values";

/**
 * Verify Resend/Svix webhook signature using HMAC-SHA256
 *
 * Svix format:
 * - Headers: svix-id, svix-timestamp, svix-signature
 * - Signed content: ${svix_id}.${svix_timestamp}.${body}
 * - Secret: base64 encoded (after stripping whsec_ prefix)
 * - Signature header: "v1,<base64-signature>" (may have multiple)
 */
async function verifySvixSignature(
  payload: string,
  headers: {
    svixId: string | null;
    svixTimestamp: string | null;
    svixSignature: string | null;
  },
  secret: string
): Promise<boolean> {
  const { svixId, svixTimestamp, svixSignature } = headers;

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn("[Email Inbound] Missing Svix headers");
    return false;
  }

  // Check timestamp is within 5 minutes to prevent replay attacks
  const timestampMs = parseInt(svixTimestamp) * 1000;
  const now = Date.now();
  if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    console.warn(
      "[Email Inbound] Webhook timestamp too old, possible replay attack"
    );
    return false;
  }

  // Strip whsec_ prefix and base64 decode the secret
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

  // Compute HMAC-SHA256 of: svix_id.svix_timestamp.body
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  // Convert to base64
  const computedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  // The signature header may contain multiple signatures (v1,sig1 v1,sig2)
  // We need to check if any of them match
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, sigValue] = sig.split(",");
    if (version === "v1" && sigValue === computedSignature) {
      return true;
    }
  }

  console.warn("[Email Inbound] No matching signature found");
  return false;
}

/**
 * Parse team number from email address
 * Expects format: ftc-5064@buildseason.org -> { program: "ftc", number: "5064" }
 */
function parseTeamFromEmail(
  email: string
): { program: string; number: string } | null {
  const match = email.match(/^(ftc|frc|vex)-(\d+)@buildseason\.org$/i);
  if (!match) return null;
  return { program: match[1].toLowerCase(), number: match[2] };
}

/**
 * HTTP handler for Resend inbound email webhook
 *
 * Resend sends email.received events when emails arrive at our domain.
 * The webhook payload contains metadata only - we must call the Resend API
 * to fetch the full email body and attachments.
 */
export const inboundWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Email Inbound] RESEND_WEBHOOK_SECRET not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  const body = await request.text();

  // Get all Svix headers
  const svixHeaders = {
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
  };

  // Verify webhook signature
  const isValid = await verifySvixSignature(body, svixHeaders, webhookSecret);
  if (!isValid) {
    console.warn("[Email Inbound] Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: ResendInboundPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    console.error("[Email Inbound] Invalid JSON payload");
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only process email.received events
  if (payload.type !== "email.received") {
    console.log(`[Email Inbound] Ignoring event type: ${payload.type}`);
    return new Response("OK", { status: 200 });
  }

  const data = payload.data;
  console.log(
    `[Email Inbound] Received email from ${data.from} to ${data.to}, subject: ${data.subject}`
  );

  // Store the email and schedule processing
  await ctx.runMutation(internal.email.inbound.storeInboundEmail, {
    resendEmailId: data.email_id,
    fromAddress: data.from,
    toAddress: Array.isArray(data.to) ? data.to[0] : data.to,
    subject: data.subject || "(no subject)",
    receivedAt: Date.now(),
  });

  return new Response("OK", { status: 200 });
});

/**
 * Resend inbound webhook payload type
 */
interface ResendInboundPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string | string[];
    subject?: string;
    created_at: string;
  };
}

/**
 * Store an inbound email in the database
 *
 * Includes deduplication check to handle webhook retries from Resend.
 * If an email with the same resendEmailId already exists, returns early.
 */
export const storeInboundEmail = internalMutation({
  args: {
    resendEmailId: v.string(),
    fromAddress: v.string(),
    toAddress: v.string(),
    subject: v.string(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate webhook delivery (Resend may retry on failures)
    const existing = await ctx.db
      .query("inboundEmails")
      .withIndex("by_resend_id", (q) =>
        q.eq("resendEmailId", args.resendEmailId)
      )
      .first();

    if (existing) {
      console.log(
        `[Email Inbound] Duplicate webhook for ${args.resendEmailId}, skipping`
      );
      return existing._id;
    }

    // Parse team from the "to" address
    const teamInfo = parseTeamFromEmail(args.toAddress);
    let teamId = undefined;

    if (teamInfo) {
      // Look up the team
      const team = await ctx.db
        .query("teams")
        .withIndex("by_program_number", (q) =>
          q.eq("program", teamInfo.program).eq("number", teamInfo.number)
        )
        .first();
      teamId = team?._id;

      if (!team) {
        console.warn(
          `[Email Inbound] No team found for ${teamInfo.program}-${teamInfo.number}`
        );
      }
    }

    // Store the email
    const emailId = await ctx.db.insert("inboundEmails", {
      teamId,
      resendEmailId: args.resendEmailId,
      fromAddress: args.fromAddress,
      toAddress: args.toAddress,
      subject: args.subject,
      receivedAt: args.receivedAt,
      status: "pending",
    });

    console.log(
      `[Email Inbound] Stored email ${emailId}, team: ${teamId || "unknown"}`
    );

    // Schedule processing (will fetch body and parse content)
    await ctx.scheduler.runAfter(
      0,
      internal.email.inbound.processInboundEmail,
      {
        emailId,
      }
    );

    return emailId;
  },
});

/**
 * Process an inbound email - fetch body from Resend API and parse with Claude Haiku
 *
 * Uses an agent-first approach: Claude Haiku extracts structured data from emails
 * using a JSON schema. This is more robust than regex-based parsing because it:
 * - Works with any vendor without new parser code
 * - Understands mentor context ("only the usb cam was for 5064")
 * - Extracts line items for inventory tracking
 */
export const processInboundEmail = internalAction({
  args: {
    emailId: v.id("inboundEmails"),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!resendApiKey) {
      console.error("[Email Inbound] RESEND_API_KEY not configured");
      await ctx.runMutation(internal.email.inbound.markEmailFailed, {
        emailId: args.emailId,
        error: "RESEND_API_KEY not configured",
      });
      return;
    }

    if (!anthropicApiKey) {
      console.error("[Email Inbound] ANTHROPIC_API_KEY not configured");
      await ctx.runMutation(internal.email.inbound.markEmailFailed, {
        emailId: args.emailId,
        error: "ANTHROPIC_API_KEY not configured",
      });
      return;
    }

    // Get the email record
    const email = await ctx.runQuery(internal.email.inbound.getInboundEmail, {
      emailId: args.emailId,
    });

    if (!email) {
      console.error(`[Email Inbound] Email ${args.emailId} not found`);
      return;
    }

    try {
      // Fetch full email from Resend API
      // Note: Received emails use /emails/receiving/:id endpoint (not /emails/:id)
      const response = await fetch(
        `https://api.resend.com/emails/receiving/${email.resendEmailId}`,
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${errorText}`);
      }

      const emailData = await response.json();
      console.log(
        `[Email Inbound] Fetched email body for ${args.emailId}, has html: ${!!emailData.html}`
      );

      // Parse the email using Claude Haiku agent
      const { parseEmailWithAgent, toParserResult } =
        await import("./extraction/parser");

      // Prefer text for the agent (cleaner than HTML), but use HTML if no text
      const emailBody = emailData.text || emailData.html || "";

      const agentResult = await parseEmailWithAgent(
        {
          from: email.fromAddress,
          to: email.toAddress,
          subject: email.subject,
          body: emailBody,
        },
        anthropicApiKey
      );

      if (!agentResult.success) {
        console.warn(
          `[Email Inbound] Agent parsing failed for ${args.emailId}: ${agentResult.error}`
        );
        // Store the error but still mark as processed (with unknown type)
        await ctx.runMutation(internal.email.inbound.markEmailProcessed, {
          emailId: args.emailId,
          emailType: "unknown",
          parsedVendor: undefined,
          parsedOrderNumber: undefined,
          parsedTrackingNumber: undefined,
          extractionNotes: agentResult.error,
        });
        return;
      }

      const extracted = agentResult.data;
      const parsed = toParserResult(extracted);

      console.log(
        `[Email Inbound] Agent parsed email ${args.emailId}: type=${parsed.type}, vendor=${parsed.vendor}, order=${parsed.orderNumber || "none"}, items=${extracted.items.length}, confidence=${parsed.confidence}`
      );

      // Extract first tracking number if present
      const firstTracking = parsed.trackingNumbers?.[0];

      // Mark as processed with parsed data
      await ctx.runMutation(internal.email.inbound.markEmailProcessed, {
        emailId: args.emailId,
        emailType: parsed.type,
        parsedVendor: parsed.vendor,
        parsedOrderNumber: parsed.orderNumber,
        parsedTrackingNumber: firstTracking?.trackingNumber,
        parsedItems: extracted.items.length > 0 ? extracted.items : undefined,
        mentorNotes: extracted.mentorNotes,
        extractionNotes: extracted.extractionNotes,
        totalCents: extracted.totalCents,
      });

      // Find or create vendor based on extracted info
      // Creates team-specific vendor if teamId exists, otherwise global vendor
      if (extracted.vendorInfo) {
        await ctx.runMutation(internal.email.inbound.findOrCreateVendor, {
          teamId: email.teamId,
          vendorInfo: extracted.vendorInfo,
        });
      }

      // If we have an order number or tracking, try to link to existing orders
      if (email.teamId && (parsed.orderNumber || firstTracking)) {
        await ctx.runMutation(internal.email.inbound.tryLinkToOrder, {
          emailId: args.emailId,
          teamId: email.teamId,
          vendor: parsed.vendor,
          orderNumber: parsed.orderNumber,
          trackingNumber: firstTracking?.trackingNumber,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[Email Inbound] Failed to process email ${args.emailId}: ${message}`
      );
      await ctx.runMutation(internal.email.inbound.markEmailFailed, {
        emailId: args.emailId,
        error: message,
      });
    }
  },
});

/**
 * Get an inbound email by ID
 */
export const getInboundEmail = internalQuery({
  args: {
    emailId: v.id("inboundEmails"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.emailId);
  },
});

/**
 * Validator for line items extracted from emails
 */
const lineItemValidator = v.object({
  partNumber: v.optional(v.string()),
  description: v.string(),
  quantity: v.number(),
  unitPriceCents: v.optional(v.number()),
  forTeam: v.boolean(),
});

/**
 * Mark an email as processed
 */
export const markEmailProcessed = internalMutation({
  args: {
    emailId: v.id("inboundEmails"),
    emailType: v.string(),
    parsedVendor: v.optional(v.string()),
    parsedOrderNumber: v.optional(v.string()),
    parsedTrackingNumber: v.optional(v.string()),
    linkedOrderId: v.optional(v.id("orders")),
    // Agent extraction fields
    parsedItems: v.optional(v.array(lineItemValidator)),
    mentorNotes: v.optional(v.string()),
    extractionNotes: v.optional(v.string()),
    totalCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      status: "processed",
      emailType: args.emailType,
      parsedVendor: args.parsedVendor,
      parsedOrderNumber: args.parsedOrderNumber,
      parsedTrackingNumber: args.parsedTrackingNumber,
      linkedOrderId: args.linkedOrderId,
      // Agent extraction fields
      parsedItems: args.parsedItems,
      mentorNotes: args.mentorNotes,
      extractionNotes: args.extractionNotes,
      totalCents: args.totalCents,
      processedAt: Date.now(),
    });
  },
});

/**
 * Mark an email as failed
 */
export const markEmailFailed = internalMutation({
  args: {
    emailId: v.id("inboundEmails"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      status: "failed",
      processingError: args.error,
      processedAt: Date.now(),
    });
  },
});

/**
 * Try to link a parsed email to an existing order
 *
 * TODO: Orders schema needs vendorOrderNumber and trackingNumber fields
 * to enable automatic linking. For now, this just logs the parsed data.
 */
export const tryLinkToOrder = internalMutation({
  args: {
    emailId: v.id("inboundEmails"),
    teamId: v.id("teams"),
    vendor: v.string(),
    orderNumber: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // For now, just log the parsed data
    // Automatic order linking requires schema updates to the orders table
    console.log(
      `[Email Inbound] Parsed order data for email ${args.emailId}: ` +
        `vendor=${args.vendor}, orderNumber=${args.orderNumber || "none"}, ` +
        `tracking=${args.trackingNumber || "none"}`
    );

    // TODO: When orders schema has vendorOrderNumber and trackingNumber:
    // 1. Find order by vendorId + vendorOrderNumber
    // 2. Link email to order via linkedOrderId
    // 3. Update order with tracking number if present
    // 4. Trigger Discord notification about shipping update
  },
});

/**
 * Validator for vendor info extracted from emails
 */
const vendorInfoValidator = v.object({
  name: v.string(),
  domain: v.optional(v.string()),
  website: v.optional(v.string()),
  orderSupportEmail: v.optional(v.string()),
  orderSupportPhone: v.optional(v.string()),
  techSupportEmail: v.optional(v.string()),
  techSupportPhone: v.optional(v.string()),
  returnsContact: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
});

/**
 * Find or create a vendor based on extracted info from email
 *
 * Strategy:
 * 1. Find or create global vendor (by domain, then by name)
 * 2. If teamId provided, find or create teamVendor junction with team-specific info
 *
 * Always updates vendor/teamVendor with any new info found.
 */
export const findOrCreateVendor = internalMutation({
  args: {
    teamId: v.optional(v.id("teams")),
    vendorInfo: vendorInfoValidator,
  },
  handler: async (ctx, args) => {
    const { teamId, vendorInfo } = args;

    // 1. Try to find global vendor by domain first (most reliable match)
    let vendor = null;
    if (vendorInfo.domain) {
      vendor = await ctx.db
        .query("vendors")
        .withIndex("by_domain", (q) => q.eq("domain", vendorInfo.domain))
        .first();
    }

    // 2. If no domain match, try name match
    if (!vendor) {
      const allVendors = await ctx.db.query("vendors").collect();
      vendor = allVendors.find(
        (v) => v.name.toLowerCase() === vendorInfo.name.toLowerCase()
      );
    }

    // 3. If still no match, create new global vendor
    if (!vendor) {
      const vendorId = await ctx.db.insert("vendors", {
        name: vendorInfo.name,
        domain: vendorInfo.domain,
        website: vendorInfo.website,
        orderSupportEmail: vendorInfo.orderSupportEmail,
        orderSupportPhone: vendorInfo.orderSupportPhone,
        techSupportEmail: vendorInfo.techSupportEmail,
        techSupportPhone: vendorInfo.techSupportPhone,
        returnsContact: vendorInfo.returnsContact,
      });

      console.log(
        `[Email Inbound] Created new global vendor "${vendorInfo.name}" (${vendorId})`
      );

      // If we have team-specific info, create teamVendor junction
      if (teamId && vendorInfo.accountNumber) {
        await ctx.db.insert("teamVendors", {
          teamId,
          vendorId,
          accountNumber: vendorInfo.accountNumber,
        });
        console.log(
          `[Email Inbound] Created teamVendor link with account number`
        );
      }

      return vendorId;
    }

    // 4. Update existing vendor with any new PUBLIC info (don't overwrite existing values)
    const vendorUpdates: Record<string, string | undefined> = {};
    if (vendorInfo.domain && !vendor.domain)
      vendorUpdates.domain = vendorInfo.domain;
    if (vendorInfo.website && !vendor.website)
      vendorUpdates.website = vendorInfo.website;
    if (vendorInfo.orderSupportEmail && !vendor.orderSupportEmail)
      vendorUpdates.orderSupportEmail = vendorInfo.orderSupportEmail;
    if (vendorInfo.orderSupportPhone && !vendor.orderSupportPhone)
      vendorUpdates.orderSupportPhone = vendorInfo.orderSupportPhone;
    if (vendorInfo.techSupportEmail && !vendor.techSupportEmail)
      vendorUpdates.techSupportEmail = vendorInfo.techSupportEmail;
    if (vendorInfo.techSupportPhone && !vendor.techSupportPhone)
      vendorUpdates.techSupportPhone = vendorInfo.techSupportPhone;
    if (vendorInfo.returnsContact && !vendor.returnsContact)
      vendorUpdates.returnsContact = vendorInfo.returnsContact;

    if (Object.keys(vendorUpdates).length > 0) {
      await ctx.db.patch(vendor._id, vendorUpdates);
      console.log(
        `[Email Inbound] Updated vendor "${vendor.name}" with: ${Object.keys(vendorUpdates).join(", ")}`
      );
    }

    // 5. Handle team-specific info (account number) via teamVendors junction
    if (teamId && vendorInfo.accountNumber) {
      // Check if teamVendor junction exists
      const existingLink = await ctx.db
        .query("teamVendors")
        .withIndex("by_team_vendor", (q) =>
          q.eq("teamId", teamId).eq("vendorId", vendor._id)
        )
        .first();

      if (!existingLink) {
        // Create new junction
        await ctx.db.insert("teamVendors", {
          teamId,
          vendorId: vendor._id,
          accountNumber: vendorInfo.accountNumber,
        });
        console.log(
          `[Email Inbound] Created teamVendor link for "${vendor.name}" with account number`
        );
      } else if (!existingLink.accountNumber && vendorInfo.accountNumber) {
        // Update existing junction with account number
        await ctx.db.patch(existingLink._id, {
          accountNumber: vendorInfo.accountNumber,
        });
        console.log(
          `[Email Inbound] Updated teamVendor link for "${vendor.name}" with account number`
        );
      }
    }

    return vendor._id;
  },
});
