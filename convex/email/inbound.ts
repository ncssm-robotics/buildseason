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
      // Note: Received emails use /emails/receiving/:id endpoint (not /emails/:id)
      const response = await fetch(
        `https://api.resend.com/emails/receiving/${email.resendEmailId}`,
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
