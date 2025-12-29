import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/bun";
import { auth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/auth";
import apiRoutes from "./routes/api";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const app = new Hono();

// Check if we have a built frontend
const frontendDistPath = join(process.cwd(), "dist/frontend");
const hasFrontendBuild = existsSync(join(frontendDistPath, "index.html"));

// Static files - serve built frontend assets in production
if (hasFrontendBuild) {
  app.use("/assets/*", serveStatic({ root: "./dist/frontend" }));
}

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());

// Better-Auth API routes - must be before session middleware
// IMPORTANT: Hono's wildcard (*) only matches a SINGLE path segment.
// Better-Auth uses nested paths like /api/auth/callback/github (3 segments after /api/auth/)
// We need separate patterns for each depth level:
//   /api/auth/*       -> /api/auth/session, /api/auth/csrf
//   /api/auth/*/*     -> /api/auth/sign-in/email, /api/auth/sign-in/social
//   /api/auth/*/*/*   -> /api/auth/callback/github, /api/auth/callback/google
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.on(["POST", "GET"], "/api/auth/*/*", (c) => auth.handler(c.req.raw));
app.on(["POST", "GET"], "/api/auth/*/*/*", (c) => auth.handler(c.req.raw));

// Session middleware for all other routes
app.use("*", sessionMiddleware);

// Health check (public)
app.get("/health", (c) => c.json({ status: "ok" }));

// JSON API routes for React frontend
app.route("/", apiRoutes);

// Serve React frontend for all non-API routes (SPA client-side routing)
if (hasFrontendBuild) {
  const indexHtml = readFileSync(join(frontendDistPath, "index.html"), "utf-8");

  // Catch-all route - serve index.html for client-side routing
  app.get("*", (c) => {
    // Don't serve index.html for API routes
    if (c.req.path.startsWith("/api/")) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.html(indexHtml);
  });
} else {
  // Development mode - show helpful message
  app.get("*", (c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BuildSeason - Development</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
            pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>BuildSeason</h1>
          <p>The React frontend is not built. To run in development:</p>
          <ol>
            <li>Start the backend: <code>bun run dev</code></li>
            <li>In another terminal, start the frontend: <code>cd frontend && bun run dev</code></li>
            <li>Open <a href="http://localhost:5173">http://localhost:5173</a></li>
          </ol>
          <p>To build for production:</p>
          <pre>cd frontend && bun run build</pre>
          <p>Then restart this server and visit <a href="http://localhost:3000">http://localhost:3000</a>.</p>
        </body>
      </html>
    `);
  });
}

const port = process.env.PORT || 3000;
console.log(`🚀 BuildSeason running at http://localhost:${port}`);
if (hasFrontendBuild) {
  console.log("📦 Serving production React frontend");
} else {
  console.log("🔧 Development mode - run frontend separately");
}

export default {
  port,
  fetch: app.fetch,
};
