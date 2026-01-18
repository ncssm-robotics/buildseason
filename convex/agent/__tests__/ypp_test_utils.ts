/**
 * YPP (Youth Protection Policy) Test Utilities
 *
 * Provides mocking infrastructure for testing youth protection features
 * including AI classification, risk level routing, Discord DM sending,
 * and acknowledgment token management.
 */

/**
 * Risk level definitions for Youth Protection Policy
 */
export const RISK_LEVELS = {
  /** Proceed normally - no concerns detected */
  SAFE: 0,
  /** Log for review, proceed - minor flags for record keeping */
  FLAG_ONLY: 1,
  /** Create alert, DM mentors, proceed with caution - concerning content */
  ALERT_MENTOR: 2,
  /** Block message, escalate immediately - serious safety concern */
  BLOCK: 3,
} as const;

export type RiskLevel = (typeof RISK_LEVELS)[keyof typeof RISK_LEVELS];

/**
 * Classification result from AI classifier
 */
export interface ClassificationResult {
  riskLevel: RiskLevel;
  flags: string[];
}

/**
 * Mock classifier that returns deterministic results for testing.
 */
export function createMockClassifier(
  responses: Map<string, ClassificationResult>
): (message: string) => Promise<ClassificationResult> {
  return async (message: string): Promise<ClassificationResult> => {
    if (responses.has(message)) {
      return responses.get(message)!;
    }
    return { riskLevel: RISK_LEVELS.SAFE, flags: [] };
  };
}

/**
 * Expected behaviors for each risk level
 */
export interface RiskLevelBehavior {
  shouldProceed: boolean;
  shouldLog: boolean;
  shouldAlertMentor: boolean;
  shouldBlock: boolean;
  shouldShowNeutralResponse: boolean;
}

/**
 * Test helper to verify risk level routing.
 */
export function expectRiskLevelBehavior(riskLevel: number): RiskLevelBehavior {
  return {
    shouldProceed: riskLevel < RISK_LEVELS.BLOCK,
    shouldLog: riskLevel >= RISK_LEVELS.FLAG_ONLY,
    shouldAlertMentor: riskLevel >= RISK_LEVELS.ALERT_MENTOR,
    shouldBlock: riskLevel >= RISK_LEVELS.BLOCK,
    shouldShowNeutralResponse: riskLevel >= RISK_LEVELS.BLOCK,
  };
}

/**
 * Captured DM payload from mock Discord client
 */
export interface CapturedDM {
  userId: string;
  content: string;
  components?: unknown;
}

/**
 * Mock Discord client interface
 */
export interface MockDiscordClient {
  sendDM: (
    userId: string,
    content: string,
    components?: unknown
  ) => Promise<{ success: boolean; messageId: string }>;
  getSentDMs: () => CapturedDM[];
  clearDMs: () => void;
}

/**
 * Mock Discord client for testing DM sending.
 */
export function createMockDiscordClient(): MockDiscordClient {
  const sentDMs: CapturedDM[] = [];

  return {
    sendDM: async (userId: string, content: string, components?: unknown) => {
      sentDMs.push({ userId, content, components });
      return { success: true, messageId: `mock-${Date.now()}` };
    },
    getSentDMs: () => [...sentDMs],
    clearDMs: () => {
      sentDMs.length = 0;
    },
  };
}

/**
 * Token data stored in the mock token store
 */
export interface TokenData {
  discordUserId: string;
  alertId: string;
  expiresAt: number;
}

/**
 * Result from consuming a token
 */
export type ConsumeTokenResult =
  | { valid: true; data: TokenData }
  | { valid: false; reason: "not_found" | "expired" };

/**
 * Mock token store interface
 */
export interface MockTokenStore {
  generate: (discordUserId: string, alertId: string, ttlMs?: number) => string;
  consume: (token: string) => ConsumeTokenResult;
  getAll: () => Map<string, TokenData>;
}

/**
 * Mock token generator for acknowledgment tracking.
 */
export function createMockTokenStore(): MockTokenStore {
  const tokens = new Map<string, TokenData>();

  return {
    generate: (
      discordUserId: string,
      alertId: string,
      ttlMs = 3600000
    ): string => {
      const token = `test-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      tokens.set(token, {
        discordUserId,
        alertId,
        expiresAt: Date.now() + ttlMs,
      });
      return token;
    },
    consume: (token: string): ConsumeTokenResult => {
      const data = tokens.get(token);
      if (!data) {
        return { valid: false, reason: "not_found" };
      }
      if (Date.now() > data.expiresAt) {
        return { valid: false, reason: "expired" };
      }
      tokens.delete(token);
      return { valid: true, data };
    },
    getAll: () => new Map(tokens),
  };
}

/**
 * Test fixture builder for common YPP test scenarios
 */
export interface YPPTestFixture {
  classifier: ReturnType<typeof createMockClassifier>;
  discord: MockDiscordClient;
  tokenStore: MockTokenStore;
}

/**
 * Creates a complete test fixture with all YPP mocks configured.
 */
export function createYPPTestFixture(
  classifierResponses: Map<string, ClassificationResult> = new Map()
): YPPTestFixture {
  return {
    classifier: createMockClassifier(classifierResponses),
    discord: createMockDiscordClient(),
    tokenStore: createMockTokenStore(),
  };
}
