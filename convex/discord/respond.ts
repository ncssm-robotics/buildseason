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
    userId: v.string(),
    channelId: v.string(),
    guildId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Look up the team by Discord guild ID
      // For now, we'll use a simple lookup - in production you'd have a proper mapping
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

      // Run the agent
      const response = await ctx.runAction(
        internal.agent.handler.handleMessage,
        {
          message: args.message,
          teamId: team._id,
          userId: args.userId,
          channelId: args.channelId,
        }
      );

      // Send the response back to Discord
      await sendFollowUp(args.applicationId, args.interactionToken, {
        content: response,
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
