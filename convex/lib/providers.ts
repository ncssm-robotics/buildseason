import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Supported OAuth providers
 */
export type Provider = "discord" | "github" | "google";

/**
 * Connected provider information
 */
export interface ConnectedProvider {
  provider: Provider;
  providerAccountId: string;
  // Additional metadata we can enrich later
  displayName?: string;
}

/**
 * Get all connected OAuth providers for a user from authAccounts.
 * This is the canonical source for what providers a user has linked.
 */
export async function getConnectedProviders(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<ConnectedProvider[]> {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();

  return accounts.map((account) => ({
    provider: account.provider as Provider,
    providerAccountId: account.providerAccountId,
  }));
}

/**
 * Get a specific provider connection for a user.
 */
export async function getProviderConnection(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  provider: Provider
): Promise<ConnectedProvider | null> {
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", userId).eq("provider", provider)
    )
    .first();

  if (!account) {
    return null;
  }

  return {
    provider: account.provider as Provider,
    providerAccountId: account.providerAccountId,
  };
}

/**
 * Check if user has a specific provider connected.
 */
export async function hasProviderConnected(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  provider: Provider
): Promise<boolean> {
  const connection = await getProviderConnection(ctx, userId, provider);
  return connection !== null;
}

/**
 * Get user by provider account ID.
 * Useful for looking up "who is Discord user X?" or "who is GitHub user Y?"
 */
export async function getUserByProviderAccount(
  ctx: QueryCtx | MutationCtx,
  provider: Provider,
  providerAccountId: string
): Promise<Id<"users"> | null> {
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", provider).eq("providerAccountId", providerAccountId)
    )
    .first();

  return account?.userId ?? null;
}

/**
 * Get Discord user ID for a BuildSeason user.
 * Checks both authAccounts (OAuth login) and discordLinks (manual link).
 */
export async function getDiscordUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<string | null> {
  // First check authAccounts (logged in with Discord)
  const discordAccount = await getProviderConnection(ctx, userId, "discord");
  if (discordAccount) {
    return discordAccount.providerAccountId;
  }

  // Fall back to discordLinks (manually linked)
  const discordLink = await ctx.db
    .query("discordLinks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return discordLink?.discordUserId ?? null;
}

/**
 * Get BuildSeason user ID from Discord user ID.
 * Checks both authAccounts (OAuth login) and discordLinks (manual link).
 */
export async function getUserByDiscordId(
  ctx: QueryCtx | MutationCtx,
  discordUserId: string
): Promise<Id<"users"> | null> {
  // First check authAccounts (logged in with Discord)
  const userId = await getUserByProviderAccount(ctx, "discord", discordUserId);
  if (userId) {
    return userId;
  }

  // Fall back to discordLinks (manually linked)
  const discordLink = await ctx.db
    .query("discordLinks")
    .withIndex("by_discord_user", (q) => q.eq("discordUserId", discordUserId))
    .first();

  return discordLink?.userId ?? null;
}

/**
 * Get GitHub user ID for a BuildSeason user.
 */
export async function getGitHubUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<string | null> {
  const githubAccount = await getProviderConnection(ctx, userId, "github");
  return githubAccount?.providerAccountId ?? null;
}

/**
 * Get BuildSeason user ID from GitHub user ID.
 */
export async function getUserByGitHubId(
  ctx: QueryCtx | MutationCtx,
  githubUserId: string
): Promise<Id<"users"> | null> {
  return getUserByProviderAccount(ctx, "github", githubUserId);
}

/**
 * Get all connected accounts for the current user.
 * Returns detailed info suitable for display in UI.
 */
export async function getMyConnectedAccounts(
  ctx: QueryCtx | MutationCtx
): Promise<{
  providers: ConnectedProvider[];
  discord: { userId: string; username?: string } | null;
  github: { userId: string } | null;
  google: { userId: string } | null;
} | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const providers = await getConnectedProviders(ctx, userId);

  // Get Discord info (may also have username from discordLinks)
  const discordProvider = providers.find((p) => p.provider === "discord");
  let discord: { userId: string; username?: string } | null = null;

  if (discordProvider) {
    // Check discordLinks for username
    const discordLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    discord = {
      userId: discordProvider.providerAccountId,
      username: discordLink?.discordUsername ?? undefined,
    };
  } else {
    // Check discordLinks only (manual link without OAuth)
    const discordLink = await ctx.db
      .query("discordLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (discordLink) {
      discord = {
        userId: discordLink.discordUserId,
        username: discordLink.discordUsername ?? undefined,
      };
    }
  }

  const githubProvider = providers.find((p) => p.provider === "github");
  const googleProvider = providers.find((p) => p.provider === "google");

  return {
    providers,
    discord,
    github: githubProvider
      ? { userId: githubProvider.providerAccountId }
      : null,
    google: googleProvider
      ? { userId: googleProvider.providerAccountId }
      : null,
  };
}
