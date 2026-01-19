/**
 * Shipping Carrier Email Parser
 *
 * Parses shipping notifications directly from carriers:
 * - UPS: ups.com
 * - FedEx: fedex.com
 * - USPS: usps.com, usps.gov
 *
 * These are shipping-only notifications (no order details).
 * Used to update tracking status on existing orders.
 */

import type {
  EmailContent,
  ParsedEmail,
  TrackingInfo,
  VendorParser,
} from "./types";
import { isFromDomain } from "./index";

/**
 * Extract UPS tracking numbers
 */
function extractUpsTracking(content: string): TrackingInfo[] {
  const tracking: TrackingInfo[] = [];
  const matches = content.matchAll(/\b(1Z[A-Z0-9]{16,18})\b/gi);
  for (const match of matches) {
    tracking.push({
      carrier: "ups",
      trackingNumber: match[1].toUpperCase(),
      trackingUrl: `https://www.ups.com/track?tracknum=${match[1]}`,
    });
  }
  return tracking;
}

/**
 * Extract FedEx tracking numbers
 */
function extractFedexTracking(content: string): TrackingInfo[] {
  const tracking: TrackingInfo[] = [];

  // FedEx Ground/Express: 12-15 digits
  const matches12 = content.matchAll(/\b(\d{12,15})\b/g);
  for (const match of matches12) {
    tracking.push({
      carrier: "fedex",
      trackingNumber: match[1],
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${match[1]}`,
    });
  }

  // FedEx Express: 34 digits (older format)
  const matches34 = content.matchAll(/\b(\d{34})\b/g);
  for (const match of matches34) {
    tracking.push({
      carrier: "fedex",
      trackingNumber: match[1],
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${match[1]}`,
    });
  }

  return tracking;
}

/**
 * Extract USPS tracking numbers
 */
function extractUspsTracking(content: string): TrackingInfo[] {
  const tracking: TrackingInfo[] = [];

  // USPS: 20-22 digits starting with 94, 93, 92, or 95
  const matches = content.matchAll(/\b((?:94|93|92|95)\d{18,20})\b/g);
  for (const match of matches) {
    tracking.push({
      carrier: "usps",
      trackingNumber: match[1],
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${match[1]}`,
    });
  }

  // USPS Priority Mail Express: Starts with EA, EB, EC
  const priorityMatches = content.matchAll(/\b(E[ABC]\d{9}US)\b/gi);
  for (const match of priorityMatches) {
    tracking.push({
      carrier: "usps",
      trackingNumber: match[1].toUpperCase(),
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${match[1]}`,
    });
  }

  return tracking;
}

/**
 * Determine carrier from email
 */
function detectCarrier(email: EmailContent): "ups" | "fedex" | "usps" | null {
  const from = email.from.toLowerCase();

  if (isFromDomain(from, "ups.com")) return "ups";
  if (isFromDomain(from, "fedex.com")) return "fedex";
  if (isFromDomain(from, "usps.com") || isFromDomain(from, "usps.gov"))
    return "usps";

  return null;
}

/**
 * Extract delivery estimate from email
 */
function extractDeliveryEstimate(email: EmailContent): string | undefined {
  const content = email.html || email.text || "";

  // Common patterns: "Scheduled Delivery: Monday, 01/20/2025"
  const patterns = [
    /Scheduled Delivery:?\s*([A-Za-z]+,?\s*\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /Expected Delivery:?\s*([A-Za-z]+,?\s*\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /Delivery:?\s*([A-Za-z]+,?\s*\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /arriving\s+([A-Za-z]+,?\s*[A-Za-z]+\s+\d{1,2})/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

export const carrierParser: VendorParser = {
  vendorId: "carrier",
  vendorName: "Shipping Carrier",
  domains: ["ups.com", "fedex.com", "usps.com", "usps.gov"],

  canHandle(email: EmailContent): boolean {
    return detectCarrier(email) !== null;
  },

  async parse(email: EmailContent): Promise<ParsedEmail> {
    const carrier = detectCarrier(email);
    const content = email.html || email.text || "";

    let trackingNumbers: TrackingInfo[] = [];

    switch (carrier) {
      case "ups":
        trackingNumbers = extractUpsTracking(content);
        break;
      case "fedex":
        trackingNumbers = extractFedexTracking(content);
        break;
      case "usps":
        trackingNumbers = extractUspsTracking(content);
        break;
    }

    const estimatedDelivery = extractDeliveryEstimate(email);

    // Carrier emails are always shipping notifications
    return {
      type: "shipping_notification",
      vendor: carrier || "carrier",
      trackingNumbers: trackingNumbers.length > 0 ? trackingNumbers : undefined,
      estimatedDelivery,
      confidence: trackingNumbers.length > 0 ? 0.9 : 0.5,
    };
  },
};
