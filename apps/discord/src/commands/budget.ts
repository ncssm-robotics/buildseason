/**
 * Budget slash command.
 * Allows users to check team budget status.
 */
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buildErrorEmbed, buildInfoEmbed } from "../utils/embeds";
import { getTeamContext } from "../utils/permissions";
import type { SlashCommand } from "./types";

export const budgetCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("budget")
    .setDescription("Check team budget status")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Budget category to check (e.g., parts, travel, meals)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const category = interaction.options.getString("category");

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

    // TODO: Fetch actual budget data from database
    // For now, return placeholder response
    if (category) {
      await interaction.editReply({
        embeds: [
          buildInfoEmbed(
            `Budget: ${category}`,
            [
              `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
              `**Category:** ${category}`,
              "",
              "*Budget integration coming soon...*",
              "",
              "This will show:",
              `- Allocated budget for ${category}`,
              `- Spent amount in ${category}`,
              "- Remaining budget",
              "- Recent transactions",
            ].join("\n")
          ),
        ],
      });
    } else {
      // Return overall budget summary
      await interaction.editReply({
        embeds: [
          buildInfoEmbed(
            "Budget Summary",
            [
              `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
              "",
              "*Budget integration coming soon...*",
              "",
              "This will show:",
              "- Total team budget",
              "- Budget by category breakdown",
              "- Overall spending trends",
            ].join("\n")
          ),
        ],
      });
    }
  },
};
