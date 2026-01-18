import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { discordWebhook } from "./discord/handler";
import { initiateLink, handleLinkCallback } from "./discord/linkAccount";
import { inboundWebhook } from "./email/inbound";
import { resend } from "./email/send";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Discord webhook endpoint
http.route({
  path: "/discord/webhook",
  method: "POST",
  handler: discordWebhook,
});

// Discord account linking (secure OAuth-based)
http.route({
  path: "/discord/link",
  method: "GET",
  handler: initiateLink,
});

http.route({
  path: "/discord/link/callback",
  method: "GET",
  handler: handleLinkCallback,
});

// Email - inbound webhook (receives emails sent to *@buildseason.org)
http.route({
  path: "/email/inbound",
  method: "POST",
  handler: inboundWebhook,
});

// Email - Resend delivery status webhook (tracks sent email status)
http.route({
  path: "/email/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
