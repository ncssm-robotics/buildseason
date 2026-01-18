import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Handle the /glados command by running the agent and sending a follow-up response
 */
export const handleGladosCommand = internalAction({
  args: {
    interactionToken: v.string(),
    applicationId: v.string(),
    message: v.string(),
    userId: v.string(), // Discord user ID
    channelId: v.string(),
    guildId: v.optional(v.string()),
    username: v.optional(v.string()), // Discord username
  },
  handler: async (ctx, args) => {
    try {
      // Look up the team by Discord guild ID
      const team = await ctx.runQuery(internal.discord.queries.getTeamByGuild, {
        guildId: args.guildId || "",
      });

      if (!team) {
        await sendFollowUp(args.applicationId, args.interactionToken, {
          content:
            "⚠️ This Discord server isn't linked to a BuildSeason team yet. " +
            "Please set up the integration in your team settings.",
        });
        return;
      }

      // Look up if this Discord user is linked to a BuildSeason account
      const linkedUser = await ctx.runQuery(
        internal.discord.links.getUserByDiscordId,
        { discordUserId: args.userId }
      );

      // Determine user's first name (prefer linked account name, fallback to Discord username)
      // Extract first name from full name like "Carl Ryden" -> "Carl"
      const fullName = linkedUser?.user?.name || args.username;
      const userName = fullName?.split(" ")[0] || args.username;

      // Run the agent
      const response = await ctx.runAction(
        internal.agent.handler.handleMessage,
        {
          message: args.message,
          teamId: team._id,
          userId: args.userId,
          userName,
          channelId: args.channelId,
        }
      );

      // Build final response content
      let finalContent = response;

      // If user isn't linked, add a one-time link suggestion
      // Check if we've ever created a token for them (means we've prompted before)
      if (!linkedUser) {
        const existingToken = await ctx.runQuery(
          internal.discord.links.hasLinkToken,
          { discordUserId: args.userId }
        );

        if (!existingToken) {
          // First time seeing this user - create a token to mark we've prompted
          await ctx.runMutation(internal.discord.links.createLinkToken, {
            discordUserId: args.userId,
            discordUsername: args.username,
            guildId: args.guildId,
          });

          // Add link suggestion to response
          const siteUrl = process.env.SITE_URL || "http://localhost:5173";
          finalContent += `\n\n---\n*Tip: Link your Discord account at ${siteUrl}/settings to unlock personalized features!*`;
        }
      }

      // Send the response back to Discord
      await sendFollowUp(args.applicationId, args.interactionToken, {
        content: finalContent,
      });
    } catch (error) {
      console.error("Error handling GLaDOS command:", error);
      await sendFollowUp(args.applicationId, args.interactionToken, {
        content:
          "I encountered an error processing your request. " +
          "The cake is a lie, but this error is real. Please try again.",
      });
    }
  },
});

/**
 * Send a follow-up message to Discord after a deferred response
 */
async function sendFollowUp(
  applicationId: string,
  interactionToken: string,
  data: { content: string; embeds?: unknown[] }
): Promise<void> {
  const url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send follow-up:", error);
    throw new Error(`Failed to send follow-up: ${response.status}`);
  }
}
