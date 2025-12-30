import { createAuthClient } from "better-auth/client";

// Client-side auth utilities for forms
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
