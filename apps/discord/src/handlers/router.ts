/**
 * Message routing logic.
 * Classifies queries and routes to appropriate handlers.
 */
import type { Message } from "discord.js";
import type { TeamContext } from "../utils/permissions";
import { buildInfoEmbed, buildErrorEmbed } from "../utils/embeds";

/**
 * Route classification result.
 */
export interface RouteResult {
  /** Query complexity type */
  type: "simple" | "complex" | "workflow";
  /** Handler identifier */
  handler: string;
}

/**
 * Routes a message to the appropriate handler based on content analysis.
 *
 * @param message - Discord message to handle
 * @param content - Cleaned message content (mentions removed)
 * @param teamContext - Team context from channel
 */
export async function routeMessage(
  message: Message,
  content: string,
  teamContext: TeamContext
): Promise<void> {
  // Classify the query
  const route = classifyQuery(content);

  switch (route.type) {
    case "simple":
      await handleSimpleQuery(message, content, teamContext);
      break;
    case "complex":
      await handleComplexQuery(message, content, teamContext);
      break;
    case "workflow":
      await handleWorkflowTrigger(message, content, teamContext);
      break;
  }
}

/**
 * Classifies a query to determine routing.
 * Simple queries go to direct handlers, complex to AI, workflows to Temporal.
 *
 * @param content - Message content to classify
 * @returns Route classification result
 */
export function classifyQuery(content: string): RouteResult {
  const normalizedContent = content.toLowerCase().trim();

  // Simple patterns - direct database queries
  if (/^(status|budget|inventory|parts|help)\s*\??$/i.test(normalizedContent)) {
    return { type: "simple", handler: "quick-query" };
  }

  // Workflow triggers - requires approval/multi-step processes
  if (/^(approve|reject|order|request|submit)/i.test(normalizedContent)) {
    return { type: "workflow", handler: "workflow-trigger" };
  }

  // Scheduling/reminder patterns
  if (/^(remind|schedule|set.*reminder)/i.test(normalizedContent)) {
    return { type: "workflow", handler: "schedule-trigger" };
  }

  // Default to complex - requires AI reasoning
  return { type: "complex", handler: "agent-query" };
}

/**
 * Handles simple queries with direct responses.
 * These don't require AI reasoning - just database lookups.
 */
async function handleSimpleQuery(
  message: Message,
  content: string,
  teamContext: TeamContext
): Promise<void> {
  const normalizedContent = content.toLowerCase().trim();

  // Help command
  if (normalizedContent === "help") {
    await message.reply({
      embeds: [
        buildInfoEmbed(
          "GLaDOS Help",
          [
            "**Available Commands:**",
            "- `@GLaDOS help` - Show this help message",
            "- `@GLaDOS status` - Show team status",
            "- `@GLaDOS budget` - Check budget status",
            "- `@GLaDOS inventory` - View inventory summary",
            "",
            "**Slash Commands:**",
            "- `/budget [category]` - Check budget by category",
            "- `/inventory [search]` - Search inventory",
            "",
            "**Natural Language:**",
            "Just mention me with your question!",
            'Example: "Can we afford 4 servos?"',
          ].join("\n")
        ),
      ],
    });
    return;
  }

  // Status query
  if (normalizedContent === "status") {
    if (!teamContext.teamId) {
      await message.reply({
        embeds: [
          buildErrorEmbed(
            "Cannot determine team context from this channel. " +
              "Please use this command in a team channel."
          ),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        buildInfoEmbed(
          "Team Status",
          [
            `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
            "",
            "*Full status integration coming soon...*",
          ].join("\n")
        ),
      ],
    });
    return;
  }

  // Budget query (simple version)
  if (normalizedContent === "budget") {
    if (!teamContext.teamId) {
      await message.reply({
        embeds: [
          buildErrorEmbed(
            "Cannot determine team context from this channel. " +
              "Please use this command in a team channel."
          ),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        buildInfoEmbed(
          "Budget Status",
          [
            `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
            "",
            "*Budget integration coming soon...*",
            "For detailed queries, ask naturally:",
            '"How much budget do we have for electronics?"',
          ].join("\n")
        ),
      ],
    });
    return;
  }

  // Inventory query (simple version)
  if (normalizedContent === "inventory" || normalizedContent === "parts") {
    if (!teamContext.teamId) {
      await message.reply({
        embeds: [
          buildErrorEmbed(
            "Cannot determine team context from this channel. " +
              "Please use this command in a team channel."
          ),
        ],
      });
      return;
    }

    await message.reply({
      embeds: [
        buildInfoEmbed(
          "Inventory Summary",
          [
            `**Team:** ${teamContext.program} ${teamContext.teamNumber}`,
            "",
            "*Inventory integration coming soon...*",
            "For specific searches, ask naturally:",
            '"Do we have any GoBilda servos?"',
          ].join("\n")
        ),
      ],
    });
    return;
  }

  // Fallback - shouldn't reach here if classifyQuery is correct
  await handleComplexQuery(message, content, teamContext);
}

/**
 * Handles complex queries that require AI reasoning.
 * Routes to Claude Agent SDK (to be implemented).
 */
async function handleComplexQuery(
  message: Message,
  content: string,
  teamContext: TeamContext
): Promise<void> {
  // Show typing indicator while "thinking"
  if ("sendTyping" in message.channel) {
    await message.channel.sendTyping();
  }

  // Placeholder response - will be replaced with actual agent integration
  await message.reply({
    embeds: [
      buildInfoEmbed(
        "Processing Query",
        [
          `**Your question:** ${content}`,
          "",
          teamContext.teamId
            ? `**Team context:** ${teamContext.program} ${teamContext.teamNumber}`
            : "*No team context detected*",
          "",
          "*Claude Agent integration coming soon...*",
          "This query would be processed by our AI agent to:",
          "- Cross-reference inventory and budget",
          "- Check vendor availability",
          "- Provide intelligent recommendations",
        ].join("\n")
      ),
    ],
  });
}

/**
 * Handles workflow triggers that start Temporal workflows.
 * Examples: order approval, permission forms, etc.
 */
async function handleWorkflowTrigger(
  message: Message,
  content: string,
  teamContext: TeamContext
): Promise<void> {
  // Placeholder response - will be replaced with Temporal integration
  await message.reply({
    embeds: [
      buildInfoEmbed(
        "Workflow Trigger",
        [
          `**Action requested:** ${content}`,
          "",
          teamContext.teamId
            ? `**Team context:** ${teamContext.program} ${teamContext.teamNumber}`
            : "*No team context detected*",
          "",
          "*Temporal workflow integration coming soon...*",
          "This would trigger a workflow for:",
          "- Multi-step approval processes",
          "- Order placement and tracking",
          "- Permission form collection",
        ].join("\n")
      ),
    ],
  });
}
