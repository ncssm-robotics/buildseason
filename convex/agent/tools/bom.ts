import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Bill of Materials (BOM) tools for the agent.
 */
export const bomTools: Anthropic.Tool[] = [
  {
    name: "bom_list",
    description:
      "List all BOM items for the team. Shows what parts are needed for each subsystem.",
    input_schema: {
      type: "object" as const,
      properties: {
        subsystem: {
          type: "string",
          description:
            "Optional: filter by subsystem name (e.g., 'drivetrain', 'intake', 'arm')",
        },
      },
      required: [],
    },
  },
  {
    name: "bom_status",
    description:
      "Get BOM fulfillment status: which items are fully stocked, partially stocked, or missing.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bom_shortages",
    description:
      "List BOM items where current inventory is less than the quantity needed.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a BOM tool call.
 */
export async function executeBomTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "bom_list": {
      const subsystem = input.subsystem as string | undefined;
      return ctx.runQuery(internal.agent.queries.bom.list, {
        teamId,
        subsystem,
      });
    }

    case "bom_status": {
      return ctx.runQuery(internal.agent.queries.bom.status, { teamId });
    }

    case "bom_shortages": {
      return ctx.runQuery(internal.agent.queries.bom.shortages, { teamId });
    }

    default:
      return { error: `Unknown BOM tool: ${toolName}` };
  }
}
