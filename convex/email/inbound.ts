import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  internalMutation,
  internalAction,
  internalQuery,
} from "../_generated/server";
import { v } from "convex/values";

/**
 * Verify Resend webhook signature using HMAC-SHA256
 *
 * Resend signs webhooks with the format: t=timestamp,v1=signature
 * We verify by computing HMAC-SHA256(timestamp.payload) with the webhook secret
 */
async function verifyResendSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  // Parse signature header: "t=timestamp,v1=signature"
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSignature = signaturePart.slice(3);

  // Check timestamp is within 5 minutes to prevent replay attacks
  const timestampMs = parseInt(timestamp) * 1000;
  const now = Date.now();
  if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    console.warn(
      "[Email Inbound] Webhook timestamp too old, possible replay attack"
    );
    return false;
  }

  // Compute HMAC-SHA256
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === expectedSignature;
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
  const signature = request.headers.get("svix-signature");

  // Verify webhook signature
  const isValid = await verifyResendSignature(body, signature, webhookSecret);
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
 * Process an inbound email - fetch body from Resend API and parse content
 */
export const processInboundEmail = internalAction({
  args: {
    emailId: v.id("inboundEmails"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Email Inbound] RESEND_API_KEY not configured");
      await ctx.runMutation(internal.email.inbound.markEmailFailed, {
        emailId: args.emailId,
        error: "RESEND_API_KEY not configured",
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
      // Note: Resend's inbound API endpoint for fetching received emails
      const response = await fetch(
        `https://api.resend.com/emails/${email.resendEmailId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
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

      // For now, just mark as processed - vendor parsing will be implemented later
      // TODO: Implement vendor-specific parsers (REV, goBILDA, AndyMark)
      await ctx.runMutation(internal.email.inbound.markEmailProcessed, {
        emailId: args.emailId,
        emailType: "unknown",
      });
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      status: "processed",
      emailType: args.emailType,
      parsedVendor: args.parsedVendor,
      parsedOrderNumber: args.parsedOrderNumber,
      parsedTrackingNumber: args.parsedTrackingNumber,
      linkedOrderId: args.linkedOrderId,
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
