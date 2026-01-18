import { httpAction, internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateSecureToken } from "../lib/crypto";

/**
 * Initiate Discord OAuth for account linking.
 * User must already be logged in - this links their Discord to their existing account.
 */
export const initiateLink = httpAction(async (_ctx, request) => {
  const clientId = process.env.AUTH_DISCORD_ID;
  const siteUrl = process.env.SITE_URL || "http://localhost:5173";

  if (!clientId) {
    return new Response("Discord OAuth not configured", { status: 500 });
  }

  // Get the redirect URI for our callback
  const url = new URL(request.url);
  const callbackUrl = `${url.origin}/discord/link/callback`;

  // Build Discord OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "identify",
    // State includes return URL for after linking
    state: Buffer.from(JSON.stringify({ returnUrl: siteUrl })).toString(
      "base64"
    ),
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params}`;

  return Response.redirect(discordAuthUrl, 302);
});

/**
 * Handle Discord OAuth callback for account linking.
 * Exchanges code for token, gets Discord user info, creates discordLinks entry.
 */
export const handleLinkCallback = httpAction(async (ctx, request) => {
  const clientId = process.env.AUTH_DISCORD_ID;
  const clientSecret = process.env.AUTH_DISCORD_SECRET;
  const siteUrl = process.env.SITE_URL || "http://localhost:5173";

  if (!clientId || !clientSecret) {
    return new Response("Discord OAuth not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Discord OAuth error:", error);
    return Response.redirect(`${siteUrl}/settings?error=discord_denied`, 302);
  }

  if (!code) {
    return Response.redirect(`${siteUrl}/settings?error=no_code`, 302);
  }

  // Parse state for return URL
  let returnUrl = siteUrl;
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      returnUrl = stateData.returnUrl || siteUrl;
    } catch {
      // Ignore state parse errors
    }
  }

  const callbackUrl = `${url.origin}/discord/link/callback`;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Failed to exchange Discord code:", error);
      return Response.redirect(
        `${returnUrl}/settings?error=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();

    // Get Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get Discord user info");
      return Response.redirect(`${returnUrl}/settings?error=user_info`, 302);
    }

    const discordUser = await userResponse.json();

    // Store Discord info in a pending link that the frontend will complete
    // We use a short-lived token that the frontend exchanges while authenticated
    const { token } = await ctx.runMutation(
      internal.discord.linkAccount.createPendingLink,
      {
        discordUserId: discordUser.id,
        discordUsername: discordUser.username,
      }
    );

    // Redirect to frontend with the pending link token
    // Frontend will call completeLinkAccount while authenticated
    return Response.redirect(
      `${returnUrl}/settings?discord_link_token=${token}`,
      302
    );
  } catch (error) {
    console.error("Discord link error:", error);
    return Response.redirect(`${returnUrl}/settings?error=unknown`, 302);
  }
});

/**
 * Create a pending Discord link (internal, called from OAuth callback)
 * This is secure because the Discord ID comes from OAuth, not user input.
 */
export const createPendingLink = internalMutation({
  args: {
    discordUserId: v.string(),
    discordUsername: v.string(),
  },
  handler: async (ctx, { discordUserId, discordUsername }) => {
    // Generate a short-lived token
    const token = generateSecureToken();

    await ctx.db.insert("discordLinkTokens", {
      token,
      discordUserId,
      discordUsername,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return { token };
  },
});

/**
 * Complete Discord account link (called by authenticated frontend)
 * This verifies the user is logged in and links their Discord.
 */
export const completeLinkAccount = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to link Discord account");
    }

    // Find and validate the pending link token
    const pendingLink = await ctx.db
      .query("discordLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!pendingLink) {
      throw new Error("Invalid or expired link token");
    }

    if (pendingLink.expiresAt < Date.now()) {
      // Clean up expired token
      await ctx.db.delete(pendingLink._id);
      throw new Error("Link token has expired. Please try again.");
    }

    if (pendingLink.usedAt) {
      throw new Error("This link token has already been used");
    }

    // Check if this Discord account is already linked to someone else
    const existingLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_discord_user", (q) =>
        q.eq("discordUserId", pendingLink.discordUserId)
      )
      .first();

    if (existingLink && existingLink.userId !== userId) {
      throw new Error(
        "This Discord account is already linked to another BuildSeason account"
      );
    }

    // Check if user already has a Discord link
    const userLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userLink) {
      // Update existing link
      await ctx.db.patch(userLink._id, {
        discordUserId: pendingLink.discordUserId,
        discordUsername: pendingLink.discordUsername,
        linkedAt: Date.now(),
        linkedVia: "oauth",
      });
    } else {
      // Create new link
      await ctx.db.insert("discordLinks", {
        userId,
        discordUserId: pendingLink.discordUserId,
        discordUsername: pendingLink.discordUsername,
        linkedAt: Date.now(),
        linkedVia: "oauth",
      });
    }

    // Mark token as used
    await ctx.db.patch(pendingLink._id, {
      usedAt: Date.now(),
      usedBy: userId,
    });

    return {
      success: true,
      discordUsername: pendingLink.discordUsername,
    };
  },
});
