import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Discord messaging tools for the agent.
 * Allows sending messages to channels and listing available channels.
 */
export const discordTools: Anthropic.Tool[] = [
  {
    name: "discord_send_message",
    description:
      "Send a message to a Discord channel. Use this to post announcements, reminders, or information to specific channels.",
    input_schema: {
      type: "object" as const,
      properties: {
        channelName: {
          type: "string",
          description:
            "The name of the channel to send to (e.g., 'general', 'logistics'). Use discord_list_channels to see available channels.",
        },
        channelId: {
          type: "string",
          description:
            "The Discord channel ID (alternative to channelName if you have the ID)",
        },
        message: {
          type: "string",
          description: "The message content. Discord markdown is supported.",
        },
        embed: {
          type: "object",
          description: "Optional rich embed for formatted content",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            color: {
              type: "number",
              description:
                "Embed color as decimal number (e.g., 5814783 for blue)",
            },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  inline: { type: "boolean" },
                },
              },
            },
          },
        },
      },
      required: ["message"],
    },
  },
  {
    name: "discord_list_channels",
    description:
      "List available Discord channels for this team's server. Use this to find the right channel before sending a message.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["text", "voice", "all"],
          description: "Filter by channel type (default: text)",
        },
      },
      required: [],
    },
  },
];

/**
 * Discord API channel types
 */
const DISCORD_CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  GUILD_VOICE: 2,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  GUILD_STAGE_VOICE: 13,
  GUILD_FORUM: 15,
};

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id?: string;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

/**
 * Send a message to a Discord channel via REST API.
 */
async function sendDiscordMessage(
  channelId: string,
  content: string,
  embed?: DiscordEmbed
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      success: false,
      error:
        "Discord bot token not configured. Please ask your mentor to set up the DISCORD_BOT_TOKEN.",
    };
  }

  const body: { content: string; embeds?: DiscordEmbed[] } = { content };
  if (embed) {
    body.embeds = [embed];
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API error:", errorText);
      return {
        success: false,
        error: `Failed to send message: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Discord send error:", error);
    return {
      success: false,
      error: "Failed to send message to Discord",
    };
  }
}

/**
 * Get channels for a Discord guild.
 */
async function getGuildChannels(
  guildId: string
): Promise<{ channels: DiscordChannel[]; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      channels: [],
      error:
        "Discord bot token not configured. Please ask your mentor to set up the DISCORD_BOT_TOKEN.",
    };
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        channels: [],
        error: `Failed to get channels: ${response.status}`,
      };
    }

    const channels = (await response.json()) as DiscordChannel[];
    return { channels };
  } catch (error) {
    console.error("Discord channels error:", error);
    return {
      channels: [],
      error: "Failed to get Discord channels",
    };
  }
}

/**
 * Execute a Discord tool call.
 */
export async function executeDiscordTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  // Get team's Discord guild ID
  const team = await ctx.runQuery(internal.agent.queries.discord.getTeamGuild, {
    teamId,
  });

  if (!team?.discordGuildId) {
    return {
      error:
        "This team doesn't have a Discord server linked. Please link your Discord server in the dashboard.",
    };
  }

  switch (toolName) {
    case "discord_list_channels": {
      const type = (input.type as string) || "text";
      const { channels, error } = await getGuildChannels(team.discordGuildId);

      if (error) {
        return { error };
      }

      let filteredChannels = channels;
      if (type === "text") {
        filteredChannels = channels.filter(
          (c) =>
            c.type === DISCORD_CHANNEL_TYPES.GUILD_TEXT ||
            c.type === DISCORD_CHANNEL_TYPES.GUILD_ANNOUNCEMENT
        );
      } else if (type === "voice") {
        filteredChannels = channels.filter(
          (c) =>
            c.type === DISCORD_CHANNEL_TYPES.GUILD_VOICE ||
            c.type === DISCORD_CHANNEL_TYPES.GUILD_STAGE_VOICE
        );
      } else {
        // Filter out categories
        filteredChannels = channels.filter(
          (c) => c.type !== DISCORD_CHANNEL_TYPES.GUILD_CATEGORY
        );
      }

      return {
        count: filteredChannels.length,
        channels: filteredChannels
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            id: c.id,
            name: c.name,
            type:
              c.type === DISCORD_CHANNEL_TYPES.GUILD_TEXT ||
              c.type === DISCORD_CHANNEL_TYPES.GUILD_ANNOUNCEMENT
                ? "text"
                : "voice",
          })),
      };
    }

    case "discord_send_message": {
      const message = input.message as string;
      const channelId = input.channelId as string | undefined;
      const channelName = input.channelName as string | undefined;
      const embed = input.embed as DiscordEmbed | undefined;

      // Resolve channel ID from name if needed
      let targetChannelId = channelId;

      if (!targetChannelId && channelName) {
        const { channels, error } = await getGuildChannels(team.discordGuildId);
        if (error) {
          return { error };
        }

        const channel = channels.find(
          (c) => c.name.toLowerCase() === channelName.toLowerCase()
        );
        if (!channel) {
          return {
            error: `Channel "${channelName}" not found. Use discord_list_channels to see available channels.`,
          };
        }
        targetChannelId = channel.id;
      }

      if (!targetChannelId) {
        return { error: "Please provide either channelId or channelName" };
      }

      const result = await sendDiscordMessage(targetChannelId, message, embed);
      return result;
    }

    default:
      return { error: `Unknown Discord tool: ${toolName}` };
  }
}
