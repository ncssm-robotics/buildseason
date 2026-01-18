import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Order management tools for the agent.
 */
export const ordersTools: Anthropic.Tool[] = [
  {
    name: "orders_list",
    description:
      "List orders for the team. Can filter by status (draft, pending, approved, rejected, ordered, received).",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description: "Filter by order status",
          enum: [
            "draft",
            "pending",
            "approved",
            "rejected",
            "ordered",
            "received",
          ],
        },
      },
      required: [],
    },
  },
  {
    name: "orders_get",
    description:
      "Get detailed information about a specific order, including line items.",
    input_schema: {
      type: "object" as const,
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the order to retrieve",
        },
      },
      required: ["orderId"],
    },
  },
  {
    name: "orders_summary",
    description:
      "Get a summary of all orders: counts by status, total pending value, recent activity.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute an orders tool call.
 */
export async function executeOrdersTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "orders_list": {
      const status = input.status as string | undefined;
      return ctx.runQuery(internal.agent.queries.orders.list, {
        teamId,
        status,
      });
    }

    case "orders_get": {
      const orderId = input.orderId as Id<"orders">;
      return ctx.runQuery(internal.agent.queries.orders.get, { orderId });
    }

    case "orders_summary": {
      return ctx.runQuery(internal.agent.queries.orders.summary, { teamId });
    }

    default:
      return { error: `Unknown orders tool: ${toolName}` };
  }
}
