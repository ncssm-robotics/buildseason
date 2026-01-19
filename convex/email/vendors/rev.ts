/**
 * REV Robotics Email Parser
 *
 * Parses order confirmations and shipping notifications from REV Robotics.
 * REV is one of the primary FTC parts vendors.
 *
 * Common email patterns:
 * - Order confirmation: "Your REV Robotics Order #123456"
 * - Shipping notification: "Your REV Robotics order has shipped"
 */

import type {
  EmailContent,
  ParsedEmail,
  TrackingInfo,
  VendorParser,
} from "./types";
import { isFromDomain } from "./index";

/**
 * Extract order number from REV email
 * Patterns:
 * - "Order #123456"
 * - "Order Number: 123456"
 * - "order_id=123456"
 */
function extractOrderNumber(email: EmailContent): string | undefined {
  const content = email.html || email.text || "";
  const subject = email.subject || "";

  // Try subject first
  let match = subject.match(/Order\s*#?\s*(\d+)/i);
  if (match) return match[1];

  // Try body patterns
  match = content.match(/Order\s*(?:#|Number:?)\s*(\d+)/i);
  if (match) return match[1];

  match = content.match(/order_id[=:]\s*(\d+)/i);
  if (match) return match[1];

  return undefined;
}

/**
 * Extract tracking numbers from REV shipping email
 */
function extractTrackingNumbers(email: EmailContent): TrackingInfo[] {
  const content = email.html || email.text || "";
  const trackingNumbers: TrackingInfo[] = [];

  // UPS tracking: 1Z followed by alphanumeric
  const upsMatches = content.matchAll(/\b(1Z[A-Z0-9]{16,18})\b/gi);
  for (const match of upsMatches) {
    trackingNumbers.push({
      carrier: "ups",
      trackingNumber: match[1].toUpperCase(),
      trackingUrl: `https://www.ups.com/track?tracknum=${match[1]}`,
    });
  }

  // FedEx tracking: 12-34 digits
  const fedexMatches = content.matchAll(
    /\b(\d{12,22})\b(?=.*(?:fedex|tracking))/gi
  );
  for (const match of fedexMatches) {
    trackingNumbers.push({
      carrier: "fedex",
      trackingNumber: match[1],
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${match[1]}`,
    });
  }

  // USPS tracking: 20-22 digits or specific formats
  const uspsMatches = content.matchAll(/\b((?:94|93|92|94|95)\d{18,20})\b/g);
  for (const match of uspsMatches) {
    trackingNumbers.push({
      carrier: "usps",
      trackingNumber: match[1],
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${match[1]}`,
    });
  }

  return trackingNumbers;
}

/**
 * Extract order total from email
 */
function extractTotal(email: EmailContent): number | undefined {
  const content = email.html || email.text || "";

  // Match patterns like "Total: $123.45" or "Order Total: $123.45"
  const match = content.match(/(?:Order\s+)?Total:?\s*\$?([\d,]+\.?\d*)/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ""));
    if (!isNaN(amount)) {
      return Math.round(amount * 100);
    }
  }

  return undefined;
}

/**
 * Determine email type from content
 */
function determineEmailType(
  email: EmailContent
): "order_confirmation" | "shipping_notification" | "unknown" {
  const subject = (email.subject || "").toLowerCase();
  const content = (email.html || email.text || "").toLowerCase();

  // Shipping indicators
  if (
    subject.includes("shipped") ||
    subject.includes("shipping") ||
    subject.includes("on its way") ||
    content.includes("has shipped") ||
    content.includes("tracking number")
  ) {
    return "shipping_notification";
  }

  // Order confirmation indicators
  if (
    subject.includes("order confirmation") ||
    subject.includes("order received") ||
    subject.includes("thank you for your order") ||
    content.includes("order confirmation") ||
    content.includes("we received your order")
  ) {
    return "order_confirmation";
  }

  return "unknown";
}

export const revParser: VendorParser = {
  vendorId: "rev",
  vendorName: "REV Robotics",
  domains: ["revrobotics.com"],

  canHandle(email: EmailContent): boolean {
    return isFromDomain(email.from, "revrobotics.com");
  },

  async parse(email: EmailContent): Promise<ParsedEmail> {
    const emailType = determineEmailType(email);
    const orderNumber = extractOrderNumber(email);
    const trackingNumbers = extractTrackingNumbers(email);
    const totalCents = extractTotal(email);

    // Calculate confidence based on what we extracted
    let confidence = 0.5; // Base confidence for matching domain
    if (orderNumber) confidence += 0.2;
    if (emailType !== "unknown") confidence += 0.2;
    if (trackingNumbers.length > 0) confidence += 0.1;

    return {
      type: emailType,
      vendor: "rev",
      orderNumber,
      trackingNumbers: trackingNumbers.length > 0 ? trackingNumbers : undefined,
      totalCents,
      confidence: Math.min(confidence, 1),
    };
  },
};
