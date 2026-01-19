/**
 * Vendor Email Parser Registry
 *
 * Central registry for all vendor email parsers.
 * Routes incoming emails to the appropriate parser based on sender domain.
 */

import type { EmailContent, ParsedEmail, VendorParser } from "./types";
import { revParser } from "./rev";
import { gobildaParser } from "./gobilda";
import { andymarkParser } from "./andymark";
import { carrierParser } from "./carriers";

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
 */
export async function parseEmail(email: EmailContent): Promise<ParsedEmail> {
  const parser = findParser(email);

  if (!parser) {
    return {
      type: "unknown",
      vendor: "unknown",
      confidence: 0,
    };
  }

  try {
    return await parser.parse(email);
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
