import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Parts inventory tools for the agent.
 */
export const partsTools: Anthropic.Tool[] = [
  {
    name: "parts_list",
    description:
      "Get the current parts inventory for the team. Returns all parts with quantities, locations, and vendor info.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: {
          type: "string",
          description:
            "Optional filter: 'low_stock' to show only items at or below reorder point, 'all' for everything",
          enum: ["all", "low_stock"],
        },
      },
      required: [],
    },
  },
  {
    name: "parts_search",
    description:
      "Search for parts by name. Use this when looking for a specific part.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to find parts by name",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "parts_get",
    description: "Get detailed information about a specific part by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        partId: {
          type: "string",
          description: "The ID of the part to retrieve",
        },
      },
      required: ["partId"],
    },
  },
  {
    name: "parts_adjust_quantity",
    description:
      "Adjust the quantity of a part. Use positive numbers to add, negative to subtract.",
    input_schema: {
      type: "object" as const,
      properties: {
        partId: {
          type: "string",
          description: "The ID of the part to adjust",
        },
        adjustment: {
          type: "number",
          description:
            "Amount to adjust by (positive to add, negative to subtract)",
        },
      },
      required: ["partId", "adjustment"],
    },
  },
];

/**
 * Execute a parts tool call.
 */
export async function executePartsTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "parts_list": {
      const filter = (input.filter as string) || "all";
      if (filter === "low_stock") {
        return ctx.runQuery(internal.agent.queries.parts.getLowStock, {
          teamId,
        });
      }
      return ctx.runQuery(internal.agent.queries.parts.list, { teamId });
    }

    case "parts_search": {
      const query = input.query as string;
      return ctx.runQuery(internal.agent.queries.parts.search, {
        teamId,
        query,
      });
    }

    case "parts_get": {
      const partId = input.partId as Id<"parts">;
      return ctx.runQuery(internal.agent.queries.parts.get, { partId });
    }

    case "parts_adjust_quantity": {
      const partId = input.partId as Id<"parts">;
      const adjustment = input.adjustment as number;
      return ctx.runMutation(internal.agent.mutations.parts.adjustQuantity, {
        partId,
        adjustment,
      });
    }

    default:
      return { error: `Unknown parts tool: ${toolName}` };
  }
}
