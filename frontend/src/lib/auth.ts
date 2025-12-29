import { createAuthClient } from "better-auth/react";

// Create the auth client pointing to our API
export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

// Export hooks and methods for easy access
export const { useSession, signIn, signUp, signOut } = authClient;

// Types for session
export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];
