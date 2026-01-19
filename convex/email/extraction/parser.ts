/**
 * Agent-based Email Parser
 *
 * Uses Claude Haiku to extract structured data from vendor emails.
 * This approach is more robust than regex-based parsing because:
 * - Works with any vendor without new parser code
 * - Understands mentor context ("only the usb cam was for 5064")
 * - Extracts line items for inventory tracking
 * - Handles variations in email formatting gracefully
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  type ExtractedEmail,
  EXTRACTION_SCHEMA_DESCRIPTION,
  validateExtraction,
} from "./schema";

const EXTRACTION_SYSTEM_PROMPT = `You are an email parsing assistant for BuildSeason, a platform that helps FTC robotics teams track orders and inventory.

Your task is to extract structured data from vendor order emails. These emails are typically forwarded by team mentors and may include notes about which items are for the team.

IMPORTANT CONTEXT:
- FTC teams order parts from vendors like REV Robotics, goBILDA, AndyMark, Amazon, etc.
- Mentors often forward order confirmations and shipping notifications to track team purchases
- Sometimes a mentor's personal order includes items for multiple purposes - pay attention to any notes about which items are specifically for the team
- If the mentor says something like "only the USB cam was for the team" or "ignore the batteries, those are for another project", mark those items appropriately with forTeam: false

EXTRACTION RULES:
1. Extract ALL line items you can find, with part numbers when available
2. Convert all prices to cents (e.g., $12.99 becomes 1299)
3. For tracking numbers, identify the carrier (UPS starts with 1Z, FedEx is 12-22 digits, USPS starts with 94/93/92)
4. If the email is forwarded, look for the original vendor sender in the forwarded headers
5. Set confidence based on how complete/clear the extraction is
6. Use extractionNotes to flag any unclear or missing data

VENDOR INFO EXTRACTION:
Extract as much vendor contact info as you can find - this helps mentors contact vendors later:
- domain: Extract from the original sender's email address (e.g., "orders@revrobotics.com" -> "revrobotics.com")
- website: Look for website URLs in the email body or signature
- orderSupportEmail/Phone: Look for "order questions" or "customer service" contacts
- techSupportEmail/Phone: Look for "technical support" or "product questions" contacts
- returnsContact: Look for returns/RMA policy links or email addresses
- accountNumber: If the email shows "Account #" or "Customer ID", extract it

This info will be used to auto-create vendor records so agents can help mentors track down orders later.

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema, no other text:
${EXTRACTION_SCHEMA_DESCRIPTION}`;

const EXTRACTION_USER_PROMPT = `Extract data from this email. Return ONLY valid JSON, no explanation or markdown.

---EMAIL START---
From: {from}
To: {to}
Subject: {subject}

{body}
---EMAIL END---`;

export interface EmailInput {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface ParseResult {
  success: true;
  data: ExtractedEmail;
}

export interface ParseError {
  success: false;
  error: string;
  rawResponse?: string;
}

export type ParseEmailResult = ParseResult | ParseError;

/**
 * Parse an email using Claude Haiku
 *
 * @param email The email content to parse
 * @param apiKey The Anthropic API key
 * @returns Extracted email data or an error
 */
export async function parseEmailWithAgent(
  email: EmailInput,
  apiKey: string
): Promise<ParseEmailResult> {
  const client = new Anthropic({ apiKey });

  // Build the user prompt with the email content
  const userPrompt = EXTRACTION_USER_PROMPT.replace("{from}", email.from)
    .replace("{to}", email.to)
    .replace("{subject}", email.subject)
    .replace("{body}", email.body);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract the text response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text response from model",
      };
    }

    const rawResponse = textContent.text.trim();

    // Try to parse the JSON
    // Sometimes the model wraps in ```json blocks, so strip those
    let jsonStr = rawResponse;
    if (jsonStr.startsWith("```")) {
      const lines = jsonStr.split("\n");
      // Remove first line (```json) and last line (```)
      jsonStr = lines.slice(1, -1).join("\n");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return {
        success: false,
        error: `Invalid JSON response: ${jsonStr.substring(0, 200)}...`,
        rawResponse,
      };
    }

    // Validate against our schema
    const validation = validateExtraction(parsed);
    if (!validation.success) {
      return {
        success: false,
        error: `Schema validation failed: ${validation.error}`,
        rawResponse,
      };
    }

    return {
      success: true,
      data: validation.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `API call failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Convert the agent extraction result to the format expected by the existing system
 * This provides backwards compatibility with the current inbound processor
 */
export function toParserResult(extraction: ExtractedEmail) {
  return {
    type: extraction.emailType,
    vendor: extraction.vendor.toLowerCase().replace(/\s+/g, "_"),
    orderNumber: extraction.orderNumber,
    trackingNumbers:
      extraction.tracking.length > 0
        ? extraction.tracking.map((t) => ({
            carrier: t.carrier,
            trackingNumber: t.trackingNumber,
            trackingUrl: buildTrackingUrl(t.carrier, t.trackingNumber),
          }))
        : undefined,
    totalCents: extraction.totalCents,
    items: extraction.items,
    confidence: extraction.confidence,
    // Additional data from agent extraction
    mentorNotes: extraction.mentorNotes,
    extractionNotes: extraction.extractionNotes,
  };
}

function buildTrackingUrl(carrier: string, trackingNumber: string): string {
  const c = carrier.toLowerCase();
  if (c === "ups") {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  }
  if (c === "fedex") {
    return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  }
  if (c === "usps") {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  }
  if (c === "dhl") {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
  }
  return "";
}
