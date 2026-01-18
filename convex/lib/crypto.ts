/**
 * Cryptographic utilities for secure token generation.
 */

/**
 * Generate a secure random token using crypto.randomUUID().
 * Returns a 32-character hex string (UUID without dashes).
 */
export function generateSecureToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
