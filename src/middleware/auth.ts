import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import { db } from "../db";
import { teamMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { TeamRole } from "../db/schema";

// Session type from Better-Auth
type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// Context variables added by auth middleware
export type AuthVariables = {
  user: NonNullable<Session>["user"] | null;
  session: NonNullable<Session>["session"] | null;
};

export type TeamVariables = {
  teamId: string;
  teamRole: TeamRole;
};

/**
 * Middleware that loads user session (if any) into context
 */
export const sessionMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);

  await next();
});

/**
 * Middleware that requires authentication
 */
export const requireAuth = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.redirect("/login");
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});

/**
 * Middleware that loads team membership for a route with :teamId param
 */
export const teamMiddleware = createMiddleware<{
  Variables: AuthVariables & TeamVariables;
}>(async (c, next) => {
  const user = c.get("user");
  const teamId = c.req.param("teamId");

  if (!user || !teamId) {
    return c.redirect("/login");
  }

  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)),
  });

  if (!membership) {
    return c.redirect("/dashboard?error=not_a_member");
  }

  c.set("teamId", teamId);
  c.set("teamRole", membership.role);

  await next();
});

/**
 * Factory to create role-checking middleware
 */
export const requireRole = (...allowedRoles: TeamRole[]) =>
  createMiddleware<{
    Variables: AuthVariables & TeamVariables;
  }>(async (c, next) => {
    const role = c.get("teamRole");

    if (!allowedRoles.includes(role)) {
      return c.text("Forbidden", 403);
    }

    await next();
  });

// Convenience exports
export const requireMentor = requireRole("admin", "mentor");
export const requireAdmin = requireRole("admin");
