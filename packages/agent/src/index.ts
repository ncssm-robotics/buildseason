/**
 * BuildSeason Agent Package
 *
 * Core agent functionality including personality system,
 * model routing, cost optimization, and usage tracking.
 */

// Personality system
export {
  // Types
  type PersonalityConfig,
  type PersonalityName,

  // Personalities
  GLADOS,
  WHEATLEY,
  NEUTRAL,
  DEFAULT_PERSONALITY,
  personalities,

  // Functions
  getPersonality,
  getPersonalityStrict,
  listPersonalities,
  isValidPersonality,
  createCustomPersonality,
} from "./personalities";

// Model routing and selection
export {
  type ModelConfig,
  type QueryComplexity,
  type TaskType,
  MODELS,
  classifyQuery,
  selectModel,
  routeQuery,
  estimateCost,
} from "./model-router";

// Usage tracking
export {
  type TokenUsage,
  type UsageRecord,
  type UsageStats,
  trackUsage,
  getTeamUsage,
  getAllTeamUsage,
  resetTeamUsage,
  checkBudgetStatus,
  getCostSummary,
} from "./usage-tracker";
