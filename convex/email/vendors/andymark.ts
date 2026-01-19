/**
 * AndyMark Email Parser
 *
 * Parses order confirmations and shipping notifications from AndyMark.
 * AndyMark is a major FTC/FRC vendor with a wide product catalog.
 *
 * Common email patterns:
 * - Order confirmation: "AndyMark Order Confirmation"
 * - Shipping notification: "Your AndyMark order has shipped"
 */

import type {
  EmailContent,
  ParsedEmail,
  TrackingInfo,
  VendorParser,
} from "./types";
import { isFromDomain } from "./index";

/**
 * Extract order number from AndyMark email
 * AndyMark uses numeric order IDs like "12345678"
 */
function extractOrderNumber(email: EmailContent): string | undefined {
  const content = email.html || email.text || "";
  const subject = email.subject || "";

  // Try subject first
  let match = subject.match(/Order\s*#?\s*(\d+)/i);
  if (match) return match[1];

  // Try body patterns - AndyMark may use "Order Number" or just "Order #"
  match = content.match(/Order\s*(?:#|Number:?)\s*(\d+)/i);
  if (match) return match[1];

  // Invoice number pattern
  match = content.match(/Invoice\s*(?:#|Number:?)\s*(\d+)/i);
  if (match) return match[1];

  return undefined;
}

/**
 * Extract tracking numbers from AndyMark shipping email
 */
function extractTrackingNumbers(email: EmailContent): TrackingInfo[] {
  const content = email.html || email.text || "";
  const trackingNumbers: TrackingInfo[] = [];

  // UPS tracking
  const upsMatches = content.matchAll(/\b(1Z[A-Z0-9]{16,18})\b/gi);
  for (const match of upsMatches) {
    trackingNumbers.push({
      carrier: "ups",
      trackingNumber: match[1].toUpperCase(),
      trackingUrl: `https://www.ups.com/track?tracknum=${match[1]}`,
    });
  }

  // FedEx tracking - AndyMark often uses FedEx
  const fedexMatches = content.matchAll(
    /(?:fedex|tracking)[^\d]*(\d{12,22})/gi
  );
  for (const match of fedexMatches) {
    trackingNumbers.push({
      carrier: "fedex",
      trackingNumber: match[1],
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${match[1]}`,
    });
  }

  // Also try to find FedEx numbers near "tracking" keywords
  const fedexAltMatches = content.matchAll(/tracking[^0-9]*(\d{12,15})/gi);
  for (const match of fedexAltMatches) {
    // Avoid duplicates
    if (!trackingNumbers.some((t) => t.trackingNumber === match[1])) {
      trackingNumbers.push({
        carrier: "fedex",
        trackingNumber: match[1],
        trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${match[1]}`,
      });
    }
  }

  // USPS tracking
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

  // AndyMark patterns - often shows "Grand Total"
  const match = content.match(/(?:Grand\s+)?Total:?\s*\$?([\d,]+\.?\d*)/i);
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

  if (
    subject.includes("shipped") ||
    subject.includes("shipping") ||
    subject.includes("on the way") ||
    content.includes("has shipped") ||
    content.includes("tracking number")
  ) {
    return "shipping_notification";
  }

  if (
    subject.includes("order confirmation") ||
    subject.includes("order received") ||
    subject.includes("thank you for your order") ||
    content.includes("order confirmation")
  ) {
    return "order_confirmation";
  }

  return "unknown";
}

export const andymarkParser: VendorParser = {
  vendorId: "andymark",
  vendorName: "AndyMark",
  domains: ["andymark.com"],

  canHandle(email: EmailContent): boolean {
    return isFromDomain(email.from, "andymark.com");
  },

  async parse(email: EmailContent): Promise<ParsedEmail> {
    const emailType = determineEmailType(email);
    const orderNumber = extractOrderNumber(email);
    const trackingNumbers = extractTrackingNumbers(email);
    const totalCents = extractTotal(email);

    let confidence = 0.5;
    if (orderNumber) confidence += 0.2;
    if (emailType !== "unknown") confidence += 0.2;
    if (trackingNumbers.length > 0) confidence += 0.1;

    return {
      type: emailType,
      vendor: "andymark",
      orderNumber,
      trackingNumbers: trackingNumbers.length > 0 ? trackingNumbers : undefined,
      totalCents,
      confidence: Math.min(confidence, 1),
    };
  },
};
