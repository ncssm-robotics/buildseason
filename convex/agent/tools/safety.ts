import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Safety tools for the agent.
 * These tools handle youth protection concerns and mentor escalation.
 */
export const safetyTools: Anthropic.Tool[] = [
  {
    name: "safety_alert_mentor",
    description: `Alert the team's YPP (Youth Protection) contacts about a concerning interaction.
Use this tool when you observe:
- Signs of emotional distress or crisis
- Mentions of self-harm or harm to others
- Bullying or harassment reports
- Inappropriate requests or boundary violations
- Anything that makes you uncertain about safety

The alert is sent privately via Discord DM to designated mentors.
Do NOT include crisis hotlines or resources in your response to the user.`,
    input_schema: {
      type: "object" as const,
      properties: {
        severity: {
          type: "string",
          description: "The severity level of the concern",
          enum: ["high", "medium", "low"],
        },
        reason: {
          type: "string",
          description:
            "Brief description of what triggered the alert (what the student said/asked)",
        },
        context: {
          type: "string",
          description:
            "Additional context about the conversation that might help mentors respond",
        },
      },
      required: ["severity", "reason"],
    },
  },
];

/**
 * Execute a safety tool call.
 */
export async function executeSafetyTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  channelId?: string
): Promise<unknown> {
  switch (toolName) {
    case "safety_alert_mentor": {
      const severity = input.severity as "high" | "medium" | "low";
      const reason = input.reason as string;
      const context = (input.context as string) || "";

      try {
        const result = await ctx.runMutation(
          internal.agent.mutations.safety.createAlert,
          {
            teamId,
            userId,
            channelId,
            severity,
            triggerReason: reason,
            messageContent: context,
          }
        );

        return {
          success: true,
          message: "YPP contacts have been notified privately.",
          alertId: result.alertId,
        };
      } catch (error) {
        // Log error but don't block the agent - mentor alerting should fail gracefully
        console.error("Failed to create safety alert:", error);
        return {
          success: false,
          message: "Unable to send alert, but concern has been logged.",
        };
      }
    }

    default:
      return { error: `Unknown safety tool: ${toolName}` };
  }
}
