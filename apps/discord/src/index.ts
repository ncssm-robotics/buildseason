/**
 * Discord Bot Entry Point
 *
 * GLaDOS - BuildSeason Team Management Bot
 *
 * This bot provides:
 * - Natural language queries for team data
 * - Slash commands for budget and inventory
 * - Reaction-based approval workflows
 * - Team channel context awareness
 *
 * Environment Variables:
 * - DISCORD_TOKEN: Bot token from Discord Developer Portal
 * - DISCORD_CLIENT_ID: Application client ID
 * - DISCORD_GUILD_ID: Guild ID for development (optional)
 * - DISCORD_ADMIN_IDS: Comma-separated admin user IDs (optional)
 */
import { client, startBot } from "./client";
import {
  handleReady,
  handleMessageCreate,
  handleInteractionCreate,
  handleMessageReactionAdd,
} from "./events";
import { deployCommands } from "./commands";

// Register event handlers
client.once("ready", (readyClient) => {
  handleReady(readyClient);
});

client.on("messageCreate", handleMessageCreate);
client.on("interactionCreate", handleInteractionCreate);
client.on("messageReactionAdd", handleMessageReactionAdd);

// Handle process errors
process.on("unhandledRejection", (error) => {
  console.error("[Discord Bot] Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("[Discord Bot] Uncaught exception:", error);
  // Exit on uncaught exceptions - let process manager restart
  process.exit(1);
});

// Start the bot
async function main(): Promise<void> {
  console.log("[Discord Bot] Starting GLaDOS...");

  // Check for command deployment flag
  const shouldDeployCommands = process.argv.includes("--deploy-commands");
  const globalDeploy = process.argv.includes("--global");

  if (shouldDeployCommands) {
    console.log("[Discord Bot] Deploying commands...");
    await deployCommands({ global: globalDeploy });
    console.log("[Discord Bot] Commands deployed successfully");

    // Exit if only deploying commands
    if (!process.argv.includes("--start")) {
      process.exit(0);
    }
  }

  // Start the bot
  await startBot();
}

main().catch((error) => {
  console.error("[Discord Bot] Failed to start:", error);
  process.exit(1);
});
