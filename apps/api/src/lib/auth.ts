import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:5173", // Vite dev server
    "http://localhost:3000", // API server (production serves frontend)
  ],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 1 week
    updateAge: 60 * 60 * 24, // Update session every day
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true, // Prevent JavaScript access to cookies
      sameSite: "lax", // CSRF protection while allowing top-level navigation
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
    },
  },
});

export type Auth = typeof auth;
