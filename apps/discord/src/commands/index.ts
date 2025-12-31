/**
 * Slash command registry.
 * Collects and exports all slash commands.
 */
import { Collection, REST, Routes } from "discord.js";
import type { SlashCommand } from "./types";
import { budgetCommand } from "./budget";
import { inventoryCommand } from "./inventory";

/** Collection of all registered commands */
export const commands = new Collection<string, SlashCommand>();

// Register all commands
commands.set("budget", budgetCommand);
commands.set("inventory", inventoryCommand);

/**
 * Deploys slash commands to Discord.
 * Should be called once when commands change.
 *
 * @param options - Deployment options
 * @param options.global - If true, deploys globally. If false (default), deploys to guild only.
 */
export async function deployCommands(options?: {
  global?: boolean;
}): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token) {
    throw new Error("DISCORD_TOKEN is required");
  }

  if (!clientId) {
    throw new Error("DISCORD_CLIENT_ID is required");
  }

  const rest = new REST().setToken(token);

  // Convert commands to JSON
  const commandData = Array.from(commands.values()).map((cmd) =>
    cmd.data.toJSON()
  );

  console.log(
    `[Discord Bot] Deploying ${commandData.length} slash commands...`
  );

  try {
    if (options?.global) {
      // Deploy globally (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log("[Discord Bot] Successfully deployed global commands");
    } else {
      // Deploy to specific guild (instant)
      if (!guildId) {
        throw new Error(
          "DISCORD_GUILD_ID is required for guild-specific deployment. " +
            "Set it or use { global: true } for global deployment."
        );
      }

      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      });
      console.log(
        `[Discord Bot] Successfully deployed guild commands to ${guildId}`
      );
    }
  } catch (error) {
    console.error("[Discord Bot] Failed to deploy commands:", error);
    throw error;
  }
}

export type { SlashCommand } from "./types";
