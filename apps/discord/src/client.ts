/**
 * Discord client setup for BuildSeason bot.
 * Configures intents and partials needed for message handling, DMs, and reactions.
 */
import { Client, GatewayIntentBits, Partials } from "discord.js";

/**
 * Discord client instance configured for BuildSeason bot.
 * Intents enabled:
 * - Guilds: Access to guild/server information
 * - GuildMessages: Receive messages in servers
 * - MessageContent: Read message content (requires privileged intent)
 * - DirectMessages: Receive DMs from users
 * - GuildMessageReactions: Handle reaction-based approvals
 */
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    // Required for DM handling
    Partials.Channel,
    // Required for reaction handling on uncached messages
    Partials.Message,
    Partials.Reaction,
  ],
});

/**
 * Starts the Discord bot by logging in with the provided token.
 * Token should be set via DISCORD_TOKEN environment variable.
 */
export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error(
      "DISCORD_TOKEN environment variable is required. " +
        "Get your token from https://discord.com/developers/applications"
    );
  }

  await client.login(token);
}
