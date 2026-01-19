import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Team member tools for the agent.
 * Allows querying team member information including dietary restrictions and preferences.
 */
export const membersTools: Anthropic.Tool[] = [
  {
    name: "members_list",
    description:
      "List team members with their roles. Use this to see who's on the team.",
    input_schema: {
      type: "object" as const,
      properties: {
        role: {
          type: "string",
          description:
            "Optional filter: 'all' for everyone, or filter by specific role",
          enum: ["all", "mentor", "student", "lead_mentor"],
        },
      },
      required: [],
    },
  },
  {
    name: "members_get",
    description:
      "Get detailed info for a team member including dietary restrictions and personal notes. Search by name or ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        memberId: {
          type: "string",
          description: "The ID of the member (from members_list)",
        },
        name: {
          type: "string",
          description: "Search by name instead of ID",
        },
      },
      required: [],
    },
  },
  {
    name: "members_dietary_summary",
    description:
      "Get a summary of dietary restrictions and needs for a list of members. Useful for planning meals for events or outings.",
    input_schema: {
      type: "object" as const,
      properties: {
        memberIds: {
          type: "array",
          items: { type: "string" },
          description:
            "List of member IDs to summarize dietary needs for. If empty, summarizes all team members.",
        },
      },
      required: [],
    },
  },
];

/**
 * Execute a members tool call.
 */
export async function executeMembersTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "members_list": {
      const role = (input.role as string) || "all";
      return ctx.runQuery(internal.agent.queries.members.list, {
        teamId,
        role: role === "all" ? undefined : role,
      });
    }

    case "members_get": {
      const memberId = input.memberId as string | undefined;
      const name = input.name as string | undefined;

      if (memberId) {
        return ctx.runQuery(internal.agent.queries.members.get, {
          teamId,
          memberId: memberId as Id<"teamMembers">,
        });
      } else if (name) {
        return ctx.runQuery(internal.agent.queries.members.getByName, {
          teamId,
          name,
        });
      }
      return { error: "Please provide either memberId or name" };
    }

    case "members_dietary_summary": {
      const memberIds = (input.memberIds as string[]) || [];
      return ctx.runQuery(internal.agent.queries.members.dietarySummary, {
        teamId,
        memberIds: memberIds as Id<"teamMembers">[],
      });
    }

    default:
      return { error: `Unknown members tool: ${toolName}` };
  }
}
