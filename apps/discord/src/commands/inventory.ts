/**
 * Inventory slash command.
 * Allows users to search and view team inventory.
 */
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buildErrorEmbed, buildInfoEmbed } from "../utils/embeds";
import { getTeamContext } from "../utils/permissions";
import type { SlashCommand } from "./types";

export const inventoryCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Search team inventory")
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("Search query (part name, SKU, or description)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("vendor")
        .setDescription("Filter by vendor (e.g., GoBilda, REV, AndyMark)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const search = interaction.options.getString("search");
    const vendor = interaction.options.getString("vendor");

    // Get team context from channel
    const teamContext = await getTeamContext(interaction.channel!);

    if (!teamContext.teamId) {
      await interaction.editReply({
        embeds: [
          buildErrorEmbed(
            "Cannot determine team context from this channel. " +
              "Please use this command in a team channel (e.g., #ftc-12345-general)."
          ),
        ],
      });
      return;
    }

    // TODO: Fetch actual inventory data from database
    // For now, return placeholder response
    const filters: string[] = [];
    if (search) filters.push(`Search: "${search}"`);
    if (vendor) filters.push(`Vendor: ${vendor}`);

    const filterText = filters.length > 0 ? filters.join(", ") : "All items";

    await interaction.editReply({
      embeds: [
        buildInfoEmbed(
          "Inventory Search",
          [
            `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
            `**Filters:** ${filterText}`,
            "",
            "*Inventory integration coming soon...*",
            "",
            "This will show:",
            "- Parts matching your search",
            "- Current quantities",
            "- Storage locations",
            "- Reorder status",
          ].join("\n")
        ),
      ],
    });
  },
};
