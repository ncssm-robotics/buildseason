import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the BuildSeason user linked to a Discord user ID
 */
export const getUserByDiscordId = internalQuery({
  args: { discordUserId: v.string() },
  handler: async (ctx, { discordUserId }) => {
    const link = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    if (!link) {
      return null;
    }

    const user = await ctx.db.get(link.userId);
    return user ? { user, link } : null;
  },
});

/**
 * Get the Discord link for the current authenticated user
 */
export const getMyDiscordLink = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Create a link token for an unknown Discord user
 * Called by the bot when it doesn't recognize a Discord user
 */
export const createLinkToken = internalMutation({
  args: {
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, { discordUserId, discordUsername, guildId }) => {
    // Check if there's already an unexpired token for this Discord user
    const existing = await ctx.db
      .query("discordLinkTokens")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .filter((q) =>
        q.and(
          q.gt(q.field("expiresAt"), Date.now()),
          q.eq(q.field("usedAt"), undefined)
        )
      )
      .first();

    if (existing) {
      return { token: existing.token, isNew: false };
    }

    // Generate a new token (URL-safe random string)
    const token = generateToken();

    await ctx.db.insert("discordLinkTokens", {
      token,
      discordUserId,
      discordUsername,
      guildId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return { token, isNew: true };
  },
});

/**
 * Use a link token to connect a Discord account to the current user
 * Called from the web app after user logs in
 */
export const useLinkToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to link Discord account");
    }

    // Find the token
    const linkToken = await ctx.db
      .query("discordLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!linkToken) {
      throw new Error("Invalid link token");
    }

    if (linkToken.expiresAt < Date.now()) {
      throw new Error("Link token has expired");
    }

    if (linkToken.usedAt) {
      throw new Error("Link token has already been used");
    }

    // Check if this Discord user is already linked to someone else
    const existingLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) =>
        q.eq("discordUserId", linkToken.discordUserId)
      )
      .first();

    if (existingLink && existingLink.userId !== userId) {
      throw new Error(
        "This Discord account is already linked to another BuildSeason account"
      );
    }

    // Check if this user already has a Discord link
    const userLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userLink) {
      // Update existing link
      await ctx.db.patch(userLink._id, {
        discordUserId: linkToken.discordUserId,
        discordUsername: linkToken.discordUsername,
        linkedAt: Date.now(),
        linkedVia: "bot_link",
      });
    } else {
      // Create new link
      await ctx.db.insert("discordLinks", {
        userId,
        discordUserId: linkToken.discordUserId,
        discordUsername: linkToken.discordUsername,
        linkedAt: Date.now(),
        linkedVia: "bot_link",
      });
    }

    // Mark token as used
    await ctx.db.patch(linkToken._id, {
      usedAt: Date.now(),
      usedBy: userId,
    });

    return { success: true, discordUsername: linkToken.discordUsername };
  },
});

/**
 * Manually link Discord account (user enters their Discord ID)
 */
export const linkDiscordManually = mutation({
  args: {
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
  },
  handler: async (ctx, { discordUserId, discordUsername }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to link Discord account");
    }

    // Check if this Discord user is already linked
    const existingLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    if (existingLink && existingLink.userId !== userId) {
      throw new Error(
        "This Discord account is already linked to another BuildSeason account"
      );
    }

    // Check if user already has a link
    const userLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userLink) {
      await ctx.db.patch(userLink._id, {
        discordUserId,
        discordUsername,
        linkedAt: Date.now(),
        linkedVia: "manual",
      });
    } else {
      await ctx.db.insert("discordLinks", {
        userId,
        discordUserId,
        discordUsername,
        linkedAt: Date.now(),
        linkedVia: "manual",
      });
    }

    return { success: true };
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
 * Generate a URL-safe random token
 */
function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
