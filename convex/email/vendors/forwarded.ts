/**
 * Forwarded Email Parser
 *
 * Detects and parses forwarded emails to extract the original sender
 * and content. Supports common email client formats:
 * - Gmail: "---------- Forwarded message ---------"
 * - Outlook: "-----Original Message-----" or "From:" header block
 * - Apple Mail: "Begin forwarded message:"
 * - Generic: "From:" followed by email address
 */

import type { EmailContent } from "./types";

/**
 * Extracted forwarded email content
 */
export interface ForwardedEmailContent {
  /** Original sender email address */
  originalFrom: string;
  /** Original subject line */
  originalSubject?: string;
  /** Original date */
  originalDate?: string;
  /** The forwarded body content (everything after the forward header) */
  originalBody: string;
  /** Whether HTML content was found */
  isHtml: boolean;
}

/**
 * Patterns for detecting forwarded emails
 */
const FORWARD_PATTERNS = {
  // Gmail: "---------- Forwarded message ---------"
  gmail: /[-]{5,}\s*Forwarded message\s*[-]{5,}/i,

  // Outlook: "-----Original Message-----"
  outlook: /[-]{5,}\s*Original Message\s*[-]{5,}/i,

  // Apple Mail: "Begin forwarded message:"
  apple: /Begin forwarded message:/i,

  // Generic forward indicators in subject
  subjectFwd: /^(Fwd?|Fw):\s*/i,
};

/**
 * Extract email address from a "From:" line
 * Handles formats like:
 * - "Name <email@domain.com>"
 * - "email@domain.com"
 * - "<email@domain.com>"
 */
function extractEmailAddress(fromLine: string): string | null {
  // Try to extract from angle brackets first
  const bracketMatch = fromLine.match(/<([^>]+@[^>]+)>/);
  if (bracketMatch) {
    return bracketMatch[1].toLowerCase();
  }

  // Try bare email address
  const emailMatch = fromLine.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  if (emailMatch) {
    return emailMatch[1].toLowerCase();
  }

  return null;
}

/**
 * Parse forwarded email headers from content
 * Returns the original From, Subject, Date and the position where headers end
 */
function parseForwardHeaders(
  content: string,
  startPos: number
): {
  from?: string;
  subject?: string;
  date?: string;
  headerEndPos: number;
} {
  const result: {
    from?: string;
    subject?: string;
    date?: string;
    headerEndPos: number;
  } = { headerEndPos: startPos };

  // Look for header lines after the forward marker
  const headerSection = content.slice(startPos, startPos + 1000);
  const lines = headerSection.split(/\r?\n/);

  let lastHeaderLine = 0;
  for (let i = 0; i < lines.length && i < 20; i++) {
    const line = lines[i].trim();

    // Stop at empty line or start of body content
    if (line === "" && i > 0) {
      lastHeaderLine = i;
      break;
    }

    // Parse header lines
    const fromMatch = line.match(/^From:\s*(.+)/i);
    if (fromMatch) {
      const email = extractEmailAddress(fromMatch[1]);
      if (email) result.from = email;
      lastHeaderLine = i + 1;
      continue;
    }

    const subjectMatch = line.match(/^Subject:\s*(.+)/i);
    if (subjectMatch) {
      result.subject = subjectMatch[1].trim();
      lastHeaderLine = i + 1;
      continue;
    }

    const dateMatch = line.match(/^Date:\s*(.+)/i);
    if (dateMatch) {
      result.date = dateMatch[1].trim();
      lastHeaderLine = i + 1;
      continue;
    }

    // Also check for "Sent:" (Outlook style)
    const sentMatch = line.match(/^Sent:\s*(.+)/i);
    if (sentMatch) {
      result.date = sentMatch[1].trim();
      lastHeaderLine = i + 1;
      continue;
    }
  }

  // Calculate where headers end
  let pos = startPos;
  for (let i = 0; i <= lastHeaderLine && i < lines.length; i++) {
    pos += lines[i].length + 1; // +1 for newline
  }
  result.headerEndPos = pos;

  return result;
}

/**
 * Parse HTML forwarded email
 * HTML forwards often have the headers in structured elements
 */
