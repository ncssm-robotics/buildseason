/**
 * Utility functions for email parsing
 * Separated to avoid circular dependencies with parser registry
 */

/**
 * Get domain from email address
 * Handles formats like:
 * - "email@domain.com"
 * - "Name <email@domain.com>"
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
