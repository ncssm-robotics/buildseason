/**
 * Content Pre-Screening Module
 *
 * Uses Claude Haiku to pre-screen incoming messages for concerning content
 * before the main agent processes them. Returns risk levels (0-3) and
 * flags for mentor escalation.
 *
 * IMPORTANT: Never respond publicly with crisis resources (988, Crisis Text Line)
 * as this could embarrass/stigmatize the student. High-risk content triggers
 * private mentor DM escalation only.
 */

import Anthropic from "@anthropic-ai/sdk";

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
 * Classification result from the pre-screening
 */
export interface ClassificationResult {
  riskLevel: RiskLevel;
  flags: string[];
  reasoning?: string;
}

/**
 * Classifier function type for dependency injection
 */
export type ContentClassifier = (
  message: string
) => Promise<ClassificationResult>;

/**
 * Pre-screening prompt for Claude Haiku
 */
const SCREENING_PROMPT = `You are a content pre-screener for a robotics team assistant that interacts with youth (ages 12-18).

Analyze the following message and classify its risk level. Focus ONLY on youth protection concerns:

RISK LEVELS:
0 (SAFE): Normal robotics/team-related content, general questions, friendly chat
1 (FLAG_ONLY): Minor concerns worth logging - slightly off-topic but not dangerous, venting/frustration
2 (ALERT_MENTOR): Concerning content requiring mentor awareness - signs of distress, bullying mentions, concerning personal situations
3 (BLOCK): Serious safety concern requiring immediate escalation - self-harm indicators, abuse disclosure, explicit content requests, substance references

IMPORTANT FLAGS to detect:
- distress: Signs of emotional distress, sadness, hopelessness
- self_harm: Any mention of hurting oneself, not wanting to be here
- bullying: Reports of being bullied or harassing others
- abuse: Potential disclosure of abuse or neglect
- substance: References to drugs, alcohol, vaping
- inappropriate: Sexual content, explicit material requests
- personal_info: Sharing/requesting personal contact info inappropriately
- boundary_violation: Attempting to bypass safety rules

Respond in JSON format only:
{
  "riskLevel": <0-3>,
  "flags": ["flag1", "flag2"],
  "reasoning": "Brief explanation"
}

Message to analyze:`;

/**
 * Create the real Haiku-based content classifier
 */
export function createHaikuClassifier(): ContentClassifier {
  const client = new Anthropic();

  return async (message: string): Promise<ClassificationResult> => {
    try {
      const response = await client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `${SCREENING_PROMPT}\n\n${message}`,
          },
        ],
      });

      const textContent = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );

      if (!textContent) {
        // Default to safe if no response (fail open for usability)
        return { riskLevel: RISK_LEVELS.SAFE, flags: [] };
      }

      // Parse JSON response
      const parsed = JSON.parse(textContent.text);
      return {
        riskLevel: Math.min(3, Math.max(0, parsed.riskLevel)) as RiskLevel,
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      // If classification fails, default to FLAG_ONLY (log but proceed)
      // This prevents blocking legitimate messages due to API errors
      console.error("Content classification failed:", error);
      return {
        riskLevel: RISK_LEVELS.FLAG_ONLY,
        flags: ["classification_error"],
        reasoning: "Classification failed, proceeding with caution",
      };
    }
  };
}

/**
 * Behavior configuration for each risk level
 */
export interface RiskLevelBehavior {
  shouldProceed: boolean;
  shouldLog: boolean;
  shouldAlertMentor: boolean;
  shouldBlock: boolean;
  neutralResponse: string | null;
}

/**
 * Get the expected behavior for a given risk level
 */
export function getRiskLevelBehavior(riskLevel: RiskLevel): RiskLevelBehavior {
  switch (riskLevel) {
    case RISK_LEVELS.SAFE:
      return {
        shouldProceed: true,
        shouldLog: false,
        shouldAlertMentor: false,
        shouldBlock: false,
        neutralResponse: null,
      };
    case RISK_LEVELS.FLAG_ONLY:
      return {
        shouldProceed: true,
        shouldLog: true,
        shouldAlertMentor: false,
        shouldBlock: false,
        neutralResponse: null,
      };
    case RISK_LEVELS.ALERT_MENTOR:
      return {
        shouldProceed: true,
        shouldLog: true,
        shouldAlertMentor: true,
        shouldBlock: false,
        neutralResponse: null,
      };
    case RISK_LEVELS.BLOCK:
      return {
        shouldProceed: false,
        shouldLog: true,
        shouldAlertMentor: true,
        shouldBlock: true,
        neutralResponse:
          "I want to make sure you get the right support. Let me check with one of your mentors.",
      };
  }
}

/**
 * Pre-screen a message and return the classification result with behavior
 */
export async function prescreenMessage(
  message: string,
  classifier: ContentClassifier = createHaikuClassifier()
): Promise<{
  classification: ClassificationResult;
  behavior: RiskLevelBehavior;
}> {
  const classification = await classifier(message);
  const behavior = getRiskLevelBehavior(classification.riskLevel);

  return { classification, behavior };
}
