/**
 * Message reaction add event handler.
 * Handles reactions for approval workflows.
 */
import type {
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from "discord.js";
import { handleReactionAdd } from "../handlers/reactions";
import { safeHandler } from "../utils/errors";

/**
 * Handles reaction add events.
 *
 * @param reaction - The reaction that was added
 * @param user - The user who added the reaction
 */
export async function handleMessageReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  await safeHandler(
    async () => {
      await handleReactionAdd(reaction, user);
    },
    async (error) => {
      console.error("[Discord Bot] Reaction handler error:", error.message);
      // Don't reply on reaction errors - too noisy
    }
  );
}
