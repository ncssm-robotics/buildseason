import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * Get all connected OAuth providers for the current user.
 * Returns info about Discord, GitHub, and Google connections.
 *
 * Checks authAccounts for OAuth connections and discordLinks for manual Discord links.
 */
export const getConnectedAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get all auth accounts for this user
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();

    // Build a map of provider -> account info
    const providerMap = new Map<string, { providerAccountId: string }>();
    for (const account of authAccounts) {
      providerMap.set(account.provider, {
        providerAccountId: account.providerAccountId,
      });
    }

    // Get Discord link info for username
    const discordLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get provider profiles for usernames
    const providerProfiles = await ctx.db
      .query("providerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const profileMap = new Map<
      string,
      { username?: string; displayName?: string }
    >();
    for (const profile of providerProfiles) {
      profileMap.set(profile.provider, {
        username: profile.username ?? undefined,
        displayName: profile.displayName ?? undefined,
      });
    }

    // Build response
    const githubAuth = providerMap.get("github");
    const googleAuth = providerMap.get("google");
    const discordAuth = providerMap.get("discord");

    const githubProfile = profileMap.get("github");
    const googleProfile = profileMap.get("google");
    const discordProfile = profileMap.get("discord");

    return {
      github: githubAuth
        ? {
            providerAccountId: githubAuth.providerAccountId,
            username: githubProfile?.username,
            displayName: githubProfile?.displayName,
          }
        : null,
      google: googleAuth
        ? {
            providerAccountId: googleAuth.providerAccountId,
            username: googleProfile?.username,
            displayName: googleProfile?.displayName,
          }
        : null,
      discord:
        discordAuth || discordLink
          ? {
              providerAccountId:
                discordAuth?.providerAccountId ?? discordLink?.discordUserId,
              username:
                discordProfile?.username ?? discordLink?.discordUsername,
            }
          : null,
      // Raw data for debugging
      _debug: {
        authProviders: Array.from(providerMap.keys()),
        hasDiscordLink: !!discordLink,
      },
    };
  },
});
