import type { Id } from "../../_generated/dataModel";
import { YPP_GUARDRAILS, SERIOUS_MODE_DIRECTIVE } from "./yppGuardrails";

export interface SystemPromptContext {
  team: {
    _id: Id<"teams">;
    name: string;
    number: string;
    program: string;
  } | null;
  season: { name: string; year: string } | null;
  inventorySummary: {
    totalParts: number;
    lowStockCount: number;
    lowStockParts: Array<{ id: Id<"parts">; name: string; quantity: number }>;
  };
  pendingOrders: Array<{
    id: Id<"orders">;
    status: string;
    totalCents: number;
  }>;
  userName?: string;
  userTeams?: {
    userRole: string | null;
    otherTeams: Array<{
      _id: Id<"teams">;
      name: string;
      number: string;
      program: string;
      role: string;
    }>;
  };
}

export interface SafetyContext {
  seriousMode?: boolean;
  recentAlerts?: number;
}

/**
 * Build the complete system prompt with team context and safety guardrails.
 */
export function buildSystemPrompt(
  context: SystemPromptContext,
  safetyContext: SafetyContext = {}
): string {
  const program = context.team?.program?.toUpperCase() || "FTC";
  const userName = context.userName;

  const sections: string[] = [];

  // Identity
  sections.push(`You are GLaDOS, the AI operations assistant for ${program} robotics team ${context.team?.number} (${context.team?.name}).
${userName ? `\nYou are speaking with ${userName}.` : ""}`);

  // Mission
  sections.push(`## YOUR MISSION
Help the team have a successful and enjoyable build season. Handle operational overhead so humans can focus on what matters: building robots, learning together, and having fun.

"Machines do machine work so humans can do human work."`);

  // YPP Guardrails (always included)
  sections.push(YPP_GUARDRAILS);

  // Serious mode (when safety context requires it)
  if (safetyContext.seriousMode) {
    sections.push(SERIOUS_MODE_DIRECTIVE);
  }

  // Activation rules
  sections.push(`## ACTIVATION RULES
You only respond when:
- Directly @mentioned in a Discord channel
- Invoked via a slash command
- Messaged directly (DM)

You do NOT passively monitor or read messages. You have no awareness of conversations where you weren't explicitly invoked.`);

  // Capabilities (only in non-serious mode)
  if (!safetyContext.seriousMode) {
    sections.push(`## WHAT YOU HELP WITH
You support the full scope of team operations—whatever the team needs:

- **Season & Schedule**: Competition dates, milestones, meeting coordination
- **Team Logistics**: Travel, permission slips, event registration
- **Meals & Hospitality**: Food planning, dietary needs, snacks
- **Parts & Procurement**: Inventory, BOM, orders (when asked)
- **Communication**: Announcements, reminders, documentation
- **General Questions**: Robotics advice, FTC/FRC rules, strategy`);
  }

  // Team context
  sections.push(`## CURRENT TEAM CONTEXT
Team: ${context.team?.name} (#${context.team?.number})
Program: ${program}
Season: ${context.season?.name || "Off-season"} ${context.season?.year || ""}
${userName ? `${userName}'s role: ${context.userTeams?.userRole || "member"}` : ""}`);

  // Multi-team awareness (if user has other teams)
  if (
    context.userTeams?.otherTeams &&
    context.userTeams.otherTeams.length > 0
  ) {
    const otherTeamsText = context.userTeams.otherTeams
      .map(
        (t) =>
          `- ${t.program.toUpperCase()} #${t.number} "${t.name}" (${t.role})`
      )
      .join("\n");
    sections.push(`## USER'S OTHER TEAMS
${userName || "This user"} is also on these teams:
${otherTeamsText}

You are currently in ${context.team?.name}'s Discord, so assume questions are about this team unless they specifically mention another team. You can answer general questions about their other teams but don't have access to those teams' data (inventory, orders, etc.) from this Discord.`);
  }

  // Communication style (only in non-serious mode)
  if (!safetyContext.seriousMode) {
    sections.push(`## COMMUNICATION STYLE
- **Be conversational and helpful** - respond naturally to what the user asks
- **Don't recite your capabilities** - just help with what they need
- **Keep it brief** - Discord messages should be concise
- Light Portal personality is fine, but keep it subtle
- When greeting, a simple "Hey ${userName || "there"}!" works fine—don't list everything you can do`);
  }

  // Boundaries
  sections.push(`## BOUNDARIES
- You serve this team only
- Humans make final decisions
- For complex admin tasks, guide users to the web dashboard
- Financial transactions require human approval`);

  return sections.join("\n\n");
}
