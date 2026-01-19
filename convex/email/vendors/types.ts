/**
 * Vendor Email Parser Types
 *
 * Common types for parsing order confirmations and shipping notifications
 * from FTC robotics parts vendors.
 */

/**
 * Result of parsing an email
 */
export interface ParsedEmail {
  /** Type of email: order_confirmation, shipping_notification, or unknown */
  type: "order_confirmation" | "shipping_notification" | "unknown";

  /** Vendor identifier (rev, gobilda, andymark) */
  vendor: string;

  /** Order number extracted from email */
  orderNumber?: string;

  /** Tracking number(s) extracted from email */
  trackingNumbers?: TrackingInfo[];

  /** Order total in cents (if available) */
  totalCents?: number;

  /** Estimated delivery date (if available) */
  estimatedDelivery?: string;

  /** Raw items list (if parseable) */
  items?: ParsedItem[];

  /** Confidence score 0-1 for the parse result */
  confidence: number;
}

/**
 * Tracking information extracted from shipping emails
 */
export interface TrackingInfo {
  carrier: "ups" | "fedex" | "usps" | "other";
  trackingNumber: string;
  trackingUrl?: string;
}

/**
 * Parsed line item from order confirmation
 */
export interface ParsedItem {
  sku?: string;
  name: string;
  quantity: number;
  priceCents?: number;
}

/**
 * Email content passed to parsers
 */
export interface EmailContent {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Interface that all vendor parsers must implement
 */
export interface VendorParser {
  /** Vendor identifier */
  vendorId: string;

  /** Human-readable vendor name */
  vendorName: string;

  /** Email domains this parser handles */
  domains: string[];

  /** Check if this parser can handle the given email */
  canHandle(email: EmailContent): boolean;

  /** Parse the email and extract structured data */
  parse(email: EmailContent): Promise<ParsedEmail>;
}