function parseHtmlForward(html: string): ForwardedEmailContent | null {
  // Try to find forward markers in HTML
  let markerPos = -1;

  // Check for Gmail forward
  const gmailMatch = html.match(FORWARD_PATTERNS.gmail);
  if (gmailMatch && gmailMatch.index !== undefined) {
    markerPos = gmailMatch.index + gmailMatch[0].length;
  }

  // Check for Outlook forward
  if (markerPos === -1) {
    const outlookMatch = html.match(FORWARD_PATTERNS.outlook);
    if (outlookMatch && outlookMatch.index !== undefined) {
      markerPos = outlookMatch.index + outlookMatch[0].length;
    }
  }

  // Check for Apple forward
  if (markerPos === -1) {
    const appleMatch = html.match(FORWARD_PATTERNS.apple);
    if (appleMatch && appleMatch.index !== undefined) {
      markerPos = appleMatch.index + appleMatch[0].length;
    }
  }

  if (markerPos === -1) {
    // Try to find a From: header that looks like vendor email
    const vendorFromMatch = html.match(
      /From:\s*[^<]*<([^>]*(?:revrobotics|gobilda|andymark|ups|fedex|usps)[^>]*)>/i
    );
    if (vendorFromMatch && vendorFromMatch.index !== undefined) {
      markerPos = vendorFromMatch.index;
    }
  }

  if (markerPos === -1) {
    return null;
  }

  // Strip HTML tags for easier header parsing
  // First decode HTML entities, then strip tags
  const textContent = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .replace(/ \n/g, "\n")
    .replace(/\n /g, "\n");

  // Re-check for forward markers in the decoded text
  let textMarkerPos = -1;
  const gmailTextMatch = textContent.match(FORWARD_PATTERNS.gmail);
  if (gmailTextMatch && gmailTextMatch.index !== undefined) {
    textMarkerPos = gmailTextMatch.index + gmailTextMatch[0].length;
  }
  if (textMarkerPos === -1) {
    const outlookTextMatch = textContent.match(FORWARD_PATTERNS.outlook);
    if (outlookTextMatch && outlookTextMatch.index !== undefined) {
      textMarkerPos = outlookTextMatch.index + outlookTextMatch[0].length;
    }
  }
  if (textMarkerPos === -1) {
    const appleTextMatch = textContent.match(FORWARD_PATTERNS.apple);
    if (appleTextMatch && appleTextMatch.index !== undefined) {
      textMarkerPos = appleTextMatch.index + appleTextMatch[0].length;
    }
  }

  // Use the text marker position, or fall back to approximate
  const headers = parseForwardHeaders(
    textContent,
    textMarkerPos !== -1 ? textMarkerPos : Math.max(0, markerPos - 100)
  );

  if (!headers.from) {
    return null;
  }

  return {
    originalFrom: headers.from,
    originalSubject: headers.subject,
    originalDate: headers.date,
    originalBody: html.slice(markerPos),
    isHtml: true,
  };
}

/**
 * Parse plain text forwarded email
 */
function parseTextForward(text: string): ForwardedEmailContent | null {
  let markerPos = -1;

  // Check for Gmail forward
  const gmailMatch = text.match(FORWARD_PATTERNS.gmail);
  if (gmailMatch && gmailMatch.index !== undefined) {
    markerPos = gmailMatch.index + gmailMatch[0].length;
  }

  // Check for Outlook forward
  if (markerPos === -1) {
    const outlookMatch = text.match(FORWARD_PATTERNS.outlook);
    if (outlookMatch && outlookMatch.index !== undefined) {
      markerPos = outlookMatch.index + outlookMatch[0].length;
    }
  }

  // Check for Apple forward
  if (markerPos === -1) {
    const appleMatch = text.match(FORWARD_PATTERNS.apple);
    if (appleMatch && appleMatch.index !== undefined) {
      markerPos = appleMatch.index + appleMatch[0].length;
    }
  }

  // Try generic From: header with vendor domain
  if (markerPos === -1) {
    const vendorFromMatch = text.match(
      /From:\s*[^<\n]*(?:<[^>]*(?:revrobotics|gobilda|andymark|ups|fedex|usps)[^>]*>|[^\s]*(?:revrobotics|gobilda|andymark|ups|fedex|usps)[^\s]*)/i
    );
    if (vendorFromMatch && vendorFromMatch.index !== undefined) {
      markerPos = vendorFromMatch.index;
    }
  }

  if (markerPos === -1) {
    return null;
  }

  const headers = parseForwardHeaders(text, markerPos);

  if (!headers.from) {
    return null;
  }

  return {
    originalFrom: headers.from,
    originalSubject: headers.subject,
    originalDate: headers.date,
    originalBody: text.slice(headers.headerEndPos),
    isHtml: false,
  };
}

/**
 * Check if an email appears to be forwarded
 */
export function isForwardedEmail(email: EmailContent): boolean {
  // Check subject line
  if (email.subject && FORWARD_PATTERNS.subjectFwd.test(email.subject)) {
    return true;
  }

  const content = email.html || email.text || "";

  // Check for forward markers in content
  return (
    FORWARD_PATTERNS.gmail.test(content) ||
    FORWARD_PATTERNS.outlook.test(content) ||
    FORWARD_PATTERNS.apple.test(content)
  );
}

/**
 * Parse a forwarded email and extract the original content
 *
 * @param email The forwarded email to parse
 * @returns The extracted original email content, or null if not a forward
 */
export function parseForwardedEmail(
  email: EmailContent
): ForwardedEmailContent | null {
  // Try HTML first (more structured)
  if (email.html) {
    const htmlResult = parseHtmlForward(email.html);
    if (htmlResult) {
      return htmlResult;
    }
  }

  // Fall back to plain text
  if (email.text) {
    const textResult = parseTextForward(email.text);
    if (textResult) {
      return textResult;
    }
  }

  return null;
}

/**
 * Create an EmailContent object from forwarded content
 * This allows the vendor parsers to work on the original email
 */
export function extractOriginalEmail(
  forwarded: ForwardedEmailContent,
  originalEmail: EmailContent
): EmailContent {
  return {
    from: forwarded.originalFrom,
    to: originalEmail.to,
    subject: forwarded.originalSubject || originalEmail.subject,
    html: forwarded.isHtml ? forwarded.originalBody : undefined,
    text: forwarded.isHtml ? undefined : forwarded.originalBody,
  };
}
