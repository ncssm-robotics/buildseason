import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Fetch GitHub username from public API and update provider profile.
 * Called after GitHub login to get the actual username.
 */
export const fetchGitHubUsername = internalAction({
  args: {
    userId: v.id("users"),
    githubUserId: v.string(),
  },
  handler: async (ctx, { userId, githubUserId }) => {
    try {
      const response = await fetch(
        `https://api.github.com/user/${githubUserId}`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BuildSeason-App",
          },
        }
      );

      if (!response.ok) {
        console.log(
          `[fetchGitHubUsername] GitHub API returned ${response.status}`
        );
        return;
      }

      const githubUser = await response.json();
      const username = githubUser.login;

      if (username) {
        await ctx.runMutation(
          internal.providers.actions.updateProviderUsername,
          {
            userId,
            provider: "github",
            username,
          }
        );
      }
    } catch (e) {
      console.log(`[fetchGitHubUsername] Error:`, e);
    }
  },
});

/**
 * Update the username in a provider profile.
 */
export const updateProviderUsername = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    username: v.string(),
  },
  handler: async (ctx, { userId, provider, username }) => {
    const existing = await ctx.db
      .query("providerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const profile = existing.find((p) => p.provider === provider);

    if (profile) {
      await ctx.db.patch(profile._id, {
        username,
        updatedAt: Date.now(),
      });
    }
  },
});
