/**
 * Reaction handling for approval workflows.
 * Handles approval/rejection via emoji reactions.
 */
import type {
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from "discord.js";
import { buildSuccessEmbed, buildErrorEmbed } from "../utils/embeds";
import { canApprove } from "../utils/permissions";

/** Emoji constants for approval workflow */
export const APPROVAL_EMOJI = {
  approve: "\u2705", // checkmark
  reject: "\u274c", // X
} as const;

/**
 * Handles reaction add events for approval workflows.
 *
 * @param reaction - The reaction that was added
 * @param user - The user who added the reaction
 */
export async function handleReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  // Ignore bot reactions
  if (user.bot) return;

  // Fetch partial reaction/message if needed
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Failed to fetch partial reaction:", error);
      return;
    }
  }

  const message = reaction.message;

  // Only handle reactions on bot messages
  if (message.author?.id !== message.client.user?.id) {
    return;
  }

  // Check if this is an approval reaction
  const emojiName = reaction.emoji.name;
  if (
    emojiName !== APPROVAL_EMOJI.approve &&
    emojiName !== APPROVAL_EMOJI.reject
  ) {
    return;
  }

  // Check if the message is an approval request (has the footer marker)
  const embed = message.embeds[0];
  if (!embed?.footer?.text?.startsWith("Request ID:")) {
    return;
  }

  // Extract request ID from footer
  const requestId = embed.footer.text.replace("Request ID: ", "");

  // Handle approval or rejection
  if (emojiName === APPROVAL_EMOJI.approve) {
    await handleApproval(reaction, user, requestId);
  } else {
    await handleRejection(reaction, user, requestId);
  }
}

/**
 * Handles approval of a request.
 */
async function handleApproval(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  requestId: string
): Promise<void> {
  const message = reaction.message;
  const guild = message.guild;

  // Check if user has approval permission
  if (guild) {
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!canApprove(member)) {
      // Remove the reaction - user doesn't have permission
      await reaction.users.remove(user.id).catch(() => {
        // Ignore if we can't remove the reaction
      });

      // DM the user about permission issue
      try {
        const fullUser = user.partial ? await user.fetch() : user;
        await fullUser.send({
          embeds: [
            buildErrorEmbed(
              "You don't have permission to approve requests. " +
                "Only mentors and coaches can approve."
            ),
          ],
        });
      } catch {
        // User may have DMs disabled - ignore
      }
      return;
    }
  }

  // Trigger the approval workflow
  // TODO: Integrate with Temporal workflow
  console.log(`[Approval] Request ${requestId} approved by ${user.id}`);

  // Reply to confirm approval
  await message.reply({
    embeds: [
      buildSuccessEmbed(
        "Request Approved",
        `Request \`${requestId}\` has been approved by <@${user.id}>.`
      ),
    ],
  });
}

/**
 * Handles rejection of a request.
 */
async function handleRejection(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  requestId: string
): Promise<void> {
  const message = reaction.message;
  const guild = message.guild;

  // Check if user has approval permission
  if (guild) {
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!canApprove(member)) {
      // Remove the reaction - user doesn't have permission
      await reaction.users.remove(user.id).catch(() => {
        // Ignore if we can't remove the reaction
      });

      // DM the user about permission issue
      try {
        const fullUser = user.partial ? await user.fetch() : user;
        await fullUser.send({
          embeds: [
            buildErrorEmbed(
              "You don't have permission to reject requests. " +
                "Only mentors and coaches can reject."
            ),
          ],
        });
      } catch {
        // User may have DMs disabled - ignore
      }
      return;
    }
  }

  // Trigger the rejection workflow
  // TODO: Integrate with Temporal workflow
  console.log(`[Rejection] Request ${requestId} rejected by ${user.id}`);

  // Reply to confirm rejection
  await message.reply({
    embeds: [
      buildErrorEmbed(
        `Request \`${requestId}\` has been rejected by <@${user.id}>.`
      ),
    ],
  });
}
