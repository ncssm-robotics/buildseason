import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import nacl from "tweetnacl";

/**
 * Discord interaction types
 */
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

/**
 * Discord interaction response types
 */
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

/**
 * Verify Discord request signature
 */
function verifyDiscordSignature(
  signature: string | null,
  timestamp: string | null,
  body: string,
  publicKey: string
): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const message = timestamp + body;
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch {
    return false;
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Discord webhook handler
 * Receives interactions from Discord and routes them to the agent
 */
export const discordWebhook = httpAction(async (ctx, request) => {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("DISCORD_PUBLIC_KEY not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Get signature headers
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();

  // Verify signature
  if (!verifyDiscordSignature(signature, timestamp, body, publicKey)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse the interaction
  const interaction = JSON.parse(body);

  // Handle PING (Discord verification)
  if (interaction.type === InteractionType.PING) {
    return new Response(
      JSON.stringify({ type: InteractionResponseType.PONG }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle slash commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data.name;

    // Handle /glados command
    if (commandName === "glados") {
      // Get the message from the command options
      const message = interaction.data.options?.find(
        (opt: { name: string }) => opt.name === "message"
      )?.value;

      if (!message) {
        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "Please provide a message. Usage: `/glados message:your question here`",
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Defer the response since agent might take time
      // We'll follow up with the actual response
      const deferredResponse = new Response(
        JSON.stringify({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        }),
        { headers: { "Content-Type": "application/json" } }
      );

      // Schedule the agent response using scheduler (fire and forget)
      // The agent will send a follow-up message
      await ctx.scheduler.runAfter(
        0,
        internal.discord.respond.handleGladosCommand,
        {
          interactionToken: interaction.token,
          applicationId: interaction.application_id,
          message,
          userId:
            interaction.member?.user?.id || interaction.user?.id || "unknown",
          channelId: interaction.channel_id,
          guildId: interaction.guild_id,
        }
      );

      return deferredResponse;
    }

    // Handle /ask command (alias for glados)
    if (commandName === "ask") {
      const message = interaction.data.options?.find(
        (opt: { name: string }) => opt.name === "question"
      )?.value;

      if (!message) {
        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "Please provide a question. Usage: `/ask question:your question here`",
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const deferredResponse = new Response(
        JSON.stringify({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        }),
        { headers: { "Content-Type": "application/json" } }
      );

      await ctx.scheduler.runAfter(
        0,
        internal.discord.respond.handleGladosCommand,
        {
          interactionToken: interaction.token,
          applicationId: interaction.application_id,
          message,
          userId:
            interaction.member?.user?.id || interaction.user?.id || "unknown",
          channelId: interaction.channel_id,
          guildId: interaction.guild_id,
        }
      );

      return deferredResponse;
    }

    // Unknown command
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:
            "Unknown command. Try `/glados message:your question` or `/ask question:your question`",
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Default response for unhandled interaction types
  return new Response(
    JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "I'm not sure how to handle that interaction.",
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
