/**
 * Discord embed builders for consistent message formatting.
 * Used throughout the bot for structured responses.
 */
import { EmbedBuilder } from "discord.js";

/** BuildSeason brand colors */
const COLORS = {
  success: 0x22c55e, // Green
  error: 0xef4444, // Red
  warning: 0xf59e0b, // Amber
  info: 0x3b82f6, // Blue
  primary: 0x8b5cf6, // Purple (brand)
} as const;

/**
 * Builds a success embed with green color.
 * @param title - Embed title
 * @param description - Embed description
 * @returns Discord EmbedBuilder instance
 */
export function buildSuccessEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS.success)
    .setTimestamp();
}

/**
 * Builds an error embed with red color.
 * @param message - Error message to display
 * @returns Discord EmbedBuilder instance
 */
export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Error")
    .setDescription(message)
    .setColor(COLORS.error)
    .setTimestamp();
}

/**
 * Builds a warning embed with amber color.
 * @param title - Embed title
 * @param description - Embed description
 * @returns Discord EmbedBuilder instance
 */
export function buildWarningEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS.warning)
    .setTimestamp();
}

/**
 * Builds an info embed with blue color.
 * @param title - Embed title
 * @param description - Embed description
 * @returns Discord EmbedBuilder instance
 */
export function buildInfoEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS.info)
    .setTimestamp();
}

/**
 * Budget status embed data
 */
export interface BudgetData {
  total: number;
  spent: number;
  remaining: number;
  category?: string;
}

/**
 * Builds a budget status embed.
 * @param budget - Budget data to display
 * @returns Discord EmbedBuilder instance
 */
export function buildBudgetEmbed(budget: BudgetData): EmbedBuilder {
  const isHealthy = budget.remaining > budget.total * 0.2; // > 20% remaining

  return new EmbedBuilder()
    .setTitle(budget.category ? `Budget: ${budget.category}` : "Budget Status")
    .setColor(isHealthy ? COLORS.success : COLORS.warning)
    .addFields(
      { name: "Total", value: `$${budget.total.toFixed(2)}`, inline: true },
      { name: "Spent", value: `$${budget.spent.toFixed(2)}`, inline: true },
      {
        name: "Remaining",
        value: `$${budget.remaining.toFixed(2)}`,
        inline: true,
      }
    )
    .setFooter({ text: "GLaDOS Budget Module" })
    .setTimestamp();
}

/**
 * Approval request embed data
 */
export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  amount?: number;
}

/**
 * Builds an approval request embed.
 * @param request - Approval request data
 * @returns Discord EmbedBuilder instance
 */
export function buildApprovalEmbed(request: ApprovalRequest): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Approval Request: ${request.title}`)
    .setDescription(request.description)
    .setColor(COLORS.primary)
    .addFields({ name: "Requested By", value: request.requestedBy })
    .setFooter({ text: `Request ID: ${request.id}` })
    .setTimestamp();

  if (request.amount !== undefined) {
    embed.addFields({
      name: "Amount",
      value: `$${request.amount.toFixed(2)}`,
      inline: true,
    });
  }

  return embed;
}

/**
 * Builds a rate limit notification embed.
 * @param remainingMs - Remaining cooldown in milliseconds
 * @returns Discord EmbedBuilder instance
 */
export function buildRateLimitEmbed(remainingMs: number): EmbedBuilder {
  const seconds = Math.ceil(remainingMs / 1000);
  return new EmbedBuilder()
    .setTitle("Slow Down")
    .setDescription(
      `Please wait ${seconds} second${seconds !== 1 ? "s" : ""} before sending another message.`
    )
    .setColor(COLORS.warning);
}
