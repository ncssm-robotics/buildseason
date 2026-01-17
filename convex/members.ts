import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    // Fetch user details for each membership
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          _id: membership._id,
          userId: user._id,
          role: membership.role,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      })
    );

    return members.filter((m) => m !== null);
  },
});

export const updateRole = mutation({
  args: {
    teamId: v.id("teams"),
    memberId: v.id("teamMembers"),
    role: v.string(),
  },
  handler: async (ctx, { teamId, memberId, role }) => {
    await requireRole(ctx, teamId, "admin");

    const membership = await ctx.db.get(memberId);
    if (!membership || membership.teamId !== teamId) {
      throw new Error("Member not found");
    }

    await ctx.db.patch(memberId, { role });
    return memberId;
  },
});

export const remove = mutation({
  args: {
    teamId: v.id("teams"),
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, { teamId, memberId }) => {
    await requireRole(ctx, teamId, "admin");

    const membership = await ctx.db.get(memberId);
    if (!membership || membership.teamId !== teamId) {
      throw new Error("Member not found");
    }

    // Check we're not removing the last admin
    const admins = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    if (admins.length === 1 && admins[0]._id === memberId) {
      throw new Error("Cannot remove the last admin");
    }

    await ctx.db.delete(memberId);
    return memberId;
  },
});
