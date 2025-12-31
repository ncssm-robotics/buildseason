/**
 * Usage Tracker - Track AI model usage per team for billing and monitoring
 *
 * Stores usage statistics in memory with optional persistence hooks.
 * Designed for potential future billing integration per team.
 */

import { type ModelConfig, MODELS, estimateCost } from "./model-router";

/**
 * Token usage for a single request
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Usage record for a single model call
 */
export interface UsageRecord {
  timestamp: Date;
  modelId: string;
  modelName: string;
  tokens: TokenUsage;
  estimatedCost: number;
}

/**
 * Aggregated usage statistics for a team
 */
export interface UsageStats {
  teamId: string;
  /** Total requests made */
  totalRequests: number;
  /** Total tokens used (input + output) */
  totalTokens: number;
  /** Total estimated cost in USD */
  totalCost: number;
  /** Breakdown by model */
  byModel: {
    [modelId: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  /** Period start (for billing cycles) */
  periodStart: Date;
  /** Recent usage records (last 100) */
  recentRecords: UsageRecord[];
}

/**
 * In-memory storage for team usage (production would use database)
 */
const teamUsageMap = new Map<string, UsageStats>();

/**
 * Create initial usage stats for a team
 */
function createInitialStats(teamId: string): UsageStats {
  return {
    teamId,
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    byModel: {},
    periodStart: new Date(),
    recentRecords: [],
  };
}

/**
 * Track usage for a team after a model call
 *
 * @param teamId - The team identifier
 * @param model - The model configuration or model key
 * @param tokens - Token usage for the request
 *
 * @example
 * trackUsage('team-123', MODELS.haiku, { inputTokens: 500, outputTokens: 200, totalTokens: 700 })
 * trackUsage('team-123', 'sonnet', { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 })
 */
export function trackUsage(
  teamId: string,
  model: ModelConfig | string,
  tokens: TokenUsage
): void {
  // Resolve model config if string key provided
  const modelConfig: ModelConfig =
    typeof model === "string" ? MODELS[model] : model;

  if (!modelConfig) {
    console.warn(`Unknown model: ${model}`);
    return;
  }

  // Get or create team stats
  let stats = teamUsageMap.get(teamId);
  if (!stats) {
    stats = createInitialStats(teamId);
    teamUsageMap.set(teamId, stats);
  }

  // Calculate cost for this request
  const cost = estimateCost(
    modelConfig,
    tokens.inputTokens,
    tokens.outputTokens
  );

  // Create usage record
  const record: UsageRecord = {
    timestamp: new Date(),
    modelId: modelConfig.id,
    modelName: modelConfig.name,
    tokens,
    estimatedCost: cost,
  };

  // Update totals
  stats.totalRequests++;
  stats.totalTokens += tokens.totalTokens;
  stats.totalCost += cost;

  // Update model breakdown
  if (!stats.byModel[modelConfig.id]) {
    stats.byModel[modelConfig.id] = {
      requests: 0,
      tokens: 0,
      cost: 0,
    };
  }
  stats.byModel[modelConfig.id].requests++;
  stats.byModel[modelConfig.id].tokens += tokens.totalTokens;
  stats.byModel[modelConfig.id].cost += cost;

  // Add to recent records (keep last 100)
  stats.recentRecords.push(record);
  if (stats.recentRecords.length > 100) {
    stats.recentRecords.shift();
  }
}

/**
 * Get usage statistics for a team
 *
 * @param teamId - The team identifier
 * @returns Usage statistics or null if no usage recorded
 *
 * @example
 * const stats = getTeamUsage('team-123')
 * console.log(`Total cost: $${stats?.totalCost.toFixed(4)}`)
 */
export function getTeamUsage(teamId: string): UsageStats | null {
  return teamUsageMap.get(teamId) ?? null;
}

/**
 * Get usage statistics for all teams
 *
 * @returns Map of team ID to usage statistics
 */
export function getAllTeamUsage(): Map<string, UsageStats> {
  return new Map(teamUsageMap);
}

/**
 * Reset usage statistics for a team (e.g., at billing cycle start)
 *
 * @param teamId - The team identifier
 * @returns The previous usage stats before reset
 */
export function resetTeamUsage(teamId: string): UsageStats | null {
  const previousStats = teamUsageMap.get(teamId);
  if (previousStats) {
    teamUsageMap.set(teamId, createInitialStats(teamId));
  }
  return previousStats ?? null;
}

/**
 * Check if a team is approaching or exceeding a budget threshold
 *
 * @param teamId - The team identifier
 * @param monthlyBudget - Monthly budget in USD
 * @returns Budget status with percentage used and warnings
 *
 * @example
 * const status = checkBudgetStatus('team-123', 10) // $10/month budget
 * if (status.isOverBudget) {
 *   // Alert team admin
 * }
 */
export function checkBudgetStatus(
  teamId: string,
  monthlyBudget: number
): {
  currentCost: number;
  percentUsed: number;
  isOverBudget: boolean;
  isApproachingLimit: boolean;
} {
  const stats = teamUsageMap.get(teamId);
  const currentCost = stats?.totalCost ?? 0;
  const percentUsed = (currentCost / monthlyBudget) * 100;

  return {
    currentCost,
    percentUsed,
    isOverBudget: currentCost > monthlyBudget,
    isApproachingLimit: percentUsed >= 80 && percentUsed < 100,
  };
}

/**
 * Get cost summary formatted for display
 *
 * @param teamId - The team identifier
 * @returns Formatted cost summary string
 */
export function getCostSummary(teamId: string): string {
  const stats = teamUsageMap.get(teamId);
  if (!stats) {
    return "No usage recorded";
  }

  const lines = [
    `Team: ${teamId}`,
    `Total Requests: ${stats.totalRequests}`,
    `Total Tokens: ${stats.totalTokens.toLocaleString()}`,
    `Total Cost: $${stats.totalCost.toFixed(4)}`,
    "",
    "Breakdown by Model:",
  ];

  for (const [modelId, modelStats] of Object.entries(stats.byModel)) {
    lines.push(
      `  ${modelId}: ${modelStats.requests} requests, $${modelStats.cost.toFixed(4)}`
    );
  }

  return lines.join("\n");
}
