import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserByDiscordId as getUserByDiscordIdLib } from "../lib/providers";

/**
 * Get the BuildSeason user linked to a Discord user ID.
 * Checks both authAccounts (OAuth login) and discordLinks (manual link).
 */
export const getUserByDiscordId = internalQuery({
  args: { discordUserId: v.string() },
  handler: async (ctx, { discordUserId }) => {
    // Use the unified provider lookup (checks authAccounts first, then discordLinks)
    const userId = await getUserByDiscordIdLib(ctx, discordUserId);

    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Get the link record if it exists (for backward compatibility)
    const link = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    return { user, link, discordUserId };
  },
});

/**
 * Check if we've ever created a link token for this Discord user
 * Used to determine if we've already prompted them to link
 */
export const hasLinkToken = internalQuery({
  args: { discordUserId: v.string() },
  handler: async (ctx, { discordUserId }) => {
    const token = await ctx.db
      .query("discordLinkTokens")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    return !!token;
  },
});

/**
 * Get the Discord link for the current authenticated user.
 * Checks both authAccounts (OAuth login) and discordLinks (manual link).
 * Returns a unified format regardless of how Discord was connected.
 */
export const getMyDiscordLink = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // First check authAccounts (user logged in with Discord)
    const discordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "discord")
      )
      .first();

    if (discordAccount) {
      // Check if there's a discordLinks entry for username
      const link = await ctx.db
        .query("discordLinks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      return {
        userId,
        discordUserId: discordAccount.providerAccountId,
        discordUsername: link?.discordUsername ?? null,
        linkedAt: link?.linkedAt ?? null,
        linkedVia: "oauth" as const,
      };
    }

    // Fall back to discordLinks (manual link)
    const link = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!link) return null;

    return {
      userId: link.userId,
      discordUserId: link.discordUserId,
      discordUsername: link.discordUsername ?? null,
      linkedAt: link.linkedAt,
      linkedVia: link.linkedVia as "oauth" | "manual" | "bot_link",
    };
  },
});

/**
 * Create a prompt record for a Discord user
 * Used by the bot to track that we've suggested linking to this user
 * Note: This is NOT used for actual linking - linking requires OAuth
 */
export const createLinkToken = internalMutation({
  args: {
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { discordUserId, discordUsername, guildId }) => {
    // Check if there's already a token for this Discord user
    const existing = await ctx.db
      .query("discordLinkTokens")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    if (existing) {
      return { token: existing.token, isNew: false };
    }

    // Generate a new token (just for tracking, not for linking)
    const token = generateToken();

    await ctx.db.insert("discordLinkTokens", {
      token,
      discordUserId,
      discordUsername,
      guildId,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year (just for tracking)
    });

    return { token, isNew: true };
  },
});

/**
 * Unlink Discord account
 */
export const unlinkDiscord = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const link = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }

    return { success: true };
  },
});

/**
 * Generate a URL-safe random token using crypto.randomUUID()
 */
function generateToken(): string {
  // crypto.randomUUID() provides cryptographically secure random values
  return crypto.randomUUID().replace(/-/g, "");
}
