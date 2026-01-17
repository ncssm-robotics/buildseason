import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { discordWebhook } from "./discord/handler";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Discord webhook endpoint
http.route({
  path: "/discord/webhook",
  method: "POST",
  handler: discordWebhook,
});

export default http;
