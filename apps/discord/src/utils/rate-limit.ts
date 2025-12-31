/**
 * Rate limiting utility to prevent spam and abuse.
 * Uses an in-memory collection to track user message times.
 */
import { Collection } from "discord.js";

/** Cooldown duration in milliseconds between user messages */
const COOLDOWN_MS = 3000;

/** Clean up old entries every 5 minutes to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/** Map of userId -> last message timestamp */
const cooldowns = new Collection<string, number>();

/**
 * Checks if a user is rate limited.
 * @param userId - Discord user ID to check
 * @returns true if user can send a message, false if rate limited
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastUsed = cooldowns.get(userId) ?? 0;

  if (now - lastUsed < COOLDOWN_MS) {
    return false; // Rate limited
  }

  cooldowns.set(userId, now);
  return true;
}

/**
 * Gets the remaining cooldown time for a user.
 * @param userId - Discord user ID to check
 * @returns Remaining cooldown in milliseconds, or 0 if not limited
 */
export function getRemainingCooldown(userId: string): number {
  const now = Date.now();
  const lastUsed = cooldowns.get(userId) ?? 0;
  const remaining = COOLDOWN_MS - (now - lastUsed);
  return remaining > 0 ? remaining : 0;
}

/**
 * Cleans up old rate limit entries to prevent memory leaks.
 * Should be called periodically.
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const cutoff = now - COOLDOWN_MS;

  for (const [userId, timestamp] of cooldowns) {
    if (timestamp < cutoff) {
      cooldowns.delete(userId);
    }
  }
}

// Start cleanup interval
setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);
