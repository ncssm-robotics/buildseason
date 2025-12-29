import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/bun";
import { Layout } from "./components/Layout";
import { auth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/auth";
import authRoutes from "./routes/auth";
import teamRoutes from "./routes/teams";
import partsRoutes from "./routes/parts";
import ordersRoutes from "./routes/orders";
import vendorsRoutes from "./routes/vendors";

const app = new Hono();

// Static files
app.use("/public/*", serveStatic({ root: "./src" }));

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

// Home page (public) - defined before protected route modules
app.get("/", (c) => {
  return c.html(
    <Layout title="BuildSeason">
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto py-16 px-4">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            Welcome to BuildSeason
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Team management for FTC robotics teams. Track parts, manage orders,
            and build better robots.
          </p>
          <a
            href="/login"
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </a>
        </div>
      </div>
    </Layout>
  );
});

// Mount route modules (auth routes have their own public pages)
app.route("/", authRoutes);
app.route("/", teamRoutes);
app.route("/", partsRoutes);
app.route("/", ordersRoutes);
app.route("/", vendorsRoutes);

const port = process.env.PORT || 3000;
console.log(`🚀 BuildSeason running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
