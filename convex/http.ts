import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { discordWebhook } from "./discord/handler";
import { initiateLink, handleLinkCallback } from "./discord/linkAccount";

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

export default http;
