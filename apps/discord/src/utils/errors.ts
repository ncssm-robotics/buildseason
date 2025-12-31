/**
 * Error handling utilities for safe async operations.
 * Prevents unhandled exceptions from crashing the bot.
 */
import type { Message, ChatInputCommandInteraction } from "discord.js";
import { buildErrorEmbed } from "./embeds";

/**
 * Wraps an async handler with error handling.
 * On error, logs the error and optionally calls a fallback.
 *
 * @param handler - Async function to execute
 * @param fallback - Optional function to call on error
 * @returns Result of handler or undefined on error
 */
export async function safeHandler<T>(
  handler: () => Promise<T>,
  fallback?: (error: Error) => Promise<void>
): Promise<T | undefined> {
  try {
    return await handler();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Discord Bot Error]", err.message, err.stack);

    if (fallback) {
      try {
        await fallback(err);
      } catch (fallbackError) {
        console.error(
          "[Discord Bot Fallback Error]",
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError)
        );
      }
    }

    return undefined;
  }
}

/**
 * Creates an error fallback for message handlers.
 * Sends an error embed as a reply to the message.
 *
 * @param message - Message to reply to
 * @returns Fallback function that sends error reply
 */
export function messageErrorFallback(
  message: Message
): (error: Error) => Promise<void> {
  return async (error: Error) => {
    const userMessage =
      error.message.length > 200
        ? "An unexpected error occurred. Please try again."
        : error.message;

    await message.reply({
      embeds: [buildErrorEmbed(userMessage)],
    });
  };
}

/**
 * Creates an error fallback for interaction handlers.
 * Sends an ephemeral error reply to the interaction.
 *
 * @param interaction - Interaction to reply to
 * @returns Fallback function that sends error reply
 */
export function interactionErrorFallback(
  interaction: ChatInputCommandInteraction
): (error: Error) => Promise<void> {
  return async (error: Error) => {
    const userMessage =
      error.message.length > 200
        ? "An unexpected error occurred. Please try again."
        : error.message;

    const replyOptions = {
      embeds: [buildErrorEmbed(userMessage)],
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  };
}
