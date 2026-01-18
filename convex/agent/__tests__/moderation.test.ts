import { describe, it, expect } from "vitest";
import {
  RISK_LEVELS,
  getRiskLevelBehavior,
  prescreenMessage,
  type ClassificationResult,
} from "../moderation";

/**
 * Create a mock classifier for testing
 */
function createMockClassifier(
  responses: Map<string, ClassificationResult>
): (message: string) => Promise<ClassificationResult> {
  return async (message: string): Promise<ClassificationResult> => {
    if (responses.has(message)) {
      return responses.get(message)!;
    }
    return { riskLevel: RISK_LEVELS.SAFE, flags: [] };
  };
}

describe("Content Pre-Screening", () => {
  describe("getRiskLevelBehavior", () => {
    it("level 0 (SAFE): proceeds without logging or alerts", () => {
      const behavior = getRiskLevelBehavior(RISK_LEVELS.SAFE);

      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(false);
      expect(behavior.shouldAlertMentor).toBe(false);
      expect(behavior.shouldBlock).toBe(false);
      expect(behavior.neutralResponse).toBeNull();
    });

    it("level 1 (FLAG_ONLY): proceeds with logging", () => {
      const behavior = getRiskLevelBehavior(RISK_LEVELS.FLAG_ONLY);

      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(false);
      expect(behavior.shouldBlock).toBe(false);
      expect(behavior.neutralResponse).toBeNull();
    });

    it("level 2 (ALERT_MENTOR): proceeds with logging and mentor alert", () => {
      const behavior = getRiskLevelBehavior(RISK_LEVELS.ALERT_MENTOR);

      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(true);
      expect(behavior.shouldBlock).toBe(false);
      expect(behavior.neutralResponse).toBeNull();
    });

    it("level 3 (BLOCK): blocks with neutral response and escalation", () => {
      const behavior = getRiskLevelBehavior(RISK_LEVELS.BLOCK);

      expect(behavior.shouldProceed).toBe(false);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(true);
      expect(behavior.shouldBlock).toBe(true);
      expect(behavior.neutralResponse).not.toBeNull();
      expect(behavior.neutralResponse).toContain("mentor");
    });

    it("neutral response does NOT contain crisis hotlines", () => {
      const behavior = getRiskLevelBehavior(RISK_LEVELS.BLOCK);

      // Critical YPP requirement: never publicly show crisis resources
      expect(behavior.neutralResponse).not.toContain("988");
      expect(behavior.neutralResponse).not.toContain("Crisis");
      expect(behavior.neutralResponse).not.toContain("hotline");
      expect(behavior.neutralResponse).not.toContain("Suicide");
    });
  });

  describe("prescreenMessage", () => {
    it("classifies safe messages correctly", async () => {
      const mockClassifier = createMockClassifier(
        new Map([
          [
            "help with the robot arm",
            { riskLevel: RISK_LEVELS.SAFE, flags: [] },
          ],
        ])
      );

      const result = await prescreenMessage(
        "help with the robot arm",
        mockClassifier
      );

      expect(result.classification.riskLevel).toBe(RISK_LEVELS.SAFE);
      expect(result.behavior.shouldProceed).toBe(true);
      expect(result.behavior.shouldAlertMentor).toBe(false);
    });

    it("classifies concerning messages and triggers mentor alert", async () => {
      const mockClassifier = createMockClassifier(
        new Map([
          [
            "feeling really down today",
            { riskLevel: RISK_LEVELS.ALERT_MENTOR, flags: ["distress"] },
          ],
        ])
      );

      const result = await prescreenMessage(
        "feeling really down today",
        mockClassifier
      );

      expect(result.classification.riskLevel).toBe(RISK_LEVELS.ALERT_MENTOR);
      expect(result.classification.flags).toContain("distress");
      expect(result.behavior.shouldProceed).toBe(true);
      expect(result.behavior.shouldAlertMentor).toBe(true);
    });

    it("blocks high-risk messages with neutral response", async () => {
      const mockClassifier = createMockClassifier(
        new Map([
          [
            "dangerous content",
            { riskLevel: RISK_LEVELS.BLOCK, flags: ["self_harm"] },
          ],
        ])
      );

      const result = await prescreenMessage(
        "dangerous content",
        mockClassifier
      );

      expect(result.classification.riskLevel).toBe(RISK_LEVELS.BLOCK);
      expect(result.behavior.shouldProceed).toBe(false);
      expect(result.behavior.shouldBlock).toBe(true);
      expect(result.behavior.neutralResponse).not.toBeNull();
    });

    it("logs but proceeds for minor flags", async () => {
      const mockClassifier = createMockClassifier(
        new Map([
          [
            "ugh this is frustrating",
            { riskLevel: RISK_LEVELS.FLAG_ONLY, flags: ["venting"] },
          ],
        ])
      );

      const result = await prescreenMessage(
        "ugh this is frustrating",
        mockClassifier
      );

      expect(result.classification.riskLevel).toBe(RISK_LEVELS.FLAG_ONLY);
      expect(result.behavior.shouldProceed).toBe(true);
      expect(result.behavior.shouldLog).toBe(true);
      expect(result.behavior.shouldAlertMentor).toBe(false);
    });

    it("defaults to safe for unknown messages", async () => {
      const mockClassifier = createMockClassifier(new Map());

      const result = await prescreenMessage("random message", mockClassifier);

      expect(result.classification.riskLevel).toBe(RISK_LEVELS.SAFE);
      expect(result.behavior.shouldProceed).toBe(true);
    });
  });

  describe("YPP Compliance", () => {
    it("no risk level behavior includes public crisis resources", () => {
      // Test all risk levels to ensure none expose crisis resources publicly
      for (const level of [
        RISK_LEVELS.SAFE,
        RISK_LEVELS.FLAG_ONLY,
        RISK_LEVELS.ALERT_MENTOR,
        RISK_LEVELS.BLOCK,
      ]) {
        const behavior = getRiskLevelBehavior(level);
        const response = behavior.neutralResponse ?? "";

        expect(response).not.toContain("988");
        expect(response).not.toContain("Crisis Text Line");
        expect(response).not.toContain("1-800");
        expect(response).not.toContain("hotline");
      }
    });
  });
});
