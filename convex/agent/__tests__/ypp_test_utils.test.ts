import { describe, it, expect } from "vitest";
import {
  createMockClassifier,
  RISK_LEVELS,
  createMockDiscordClient,
  expectRiskLevelBehavior,
  createMockTokenStore,
  createYPPTestFixture,
} from "./ypp_test_utils";

describe("YPP Test Utilities", () => {
  describe("createMockClassifier", () => {
    it("returns configured responses for known messages", async () => {
      const classifier = createMockClassifier(
        new Map([
          ["help me", { riskLevel: 0, flags: [] }],
          ["concerning message", { riskLevel: 2, flags: ["distress"] }],
        ])
      );

      expect(await classifier("help me")).toEqual({ riskLevel: 0, flags: [] });
      expect(await classifier("concerning message")).toEqual({
        riskLevel: 2,
        flags: ["distress"],
      });
    });

    it("defaults to safe for unknown messages", async () => {
      const classifier = createMockClassifier(new Map());
      expect(await classifier("random")).toEqual({ riskLevel: 0, flags: [] });
    });
  });

  describe("expectRiskLevelBehavior", () => {
    it("level 0 proceeds without alerts", () => {
      const behavior = expectRiskLevelBehavior(RISK_LEVELS.SAFE);
      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(false);
      expect(behavior.shouldAlertMentor).toBe(false);
      expect(behavior.shouldBlock).toBe(false);
    });

    it("level 1 logs but proceeds", () => {
      const behavior = expectRiskLevelBehavior(RISK_LEVELS.FLAG_ONLY);
      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(false);
      expect(behavior.shouldBlock).toBe(false);
    });

    it("level 2 alerts mentors but proceeds", () => {
      const behavior = expectRiskLevelBehavior(RISK_LEVELS.ALERT_MENTOR);
      expect(behavior.shouldProceed).toBe(true);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(true);
      expect(behavior.shouldBlock).toBe(false);
    });

    it("level 3 blocks and escalates", () => {
      const behavior = expectRiskLevelBehavior(RISK_LEVELS.BLOCK);
      expect(behavior.shouldProceed).toBe(false);
      expect(behavior.shouldLog).toBe(true);
      expect(behavior.shouldAlertMentor).toBe(true);
      expect(behavior.shouldBlock).toBe(true);
      expect(behavior.shouldShowNeutralResponse).toBe(true);
    });
  });

  describe("createMockDiscordClient", () => {
    it("captures sent DMs", async () => {
      const discord = createMockDiscordClient();
      await discord.sendDM("user123", "Hello!");

      const dms = discord.getSentDMs();
      expect(dms).toHaveLength(1);
      expect(dms[0]).toEqual({
        userId: "user123",
        content: "Hello!",
        components: undefined,
      });
    });

    it("clears DMs", async () => {
      const discord = createMockDiscordClient();
      await discord.sendDM("user123", "Hello!");
      discord.clearDMs();

      expect(discord.getSentDMs()).toHaveLength(0);
    });

    it("captures components", async () => {
      const discord = createMockDiscordClient();
      const components = { buttons: ["ack"] };
      await discord.sendDM("user123", "Alert!", components);

      const dms = discord.getSentDMs();
      expect(dms[0].components).toEqual(components);
    });
  });

  describe("createMockTokenStore", () => {
    it("generates and consumes tokens", () => {
      const store = createMockTokenStore();
      const token = store.generate("user123", "alert456");

      const result = store.consume(token);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.discordUserId).toBe("user123");
        expect(result.data.alertId).toBe("alert456");
      }
    });

    it("rejects consumed tokens", () => {
      const store = createMockTokenStore();
      const token = store.generate("user123", "alert456");

      store.consume(token);
      const result = store.consume(token);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("not_found");
      }
    });

    it("rejects expired tokens", () => {
      const store = createMockTokenStore();
      const token = store.generate("user123", "alert456", -1000); // Already expired

      const result = store.consume(token);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("expired");
      }
    });

    it("rejects unknown tokens", () => {
      const store = createMockTokenStore();
      const result = store.consume("unknown-token");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe("not_found");
      }
    });
  });

  describe("createYPPTestFixture", () => {
    it("creates complete fixture", async () => {
      const fixture = createYPPTestFixture(
        new Map([["test message", { riskLevel: 2, flags: ["test"] }]])
      );

      const classResult = await fixture.classifier("test message");
      expect(classResult.riskLevel).toBe(2);

      await fixture.discord.sendDM("mentor", "Alert!");
      expect(fixture.discord.getSentDMs()).toHaveLength(1);

      const token = fixture.tokenStore.generate("user", "alert");
      expect(fixture.tokenStore.consume(token).valid).toBe(true);
    });
  });
});
