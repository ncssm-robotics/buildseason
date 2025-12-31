/**
 * Type definitions for slash commands.
 */
import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

/**
 * Slash command definition.
 */
export interface SlashCommand {
  /** Command builder with name, description, and options */
  data: {
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  /** Execute function called when command is invoked */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
