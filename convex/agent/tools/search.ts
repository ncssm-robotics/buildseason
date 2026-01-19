import type Anthropic from "@anthropic-ai/sdk";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

/**
 * Web search tool for the agent.
 * Uses SerpAPI for Google search results.
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
          description: "Optional location to search near (e.g., 'Raleigh, NC')",
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
 * SerpAPI response types
 */
interface SerpAPIResult {
  title: string;
  link: string;
  snippet?: string;
}

interface SerpAPILocalResult {
  title: string;
  address?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  phone?: string;
}

/**
 * Search using SerpAPI (Google search results).
 */
async function searchSerpAPI(
  query: string,
  location?: string,
  searchType?: string
): Promise<{
  results: Array<{ title: string; url: string; snippet: string }>;
  localResults?: Array<{
    name: string;
    address?: string;
    rating?: number;
    type?: string;
  }>;
}> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return {
      results: [
        {
          title: "Web search not configured",
          url: "",
          snippet:
            "Web search API key is not configured. Please ask your mentor to set up the SERPAPI_KEY environment variable.",
        },
      ],
    };
  }

  // Build search parameters
  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: "google",
    num: "5",
  });

  // Add location if provided
  if (location) {
    params.set("location", location);
  }

  // Use local search for restaurants/venues
  if (searchType === "restaurant" || searchType === "venue") {
    params.set("tbm", "lcl"); // Local search
  }

  const url = `https://serpapi.com/search.json?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    // Handle local results (for restaurants/venues)
    if (data.local_results) {
      const localResults = data.local_results.map((r: SerpAPILocalResult) => ({
        name: r.title,
        address: r.address,
        rating: r.rating,
        type: r.type,
      }));

      return {
        results: [],
        localResults,
      };
    }

    // Handle organic web results
    const results =
      data.organic_results?.map((r: SerpAPIResult) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet || "",
      })) || [];

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
        enhancedQuery = `${query} restaurants`;
      } else if (type === "venue") {
        enhancedQuery = `${query} venue event space`;
      } else if (type === "supplier") {
        enhancedQuery = `${query} supplier parts robotics FTC`;
      } else if (type === "product") {
        enhancedQuery = `${query} buy`;
      }

      const searchResults = await searchSerpAPI(enhancedQuery, location, type);

      // Format response based on result type
      if (searchResults.localResults && searchResults.localResults.length > 0) {
        return {
          query: enhancedQuery,
          location: location || "not specified",
          resultCount: searchResults.localResults.length,
          type: "local",
          places: searchResults.localResults,
        };
      }

      return {
        query: enhancedQuery,
        location: location || "not specified",
        resultCount: searchResults.results.length,
        type: "web",
        results: searchResults.results,
      };
    }

    default:
      return { error: `Unknown search tool: ${toolName}` };
  }
}
