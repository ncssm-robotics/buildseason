/**
 * Vendor Email Parser Registry
 *
 * Central registry for all vendor email parsers.
 * Routes incoming emails to the appropriate parser based on sender domain.
 *
 * Handles forwarded emails: When a mentor forwards a vendor email,
 * we parse the forwarded content to find the original sender.
 */

import type { EmailContent, ParsedEmail, VendorParser } from "./types";
import { revParser } from "./rev";
import { gobildaParser } from "./gobilda";
import { andymarkParser } from "./andymark";
import { carrierParser } from "./carriers";
import {
  isForwardedEmail,
  parseForwardedEmail,
  extractOriginalEmail,
} from "./forwarded";

/**
 * All registered vendor parsers
 */
const parsers: VendorParser[] = [
  revParser,
  gobildaParser,
  andymarkParser,
  carrierParser,
];

/**
 * Find a parser that can handle the given email
 */
export function findParser(email: EmailContent): VendorParser | null {
  for (const parser of parsers) {
    if (parser.canHandle(email)) {
      return parser;
    }
  }
  return null;
}

/**
 * Parse an email using the appropriate vendor parser
 *
 * Handles both direct emails and forwarded emails:
 * 1. For direct emails from vendors - routes based on From address
 * 2. For forwarded emails - extracts original sender and content first
 */
export async function parseEmail(email: EmailContent): Promise<ParsedEmail> {
  // First, try direct parsing (email is from vendor)
  let parser = findParser(email);
  let emailToProcess = email;

  // If no direct match and email looks forwarded, try to extract original
  if (!parser && isForwardedEmail(email)) {
    console.log("[Email Parser] Detected forwarded email, extracting original");

    const forwarded = parseForwardedEmail(email);
    if (forwarded) {
      console.log(
        `[Email Parser] Extracted original from: ${forwarded.originalFrom}`
      );

      // Create email content from the forwarded original
      emailToProcess = extractOriginalEmail(forwarded, email);

      // Try to find parser for the original sender
      parser = findParser(emailToProcess);
    } else {
      console.log("[Email Parser] Could not extract forwarded content");
    }
  }

  if (!parser) {
    return {
      type: "unknown",
      vendor: "unknown",
      confidence: 0,
    };
  }

  try {
    const result = await parser.parse(emailToProcess);
    console.log(
      `[Email Parser] Parsed with ${parser.vendorId}: type=${result.type}, order=${result.orderNumber || "none"}`
    );
    return result;
  } catch (error) {
    console.error(
      `[Email Parser] Error parsing with ${parser.vendorId}:`,
      error
    );
    return {
      type: "unknown",
      vendor: parser.vendorId,
      confidence: 0,
    };
  }
}

/**
 * Get domain from email address
 */
export function getDomainFromEmail(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Check if email is from a specific domain or subdomain
 */
export function isFromDomain(email: string, domain: string): boolean {
  const fromDomain = getDomainFromEmail(email);
  return fromDomain === domain || fromDomain.endsWith(`.${domain}`);
}
