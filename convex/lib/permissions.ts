import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// New role structure for YPP compliance
export type Role = "lead_mentor" | "mentor" | "student";

// For backwards compatibility, map admin -> lead_mentor
export function normalizeRole(role: string): Role {
  if (role === "admin") return "lead_mentor";
  if (role === "lead_mentor" || role === "mentor" || role === "student") {
    return role;
  }
  return "student"; // Default to lowest privilege
}

/**
 * Get the current authenticated user or throw
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get user's membership in a team
 */
export async function getTeamMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  teamId: Id<"teams">
) {
  return await ctx.db
    .query("teamMembers")
    .withIndex("by_user_team", (q) =>
      q.eq("userId", userId).eq("teamId", teamId)
    )
    .unique();
}

/**
 * Check if user has a specific role (or higher) in a team
 */
export function hasRole(memberRole: string, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    lead_mentor: 3,
    mentor: 2,
    student: 1,
  };

  const normalizedRole = normalizeRole(memberRole);
  return roleHierarchy[normalizedRole] >= roleHierarchy[requiredRole];
}

/**
 * Require user to be a member of a team
 */
export async function requireTeamMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
) {
  const user = await requireAuth(ctx);
  const membership = await getTeamMembership(ctx, user._id, teamId);

  if (!membership) {
    throw new Error("Not a member of this team");
  }

  return { user, membership };
}

/**
 * Require user to have a specific role in a team
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  requiredRole: Role
) {
  const { user, membership } = await requireTeamMember(ctx, teamId);

  if (!hasRole(membership.role, requiredRole)) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }

  return { user, membership };
}

/**
 * Check if user can approve orders (admin or mentor)
 */
export async function canApproveOrders(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
): Promise<boolean> {
  try {
    await requireRole(ctx, teamId, "mentor");
    return true;
  } catch {
    return false;
  }
}
