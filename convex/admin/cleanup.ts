import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Delete a user and clean up all related auth data
 */
export const deleteUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Delete related auth accounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete related auth sessions
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const session of authSessions) {
      // Delete refresh tokens for this session
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }

      await ctx.db.delete(session._id);
    }

    // Delete the user
    await ctx.db.delete(userId);

    return { success: true, deleted: userId };
  },
});

/**
 * Link a Discord account to a user (admin only)
 */
export const linkDiscordToUser = internalMutation({
  args: {
    userId: v.id("users"),
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
  },
  handler: async (ctx, { userId, discordUserId, discordUsername }) => {
    // Check if this Discord is already linked
    const existing = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    if (existing) {
      if (existing.userId === userId) {
        return {
          success: true,
          message: "Already linked",
          linkId: existing._id,
        };
      }
      throw new Error("Discord account already linked to another user");
    }

    // Check if user already has a link
    const userLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userLink) {
      // Update existing
      await ctx.db.patch(userLink._id, {
        discordUserId,
        discordUsername,
        linkedAt: Date.now(),
        linkedVia: "admin",
      });
      return { success: true, message: "Updated link", linkId: userLink._id };
    }

    // Create new link
    const linkId = await ctx.db.insert("discordLinks", {
      userId,
      discordUserId,
      discordUsername,
      linkedAt: Date.now(),
      linkedVia: "admin",
    });

    return { success: true, message: "Created link", linkId };
  },
});

/**
 * Inspect auth accounts for a user (admin debug)
 */
export const inspectUserAuth = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);

    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();

    const providerProfiles = await ctx.db
      .query("providerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const discordLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      user,
      authAccounts: authAccounts.map((a) => ({
        _id: a._id,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
      })),
      providerProfiles: providerProfiles.map((p) => ({
        _id: p._id,
        provider: p.provider,
        username: p.username,
        displayName: p.displayName,
        email: p.email,
      })),
      discordLink: discordLink
        ? {
            _id: discordLink._id,
            discordUserId: discordLink.discordUserId,
            discordUsername: discordLink.discordUsername,
          }
        : null,
    };
  },
});

/**
 * Transfer a Discord link from one user to another (admin only)
 * Use when a Discord account is linked to the wrong BuildSeason user.
 */
export const transferDiscordLink = internalMutation({
  args: {
    discordUserId: v.string(),
    newUserId: v.id("users"),
    discordUsername: v.optional(v.string()),
  },
  handler: async (ctx, { discordUserId, newUserId, discordUsername }) => {
    // Find existing link
    const existing = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
      .first();

    if (existing) {
      const oldUserId = existing.userId;
      await ctx.db.patch(existing._id, {
        userId: newUserId,
        discordUsername: discordUsername ?? existing.discordUsername,
        linkedAt: Date.now(),
        linkedVia: "admin",
      });
      return {
        success: true,
        message: "Transferred link",
        oldUserId,
        newUserId,
        linkId: existing._id,
      };
    }

    // No existing link, create new one
    const linkId = await ctx.db.insert("discordLinks", {
      userId: newUserId,
      discordUserId,
      discordUsername,
      linkedAt: Date.now(),
      linkedVia: "admin",
    });

    return { success: true, message: "Created new link", newUserId, linkId };
  },
});

/**
 * Delete an auth account entry (admin only)
 */
export const deleteAuthAccount = internalMutation({
  args: {
    authAccountId: v.id("authAccounts"),
  },
  handler: async (ctx, { authAccountId }) => {
    const account = await ctx.db.get(authAccountId);
    if (!account) {
      throw new Error("Auth account not found");
    }

    await ctx.db.delete(authAccountId);

    return {
      success: true,
      deleted: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    };
  },
});
