import { hc } from "hono/client";
import type { ApiRoutes } from "./routes/api";

// Re-export the API routes type for consumers
export type { ApiRoutes };

/**
 * Create a typed API client for the BuildSeason API.
 * This provides end-to-end type safety between frontend and backend.
 *
 * @param baseUrl - The base URL of the API (e.g., "http://localhost:3000")
 * @returns A typed Hono client instance
 *
 * @example
 * ```ts
 * import { createApiClient } from "@buildseason/api/client";
 *
 * const api = createApiClient("http://localhost:3000");
 *
 * // Fully typed API calls
 * const teams = await api.api.teams.$get();
 * const data = await teams.json();
 * ```
 */
export function createApiClient(baseUrl: string) {
  return hc<ApiRoutes>(baseUrl);
}

// Type helper for the client instance
export type ApiClient = ReturnType<typeof createApiClient>;
