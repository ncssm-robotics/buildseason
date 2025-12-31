/**
 * Interaction create event handler.
 * Handles slash commands and other interactions.
 */
import type { Interaction, ChatInputCommandInteraction } from "discord.js";
import { safeHandler, interactionErrorFallback } from "../utils/errors";
import { commands } from "../commands";

/**
 * Handles incoming interactions (slash commands, buttons, etc.).
 *
 * @param interaction - The incoming Discord interaction
 */
export async function handleInteractionCreate(
  interaction: Interaction
): Promise<void> {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
    return;
  }

  // Handle button interactions (for future use)
  if (interaction.isButton()) {
    // TODO: Implement button handlers for approval flows
    console.log(`[Discord Bot] Button interaction: ${interaction.customId}`);
    return;
  }

  // Handle select menu interactions (for future use)
  if (interaction.isStringSelectMenu()) {
    // TODO: Implement select menu handlers
    console.log(
      `[Discord Bot] Select menu interaction: ${interaction.customId}`
    );
    return;
  }
}

/**
 * Handles slash command interactions.
 *
 * @param interaction - The slash command interaction
 */
async function handleSlashCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[Discord Bot] Unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: "Unknown command. Please try again.",
      ephemeral: true,
    });
    return;
  }

  await safeHandler(async () => {
    await command.execute(interaction);
  }, interactionErrorFallback(interaction));
}
