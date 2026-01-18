import Discord from "@auth/core/providers/discord";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Discord, GitHub, Google],
  callbacks: {
    /**
     * Store provider profile data (username, avatar) when user authenticates.
     * This supplements authAccounts which only stores the provider ID.
     */
    async afterUserCreatedOrUpdated(ctx, { userId, profile, provider }) {
      if (!profile || !provider) return;

      // Get provider ID from the provider config
      const providerId = provider.id;
      if (!providerId) return;

      // Type the profile more loosely since it varies by provider
      const profileData = profile as Record<string, unknown>;

      // Check if we already have a profile for this provider
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const existingProfiles = await (ctx.db as any)
        .query("providerProfiles")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const existing = existingProfiles.find(
        (p: { provider: string }) => p.provider === providerId
      );

      // Extract username based on provider
      // GitHub: profile.login, Discord: profile.username, Google: email prefix
      let username: string | undefined;
      let displayName: string | undefined;
      let avatarUrl: string | undefined;
      let email: string | undefined;

      // Safely extract string values
      const getString = (key: string): string | undefined => {
        const val = profileData[key];
        return typeof val === "string" ? val : undefined;
      };

      if (providerId === "github") {
        // Convex Auth normalizes GitHub profile - 'login' is not available
        displayName = getString("name");
        avatarUrl = getString("image");
        email = getString("email");

        // Schedule an action to fetch GitHub username from public API
        // The providerAccountId from authAccounts is the numeric GitHub user ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authAccount = await (ctx.db as any)
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q: any) =>
            q.eq("userId", userId).eq("provider", "github")
          )
          .first();

        if (authAccount?.providerAccountId) {
          // Schedule action to fetch username asynchronously (can't use fetch in mutations)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (ctx.scheduler as any).runAfter(
            0,
            internal.providers.actions.fetchGitHubUsername,
            {
              userId,
              githubUserId: authAccount.providerAccountId,
            }
          );
        }

        // Fallback to display name if we couldn't get username
        if (!username) {
          if (email?.endsWith("@users.noreply.github.com")) {
            username = email.split("@")[0].replace(/^\d+\+/, "");
          } else {
            username = displayName;
          }
        }
      } else if (providerId === "discord") {
        // Discord profile has 'username'
        username = getString("username");
        displayName = getString("name");
        avatarUrl = getString("image");
        email = getString("email");
      } else if (providerId === "google") {
        // Google doesn't have username, use email prefix
        displayName = getString("name");
        avatarUrl = getString("image");
        email = getString("email");
        username = email?.split("@")[0];
      }

      if (existing) {
        // Update existing profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (ctx.db as any).patch(existing._id, {
          username,
          displayName,
          avatarUrl,
          email,
          updatedAt: Date.now(),
        });
      } else {
        // Create new profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (ctx.db as any).insert("providerProfiles", {
          userId,
          provider: providerId,
          username,
          displayName,
          avatarUrl,
          email,
          updatedAt: Date.now(),
        });
      }
    },
  },
});
