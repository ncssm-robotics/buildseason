/**
 * Model Router - Smart model selection based on query complexity
 *
 * Strategy from docs/agentic-spec.md Section 7.4:
 * 1. Simple queries (budget check, stock lookup) -> Haiku (~$0.001/query)
 * 2. Complex reasoning (can we afford X given lead times?) -> Sonnet (~$0.01/query)
 * 3. Extended thinking for multi-step workflows -> Opus when needed
 *
 * Target: ~$10/month for typical team usage
 */

/**
 * Model configuration with pricing information
 */
export interface ModelConfig {
  /** Model identifier for API calls */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Cost per 1K input tokens in USD */
  inputCostPer1K: number;
  /** Cost per 1K output tokens in USD */
  outputCostPer1K: number;
  /** Estimated cost per typical query in USD */
  estimatedQueryCost: number;
  /** Maximum context window size */
  contextWindow: number;
  /** Whether this model supports extended thinking */
  supportsExtendedThinking: boolean;
}

/**
 * Query complexity classification
 */
export type QueryComplexity = "simple" | "complex" | "extended";

/**
 * Task types that influence model selection
 */
export type TaskType =
  | "query" // Simple data retrieval
  | "reasoning" // Multi-step logic
  | "workflow" // Complex multi-step workflow
  | "notification"; // Generating notifications/messages

/**
 * Available models with pricing (as of Dec 2025)
 */
export const MODELS: Record<string, ModelConfig> = {
  haiku: {
    id: "claude-haiku-3-5",
    name: "Claude 3.5 Haiku",
    inputCostPer1K: 0.0008,
    outputCostPer1K: 0.004,
    estimatedQueryCost: 0.001,
    contextWindow: 200000,
    supportsExtendedThinking: false,
  },
  sonnet: {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    estimatedQueryCost: 0.01,
    contextWindow: 200000,
    supportsExtendedThinking: false,
  },
  opus: {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    estimatedQueryCost: 0.05,
    contextWindow: 200000,
    supportsExtendedThinking: true,
  },
} as const;

/**
 * Patterns indicating simple queries - direct data lookups
 */
const SIMPLE_PATTERNS: RegExp[] = [
  /^what is\b/i,
  /^how much\b/i,
  /^show me\b/i,
  /^list\b/i,
  /^get\b/i,
  /^check\b/i,
  /^status\b/i,
  /\bbudget\b.*\?$/i,
  /\binventory\b.*\?$/i,
  /\bstock\b.*\?$/i,
  /\bhow many\b/i,
  /\bwhere is\b/i,
  /\bwhen did\b/i,
];

/**
 * Patterns indicating complex queries - require reasoning
 */
const COMPLEX_PATTERNS: RegExp[] = [
  /\bcan we afford\b/i,
  /\bwhat if\b/i,
  /\bcompare\b/i,
  /\bshould we\b/i,
  /\bwhy\b.*\?$/i,
  /\banalyze\b/i,
  /\brecommend\b/i,
  /\boptimize\b/i,
  /\bgiven\b.*\blead time/i,
  /\bcalculate\b.*\bif\b/i,
  /\bprioritize\b/i,
  /\btrade-?off/i,
  /\bconsidering\b/i,
];

/**
 * Patterns indicating extended thinking needs
 */
const EXTENDED_PATTERNS: RegExp[] = [
  /\bplan\b.*\bentire\b/i,
  /\bschedule\b.*\bseason\b/i,
  /\bstrategy\b.*\bcompetition/i,
  /\bdesign\b.*\bworkflow\b/i,
  /\bcreate\b.*\bcomprehensive\b/i,
  /\bmulti-?step\b.*\banalysis\b/i,
  /\blong-?term\b.*\bplanning\b/i,
];

/**
 * Classify a query's complexity based on its content
 *
 * @param query - The user's query string
 * @returns The complexity classification
 *
 * @example
 * classifyQuery("what is our budget?") // returns 'simple'
 * classifyQuery("can we afford 4 servos given lead times?") // returns 'complex'
 * classifyQuery("plan our entire build season schedule") // returns 'extended'
 */
export function classifyQuery(query: string): QueryComplexity {
  const normalizedQuery = query.trim().toLowerCase();

  // Check for extended thinking patterns first (most specific)
  for (const pattern of EXTENDED_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return "extended";
    }
  }

  // Check for complex reasoning patterns
  for (const pattern of COMPLEX_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return "complex";
    }
  }

  // Check for simple patterns
  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return "simple";
    }
  }

  // Default to complex for safety (better to over-provision than under)
  // Short queries (< 50 chars) without clear patterns are likely simple
  if (normalizedQuery.length < 50) {
    return "simple";
  }

  return "complex";
}

/**
 * Select the appropriate model based on classification and task type
 *
 * @param classification - The query complexity classification
 * @param taskType - The type of task being performed
 * @returns The recommended model configuration
 *
 * @example
 * selectModel('simple', 'query') // returns MODELS.haiku
 * selectModel('complex', 'reasoning') // returns MODELS.sonnet
 * selectModel('extended', 'workflow') // returns MODELS.opus
 */
export function selectModel(
  classification: QueryComplexity,
  taskType: TaskType = "query"
): ModelConfig {
  // Extended thinking always needs Opus
  if (classification === "extended") {
    return MODELS.opus;
  }

  // Complex reasoning needs Sonnet
  if (classification === "complex") {
    return MODELS.sonnet;
  }

  // For simple queries, use Haiku for most tasks
  // Exception: notifications still benefit from better language (use Sonnet)
  if (taskType === "notification") {
    return MODELS.sonnet;
  }

  return MODELS.haiku;
}

/**
 * Convenience function to route a query directly to a model
 *
 * @param query - The user's query string
 * @param taskType - Optional task type override
 * @returns The recommended model configuration
 *
 * @example
 * routeQuery("what is our budget?") // returns MODELS.haiku
 * routeQuery("can we afford 4 servos?") // returns MODELS.sonnet
 */
export function routeQuery(
  query: string,
  taskType: TaskType = "query"
): ModelConfig {
  const classification = classifyQuery(query);
  return selectModel(classification, taskType);
}

/**
 * Estimate the cost of a query based on expected token usage
 *
 * @param model - The model configuration
 * @param inputTokens - Estimated input tokens
 * @param outputTokens - Estimated output tokens
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000) * model.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * model.outputCostPer1K;
  return inputCost + outputCost;
}
