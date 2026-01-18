import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { partsTools, executePartsTool } from "./parts";
import { ordersTools, executeOrdersTool } from "./orders";
import { bomTools, executeBomTool } from "./bom";
import { safetyTools, executeSafetyTool } from "./safety";

/**
 * Build all tools available to the agent.
 * Tools are thin wrappers around Convex mutations and queries.
 */
export function buildTools(): Anthropic.Tool[] {
  return [...partsTools, ...ordersTools, ...bomTools, ...safetyTools];
}

/**
 * Execute a tool call by name.
 * Routes to the appropriate tool handler based on tool name.
 */
export async function executeToolCall(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>,
  userId?: string,
  channelId?: string
): Promise<unknown> {
  // Parts tools
  if (toolName.startsWith("parts_")) {
    return executePartsTool(ctx, teamId, toolName, input);
  }

  // Orders tools
  if (toolName.startsWith("orders_")) {
    return executeOrdersTool(ctx, teamId, toolName, input);
  }

  // BOM tools
  if (toolName.startsWith("bom_")) {
    return executeBomTool(ctx, teamId, toolName, input);
  }

  // Safety tools (need userId/channelId for alert context)
  if (toolName.startsWith("safety_")) {
    return executeSafetyTool(
      ctx,
      teamId,
      toolName,
      input,
      userId || "unknown",
      channelId
    );
  }

  return { error: `Unknown tool: ${toolName}` };
}
