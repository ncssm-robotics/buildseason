/**
 * Ready event handler.
 * Called when the Discord client is ready and connected.
 */
import type { Client } from "discord.js";

/**
 * Handles the ready event when the bot connects to Discord.
 *
 * @param client - The Discord client instance
 */
export function handleReady(client: Client<true>): void {
  console.log(`[Discord Bot] Logged in as ${client.user.tag}`);
  console.log(`[Discord Bot] Serving ${client.guilds.cache.size} guild(s)`);

  // Set bot presence
  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "your team | @GLaDOS help",
        type: 3, // Watching
      },
    ],
  });

  // Log guild information
  client.guilds.cache.forEach((guild) => {
    console.log(
      `[Discord Bot] Connected to guild: ${guild.name} (${guild.id})`
    );
  });
}
