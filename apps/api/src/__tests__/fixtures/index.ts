/**
 * Test fixtures and utilities for BuildSeason tests.
 * This file re-exports all test helpers for convenient importing.
 *
 * Usage:
 * ```ts
 * import { setupTestDb, createUserInDb, testGet } from './__tests__/fixtures';
 * ```
 */

// Database utilities
export { createTestDb, setupTestDb, cleanupTestDb } from "./db";

// Factory functions
export {
  createUser,
  createUserInDb,
  createTeam,
  createTeamInDb,
  createTeamMember,
  createTeamMemberInDb,
  createVendor,
  createVendorInDb,
  createPart,
  createPartInDb,
  createBomItem,
  createBomItemInDb,
  createOrder,
  createOrderInDb,
  createOrderItem,
  createOrderItemInDb,
  createSession,
  createSessionInDb,
  createUserWithTeam,
} from "./factories";

// Factory types
export type {
  CreateUserOptions,
  CreateTeamOptions,
  CreateTeamMemberOptions,
  CreateVendorOptions,
  CreatePartOptions,
  CreateBomItemOptions,
  CreateOrderOptions,
  CreateOrderItemOptions,
  CreateSessionOptions,
} from "./factories";

// Request helpers
export {
  testRequest,
  testGet,
  testPost,
  testPut,
  testPatch,
  testDelete,
  testAuthRequest,
  testFormRequest,
  parseJsonResponse,
  parseTextResponse,
  createTestApp,
  assertResponseSuccess,
  assertResponseStatus,
  createFormData,
} from "./request";

// Request types
export type { TestRequestOptions } from "./request";
