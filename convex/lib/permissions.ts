import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type Role = "admin" | "mentor" | "student";

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
export function hasRole(memberRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    admin: 3,
    mentor: 2,
    student: 1,
  };

  return roleHierarchy[memberRole] >= roleHierarchy[requiredRole];
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

  if (!hasRole(membership.role as Role, requiredRole)) {
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
