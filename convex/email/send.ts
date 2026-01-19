import { components, internal } from "../_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { vOnEmailEventArgs } from "@convex-dev/resend";

/**
 * Resend client instance for BuildSeason
 *
 * Used for:
 * - Team invitations
 * - Mentor safety alerts
 * - Order notifications
 * - Shipping updates
 */
export const resend: Resend = new Resend(components.resend, {
  testMode: false,
  // Wire up delivery status webhook handler
  onEmailEvent: internal.email.send.handleEmailEvent,
});

/**
 * Handle email delivery status events from Resend webhook
 */
export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (_ctx, args) => {
    // Log email events for debugging and monitoring
    console.log(`[Email] Event received: ${args.event.type} for ${args.id}`);

    // Handle bounces and complaints for potential cleanup
    if (args.event.type === "email.bounced") {
      console.warn(`[Email] Bounced: ${args.id}`);
      // TODO: Could track bounced addresses to prevent re-sending
    }

    if (args.event.type === "email.complained") {
      console.warn(`[Email] Spam complaint: ${args.id}`);
      // TODO: Could track complaints for compliance
    }
  },
});

/**
 * Send a team invitation email
 */
export const sendTeamInvite = internalMutation({
  args: {
    to: v.string(),
    teamName: v.string(),
    teamNumber: v.string(),
    inviteUrl: v.string(),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const emailId = await resend.sendEmail(ctx, {
      from: "BuildSeason <noreply@buildseason.org>",
      to: args.to,
      subject: `You're invited to join ${args.teamName} on BuildSeason`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Join ${args.teamName}</h1>
          <p>${args.invitedBy} has invited you to join <strong>Team ${args.teamNumber} - ${args.teamName}</strong> on BuildSeason.</p>
          <p>BuildSeason helps FTC teams manage their inventory, orders, and team coordination through an AI-powered assistant.</p>
          <a href="${args.inviteUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">This invitation link expires in 7 days.</p>
        </div>
      `,
    });

    console.log(`[Email] Team invite sent to ${args.to}, emailId: ${emailId}`);
    return emailId;
  },
});

/**
 * Send a mentor safety alert email
 */
export const sendMentorAlert = internalMutation({
  args: {
    to: v.string(),
    mentorName: v.string(),
    teamName: v.string(),
    alertType: v.string(),
    severity: v.string(),
    triggerReason: v.string(),
    reviewUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const severityColors: Record<string, string> = {
      high: "#dc2626",
      medium: "#f59e0b",
      low: "#3b82f6",
    };
    const severityColor = severityColors[args.severity] || "#666";

    const emailId = await resend.sendEmail(ctx, {
      from: "BuildSeason Safety <safety@buildseason.org>",
      to: args.to,
      subject: `[${args.severity.toUpperCase()}] Safety Alert for ${args.teamName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${severityColor}; color: white; padding: 12px 16px; border-radius: 6px 6px 0 0;">
            <strong>${args.severity.toUpperCase()} SEVERITY ALERT</strong>
          </div>
          <div style="border: 1px solid #e5e5e5; border-top: none; padding: 16px; border-radius: 0 0 6px 6px;">
            <p>Hi ${args.mentorName},</p>
            <p>A safety alert has been triggered for <strong>${args.teamName}</strong>.</p>
            <p><strong>Alert Type:</strong> ${args.alertType}</p>
            <p><strong>Reason:</strong> ${args.triggerReason}</p>
            <a href="${args.reviewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
              Review Alert
            </a>
            <p style="color: #666; font-size: 14px;">Please review this alert as soon as possible.</p>
          </div>
        </div>
      `,
    });

    console.log(
      `[Email] Mentor alert sent to ${args.to}, severity: ${args.severity}, emailId: ${emailId}`
    );
    return emailId;
  },
});

/**
 * Send an order notification email
 */
export const sendOrderNotification = internalMutation({
  args: {
    to: v.string(),
    teamName: v.string(),
    orderNumber: v.string(),
    vendorName: v.string(),
    totalCents: v.number(),
    status: v.string(),
    viewUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const statusMessages: Record<string, string> = {
      approved: "has been approved",
      rejected: "has been rejected",
      ordered: "has been placed with the vendor",
      received: "has been received",
    };
    const statusMessage = statusMessages[args.status] || "has been updated";

    const emailId = await resend.sendEmail(ctx, {
      from: "BuildSeason <orders@buildseason.org>",
      to: args.to,
      subject: `Order ${args.orderNumber} ${statusMessage}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Order Update</h1>
          <p>Order <strong>#${args.orderNumber}</strong> for <strong>${args.teamName}</strong> ${statusMessage}.</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Vendor:</strong> ${args.vendorName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Total:</strong> $${(args.totalCents / 100).toFixed(2)}</p>
          </div>
          <a href="${args.viewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Order
          </a>
        </div>
      `,
    });

    console.log(
      `[Email] Order notification sent to ${args.to}, order: ${args.orderNumber}, emailId: ${emailId}`
    );
    return emailId;
  },
});
