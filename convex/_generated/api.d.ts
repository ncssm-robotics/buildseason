/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_cleanup from "../admin/cleanup.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_setup from "../admin/setup.js";
import type * as agent___tests___ypp_test_utils from "../agent/__tests__/ypp_test_utils.js";
import type * as agent_context from "../agent/context.js";
import type * as agent_handler from "../agent/handler.js";
import type * as agent_mutations_parts from "../agent/mutations/parts.js";
import type * as agent_prompts_index from "../agent/prompts/index.js";
import type * as agent_prompts_systemPrompt from "../agent/prompts/systemPrompt.js";
import type * as agent_prompts_yppGuardrails from "../agent/prompts/yppGuardrails.js";
import type * as agent_queries_bom from "../agent/queries/bom.js";
import type * as agent_queries_orders from "../agent/queries/orders.js";
import type * as agent_queries_parts from "../agent/queries/parts.js";
import type * as agent_tools_bom from "../agent/tools/bom.js";
import type * as agent_tools_index from "../agent/tools/index.js";
import type * as agent_tools_orders from "../agent/tools/orders.js";
import type * as agent_tools_parts from "../agent/tools/parts.js";
import type * as auth from "../auth.js";
import type * as bom from "../bom.js";
import type * as discord_handler from "../discord/handler.js";
import type * as discord_linkAccount from "../discord/linkAccount.js";
import type * as discord_links from "../discord/links.js";
import type * as discord_mutations from "../discord/mutations.js";
import type * as discord_queries from "../discord/queries.js";
import type * as discord_respond from "../discord/respond.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_providers from "../lib/providers.js";
import type * as lib_ypp from "../lib/ypp.js";
import type * as members from "../members.js";
import type * as orders from "../orders.js";
import type * as parts from "../parts.js";
import type * as providers from "../providers.js";
import type * as providers_actions from "../providers/actions.js";
import type * as seasons from "../seasons.js";
import type * as teams from "../teams.js";
import type * as teams_yppContacts from "../teams/yppContacts.js";
import type * as users from "../users.js";
import type * as vendors from "../vendors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/cleanup": typeof admin_cleanup;
  "admin/queries": typeof admin_queries;
  "admin/setup": typeof admin_setup;
  "agent/__tests__/ypp_test_utils": typeof agent___tests___ypp_test_utils;
  "agent/context": typeof agent_context;
  "agent/handler": typeof agent_handler;
  "agent/mutations/parts": typeof agent_mutations_parts;
  "agent/prompts/index": typeof agent_prompts_index;
  "agent/prompts/systemPrompt": typeof agent_prompts_systemPrompt;
  "agent/prompts/yppGuardrails": typeof agent_prompts_yppGuardrails;
  "agent/queries/bom": typeof agent_queries_bom;
  "agent/queries/orders": typeof agent_queries_orders;
  "agent/queries/parts": typeof agent_queries_parts;
  "agent/tools/bom": typeof agent_tools_bom;
  "agent/tools/index": typeof agent_tools_index;
  "agent/tools/orders": typeof agent_tools_orders;
  "agent/tools/parts": typeof agent_tools_parts;
  auth: typeof auth;
  bom: typeof bom;
  "discord/handler": typeof discord_handler;
  "discord/linkAccount": typeof discord_linkAccount;
  "discord/links": typeof discord_links;
  "discord/mutations": typeof discord_mutations;
  "discord/queries": typeof discord_queries;
  "discord/respond": typeof discord_respond;
  http: typeof http;
  invites: typeof invites;
  "lib/crypto": typeof lib_crypto;
  "lib/permissions": typeof lib_permissions;
  "lib/providers": typeof lib_providers;
  "lib/ypp": typeof lib_ypp;
  members: typeof members;
  orders: typeof orders;
  parts: typeof parts;
  providers: typeof providers;
  "providers/actions": typeof providers_actions;
  seasons: typeof seasons;
  teams: typeof teams;
  "teams/yppContacts": typeof teams_yppContacts;
  users: typeof users;
  vendors: typeof vendors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
