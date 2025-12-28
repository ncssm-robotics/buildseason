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

const app = new Hono();

// Static files
app.use("/public/*", serveStatic({ root: "./src" }));

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", sessionMiddleware);

// Better-Auth API routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// Mount route modules
app.route("/", authRoutes);
app.route("/", teamRoutes);
app.route("/", partsRoutes);
app.route("/", ordersRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Home page
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
          <div class="flex gap-4">
            <a
              href="/login"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </a>
            <a
              href="/register"
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});

const port = process.env.PORT || 3000;
console.log(`🚀 BuildSeason running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
