/**
 * Message create event handler.
 * Routes messages to appropriate handlers based on mentions/DMs.
 */
import type { Message } from "discord.js";
import { routeMessage } from "../handlers/router";
import { getTeamContext } from "../utils/permissions";
import { checkRateLimit, getRemainingCooldown } from "../utils/rate-limit";
import { buildRateLimitEmbed } from "../utils/embeds";
import { safeHandler, messageErrorFallback } from "../utils/errors";

/**
 * Handles incoming messages.
 * Only responds to bot mentions or DMs.
 *
 * @param message - The incoming Discord message
 */
export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore messages from bots (including self)
  if (message.author.bot) return;

  // Check if bot is mentioned or this is a DM
  const isMention = message.mentions.has(message.client.user!);
  const isDM = !message.guild;

  // Only respond to mentions or DMs
  if (!isMention && !isDM) return;

  // Check rate limit
  if (!checkRateLimit(message.author.id)) {
    const remaining = getRemainingCooldown(message.author.id);
    await message.reply({
      embeds: [buildRateLimitEmbed(remaining)],
    });
    return;
  }

  // Wrap handler with error handling
  await safeHandler(async () => {
    // Remove bot mention from content to get the actual query
    const content = message.content
      .replace(/<@!?\d+>/g, "") // Remove mentions
      .trim();

    // Handle empty messages (just a mention)
    if (!content) {
      await message.reply(
        "Hello! I'm GLaDOS, your team management assistant. " +
          "Type `@GLaDOS help` for available commands."
      );
      return;
    }

    // Get team context from channel
    const teamContext = await getTeamContext(message.channel);

    // Route to appropriate handler
    await routeMessage(message, content, teamContext);
  }, messageErrorFallback(message));
}
