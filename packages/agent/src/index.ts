/**
 * BuildSeason Agent Package
 *
 * Core agent functionality including personality system,
 * tool definitions, and agent configuration.
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
