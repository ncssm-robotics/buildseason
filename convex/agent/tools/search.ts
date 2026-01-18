import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

/**
 * Web search tool for the agent.
 * Uses Anthropic's built-in web search capability via server-side tools.
 *
 * Note: Anthropic's web search is a "server tool" that gets executed on Anthropic's
 * infrastructure, not via our tool execution. However, we also provide a fallback
 * implementation for cases where built-in search isn't available.
 */
export const searchTools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for restaurants, venues, suppliers, products, or general information. Use this when you need current information from the internet.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        location: {
          type: "string",
          description:
            "Optional location to search near (e.g., 'Indianapolis, IN')",
        },
        type: {
          type: "string",
          enum: ["restaurant", "venue", "supplier", "product", "general"],
          description: "Type of search to help refine results",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Build a Brave Search API request.
 * This is a fallback when Anthropic's built-in search isn't used.
 */
async function searchBrave(
  query: string,
  location?: string
): Promise<{
  results: Array<{ title: string; url: string; snippet: string }>;
}> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return {
      results: [
        {
          title: "Web search not configured",
          url: "",
          snippet:
            "Web search API key is not configured. Please ask your mentor to set up the BRAVE_SEARCH_API_KEY environment variable.",
        },
      ],
    };
  }

  const searchQuery = location ? `${query} near ${location}` : query;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    const results =
      data.web?.results?.map(
        (r: { title: string; url: string; description: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        })
      ) || [];

    return { results };
  } catch (error) {
    console.error("Web search error:", error);
    return {
      results: [
        {
          title: "Search error",
          url: "",
          snippet: "Unable to perform web search. Please try again later.",
        },
      ],
    };
  }
}

/**
 * Execute a search tool call.
 */
export async function executeSearchTool(
  _ctx: ActionCtx,
  _teamId: Id<"teams">,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "web_search": {
      const query = input.query as string;
      const location = input.location as string | undefined;
      const type = input.type as string | undefined;

      // Build enhanced query based on type
      let enhancedQuery = query;
      if (type === "restaurant") {
        enhancedQuery = `${query} restaurant food`;
      } else if (type === "venue") {
        enhancedQuery = `${query} venue event space`;
      } else if (type === "supplier") {
        enhancedQuery = `${query} supplier parts robotics FTC`;
      } else if (type === "product") {
        enhancedQuery = `${query} product buy purchase`;
      }

      const results = await searchBrave(enhancedQuery, location);

      return {
        query: enhancedQuery,
        location: location || "not specified",
        resultCount: results.results.length,
        results: results.results,
      };
    }

    default:
      return { error: `Unknown search tool: ${toolName}` };
  }
}
