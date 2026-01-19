/**
 * JSON Schema for Email Extraction
 *
 * This schema defines what we want Haiku to extract from vendor emails.
 * The agent approach allows:
 * - Any vendor without new parser code
 * - Mentor context understanding ("only the usb cam was for the team")
 * - Line item extraction for inventory tracking
 * - Robust parsing without fragile regexes
 */

import { z } from "zod";

// Helper to handle null from LLM output (converts null to undefined)
const nullish = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

/**
 * A single line item from an order
 */
export const LineItemSchema = z.object({
  /** Part number or SKU from the vendor */
  partNumber: nullish(z.string()),
  /** Human-readable description of the item */
  description: z.string(),
  /** Quantity ordered */
  quantity: z.number().int().positive(),
  /** Unit price in cents (e.g., 1299 = $12.99) */
  unitPriceCents: nullish(z.number().int()),
  /** Whether this item is for the team (based on mentor context) */
  forTeam: z.boolean().default(true),
});

export type LineItem = z.infer<typeof LineItemSchema>;

/**
 * Tracking information for a shipment
 */
export const TrackingInfoSchema = z.object({
  /** Carrier name: ups, fedex, usps, dhl, etc. */
  carrier: z.string(),
  /** The tracking number */
  trackingNumber: z.string(),
  /** Estimated delivery date if mentioned */
  estimatedDelivery: nullish(z.string()),
});

export type TrackingInfo = z.infer<typeof TrackingInfoSchema>;

/**
 * Vendor information extracted from emails
 * Used to auto-create/update vendor records with useful contact info
 */
export const VendorInfoSchema = z.object({
  /** Vendor name as it appears in the email */
  name: z.string(),
  /** Domain from the sender email (e.g., "revrobotics.com") */
  domain: nullish(z.string()),
  /** Vendor website URL if mentioned */
  website: nullish(z.string()),
  /** Order/sales support email if found */
  orderSupportEmail: nullish(z.string()),
  /** Order/sales support phone if found */
  orderSupportPhone: nullish(z.string()),
  /** Tech support email if found */
  techSupportEmail: nullish(z.string()),
  /** Tech support phone if found */
  techSupportPhone: nullish(z.string()),
  /** Returns/RMA email or URL if found */
  returnsContact: nullish(z.string()),
  /** Customer account number if visible in email */
  accountNumber: nullish(z.string()),
});

export type VendorInfo = z.infer<typeof VendorInfoSchema>;

/**
 * The complete extracted email data
 */
export const ExtractedEmailSchema = z.object({
  /** Type of email */
  emailType: z.enum([
    "order_confirmation",
    "shipping_notification",
    "delivery_confirmation",
    "order_update",
    "invoice",
    "unknown",
  ]),

  /** Vendor name (e.g., "REV Robotics", "goBILDA", "AndyMark", "Amazon") */
  vendor: z.string(),

  /** Detailed vendor info for auto-creating/updating vendor records */
  vendorInfo: VendorInfoSchema.optional(),

  /** Order number/ID from the vendor */
  orderNumber: nullish(z.string()),

  /** Order date if mentioned */
  orderDate: nullish(z.string()),

  /** Line items from the order */
  items: z.array(LineItemSchema).default([]),

  /** Subtotal in cents before tax/shipping */
  subtotalCents: nullish(z.number().int()),

  /** Tax amount in cents */
  taxCents: nullish(z.number().int()),

  /** Shipping cost in cents */
  shippingCents: nullish(z.number().int()),

  /** Total amount in cents */
  totalCents: nullish(z.number().int()),

  /** Tracking information for shipments */
  tracking: z.array(TrackingInfoSchema).default([]),

  /** Shipping address if mentioned */
  shippingAddress: nullish(z.string()),

  /** Any notes or context from the mentor who forwarded the email */
  mentorNotes: nullish(z.string()),

  /** Confidence score 0-1 for the extraction quality */
  confidence: z.number().min(0).max(1),

  /** Any warnings or notes about the extraction */
  extractionNotes: nullish(z.string()),
});

export type ExtractedEmail = z.infer<typeof ExtractedEmailSchema>;

/**
 * The JSON schema in a format suitable for the LLM prompt
 * This is what we'll include in the extraction prompt
 */
export const EXTRACTION_SCHEMA_DESCRIPTION = `
{
  "emailType": "order_confirmation" | "shipping_notification" | "delivery_confirmation" | "order_update" | "invoice" | "unknown",
  "vendor": "string - vendor name like 'REV Robotics', 'goBILDA', 'AndyMark', 'Amazon'",
  "vendorInfo": {
    "name": "string - vendor name",
    "domain": "string - domain from sender email (e.g., 'revrobotics.com')",
    "website": "string - vendor website URL if mentioned",
    "orderSupportEmail": "string - order/sales support email if found in email",
    "orderSupportPhone": "string - order/sales support phone if found",
    "techSupportEmail": "string - tech support email if found",
    "techSupportPhone": "string - tech support phone if found",
    "returnsContact": "string - returns/RMA email or URL if found",
    "accountNumber": "string - customer account number if visible in email"
  },
  "orderNumber": "string - the order ID/number from the vendor",
  "orderDate": "string - order date in ISO format if mentioned",
  "items": [
    {
      "partNumber": "string - SKU or part number",
      "description": "string - item description",
      "quantity": "number - quantity ordered",
      "unitPriceCents": "number - price in cents (e.g., 1299 for $12.99)",
      "forTeam": "boolean - true if this item is for the team, false if mentor says it's not"
    }
  ],
  "subtotalCents": "number - subtotal in cents before tax/shipping",
  "taxCents": "number - tax amount in cents",
  "shippingCents": "number - shipping cost in cents",
  "totalCents": "number - total order amount in cents",
  "tracking": [
    {
      "carrier": "string - carrier name: 'ups', 'fedex', 'usps', 'dhl'",
      "trackingNumber": "string - tracking number",
      "estimatedDelivery": "string - estimated delivery date if mentioned"
    }
  ],
  "shippingAddress": "string - shipping address if mentioned",
  "mentorNotes": "string - any notes from the forwarding mentor about this order",
  "confidence": "number 0-1 - how confident you are in this extraction",
  "extractionNotes": "string - any warnings or notes about unclear data"
}
`;

/**
 * Validates extracted email data against the schema
 */
export function validateExtraction(
  data: unknown
): { success: true; data: ExtractedEmail } | { success: false; error: string } {
  const result = ExtractedEmailSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
