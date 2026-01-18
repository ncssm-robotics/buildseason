import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Events/calendar tools for the agent.
 * Allows querying upcoming events, attendees, and event details.
 */
export const eventsTools: Anthropic.Tool[] = [
  {
    name: "events_list",
    description:
      "List upcoming events for the team. Use this to see what's scheduled.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: [
            "all",
            "competition",
            "outreach",
            "meeting",
            "practice",
            "other",
          ],
          description: "Filter by event type (default: all)",
        },
        daysAhead: {
          type: "number",
          description: "How many days ahead to look (default: 30)",
        },
        limit: {
          type: "number",
          description: "Maximum number of events to return (default: 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "events_get",
    description:
      "Get detailed information about a specific event including location and description.",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "The ID of the event (from events_list)",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "events_attendees",
    description:
      "Get the list of attendees for an event and their RSVP status.",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "The ID of the event",
        },
        status: {
          type: "string",
          enum: ["all", "going", "maybe", "not_going"],
          description: "Filter by RSVP status (default: all)",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "events_search",
    description: "Search for events by title or description keywords.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to find events",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Execute an events tool call.
 */
export async function executeEventsTool(
  ctx: ActionCtx,
  teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "events_list": {
      const type = (input.type as string) || "all";
      const daysAhead = (input.daysAhead as number) || 30;
      const limit = (input.limit as number) || 10;

      return ctx.runQuery(internal.agent.queries.events.list, {
        teamId,
        type: type === "all" ? undefined : type,
        daysAhead,
        limit,
      });
    }

    case "events_get": {
      const eventId = input.eventId as Id<"events">;
      return ctx.runQuery(internal.agent.queries.events.get, {
        teamId,
        eventId,
      });
    }

    case "events_attendees": {
      const eventId = input.eventId as Id<"events">;
      const status = (input.status as string) || "all";

      return ctx.runQuery(internal.agent.queries.events.attendees, {
        teamId,
        eventId,
        status: status === "all" ? undefined : status,
      });
    }

    case "events_search": {
      const query = input.query as string;
      return ctx.runQuery(internal.agent.queries.events.search, {
        teamId,
        query,
      });
    }

    default:
      return { error: `Unknown events tool: ${toolName}` };
  }
}
