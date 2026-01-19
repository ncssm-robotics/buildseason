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
import type * as agent_auditLog from "../agent/auditLog.js";
import type * as agent_context from "../agent/context.js";
import type * as agent_conversation from "../agent/conversation.js";
import type * as agent_handler from "../agent/handler.js";
import type * as agent_moderation from "../agent/moderation.js";
import type * as agent_mutations_parts from "../agent/mutations/parts.js";
import type * as agent_mutations_safety from "../agent/mutations/safety.js";
import type * as agent_prompts_index from "../agent/prompts/index.js";
import type * as agent_prompts_systemPrompt from "../agent/prompts/systemPrompt.js";
import type * as agent_prompts_yppGuardrails from "../agent/prompts/yppGuardrails.js";
import type * as agent_queries_bom from "../agent/queries/bom.js";
import type * as agent_queries_discord from "../agent/queries/discord.js";
import type * as agent_queries_events from "../agent/queries/events.js";
import type * as agent_queries_members from "../agent/queries/members.js";
import type * as agent_queries_orders from "../agent/queries/orders.js";
import type * as agent_queries_parts from "../agent/queries/parts.js";
import type * as agent_tools_bom from "../agent/tools/bom.js";
import type * as agent_tools_discord from "../agent/tools/discord.js";
import type * as agent_tools_events from "../agent/tools/events.js";
import type * as agent_tools_index from "../agent/tools/index.js";
import type * as agent_tools_members from "../agent/tools/members.js";
import type * as agent_tools_orders from "../agent/tools/orders.js";
import type * as agent_tools_parts from "../agent/tools/parts.js";
import type * as agent_tools_safety from "../agent/tools/safety.js";
import type * as agent_tools_search from "../agent/tools/search.js";
import type * as agentAuditLogs from "../agentAuditLogs.js";
import type * as auth from "../auth.js";
import type * as birthdays from "../birthdays.js";
import type * as bom from "../bom.js";
import type * as crons from "../crons.js";
import type * as discord_handler from "../discord/handler.js";
import type * as discord_linkAccount from "../discord/linkAccount.js";
import type * as discord_links from "../discord/links.js";
import type * as discord_mutations from "../discord/mutations.js";
import type * as discord_queries from "../discord/queries.js";
import type * as discord_respond from "../discord/respond.js";
import type * as email_debug from "../email/debug.js";
import type * as email_inbound from "../email/inbound.js";
import type * as email_send from "../email/send.js";
import type * as email_vendors_andymark from "../email/vendors/andymark.js";
import type * as email_vendors_carriers from "../email/vendors/carriers.js";
import type * as email_vendors_forwarded from "../email/vendors/forwarded.js";
import type * as email_vendors_gobilda from "../email/vendors/gobilda.js";
import type * as email_vendors_index from "../email/vendors/index.js";
import type * as email_vendors_rev from "../email/vendors/rev.js";
import type * as email_vendors_types from "../email/vendors/types.js";
import type * as email_vendors_utils from "../email/vendors/utils.js";
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
import type * as safetyAlerts from "../safetyAlerts.js";
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
  "agent/auditLog": typeof agent_auditLog;
  "agent/context": typeof agent_context;
  "agent/conversation": typeof agent_conversation;
  "agent/handler": typeof agent_handler;
  "agent/moderation": typeof agent_moderation;
  "agent/mutations/parts": typeof agent_mutations_parts;
  "agent/mutations/safety": typeof agent_mutations_safety;
  "agent/prompts/index": typeof agent_prompts_index;
  "agent/prompts/systemPrompt": typeof agent_prompts_systemPrompt;
  "agent/prompts/yppGuardrails": typeof agent_prompts_yppGuardrails;
  "agent/queries/bom": typeof agent_queries_bom;
  "agent/queries/discord": typeof agent_queries_discord;
  "agent/queries/events": typeof agent_queries_events;
  "agent/queries/members": typeof agent_queries_members;
  "agent/queries/orders": typeof agent_queries_orders;
  "agent/queries/parts": typeof agent_queries_parts;
  "agent/tools/bom": typeof agent_tools_bom;
  "agent/tools/discord": typeof agent_tools_discord;
  "agent/tools/events": typeof agent_tools_events;
  "agent/tools/index": typeof agent_tools_index;
  "agent/tools/members": typeof agent_tools_members;
  "agent/tools/orders": typeof agent_tools_orders;
  "agent/tools/parts": typeof agent_tools_parts;
  "agent/tools/safety": typeof agent_tools_safety;
  "agent/tools/search": typeof agent_tools_search;
  agentAuditLogs: typeof agentAuditLogs;
  auth: typeof auth;
  birthdays: typeof birthdays;
  bom: typeof bom;
  crons: typeof crons;
  "discord/handler": typeof discord_handler;
  "discord/linkAccount": typeof discord_linkAccount;
  "discord/links": typeof discord_links;
  "discord/mutations": typeof discord_mutations;
  "discord/queries": typeof discord_queries;
  "discord/respond": typeof discord_respond;
  "email/debug": typeof email_debug;
  "email/inbound": typeof email_inbound;
  "email/send": typeof email_send;
  "email/vendors/andymark": typeof email_vendors_andymark;
  "email/vendors/carriers": typeof email_vendors_carriers;
  "email/vendors/forwarded": typeof email_vendors_forwarded;
  "email/vendors/gobilda": typeof email_vendors_gobilda;
  "email/vendors/index": typeof email_vendors_index;
  "email/vendors/rev": typeof email_vendors_rev;
  "email/vendors/types": typeof email_vendors_types;
  "email/vendors/utils": typeof email_vendors_utils;
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
  safetyAlerts: typeof safetyAlerts;
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

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: Array<string> | string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bcc?: Array<string>;
          bounced?: boolean;
          cc?: Array<string>;
          clicked?: boolean;
          complained: boolean;
          createdAt: number;
          deliveryDelayed?: boolean;
          errorMessage?: string;
          failed?: boolean;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bounced: boolean;
          clicked: boolean;
          complained: boolean;
          deliveryDelayed: boolean;
          errorMessage: string | null;
          failed: boolean;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          bcc?: Array<string>;
          cc?: Array<string>;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
