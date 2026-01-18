import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeamMember, requireRole, requireAuth } from "./lib/permissions";

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
    // Mentors can update member roles
    await requireRole(ctx, teamId, "mentor");

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
    // Mentors can remove members
    await requireRole(ctx, teamId, "mentor");

    const membership = await ctx.db.get(memberId);
    if (!membership || membership.teamId !== teamId) {
      throw new Error("Member not found");
    }

    // Check we're not removing the last lead mentor
    const leadMentors = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .filter((q) =>
        q.or(
          q.eq(q.field("role"), "lead_mentor"),
          q.eq(q.field("role"), "admin") // backwards compat
        )
      )
      .collect();

    if (leadMentors.length === 1 && leadMentors[0]._id === memberId) {
      throw new Error("Cannot remove the last lead mentor");
    }

    await ctx.db.delete(memberId);
    return memberId;
  },
});

// Get current user's membership for a team
export const getMyMembership = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const user = await requireAuth(ctx);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", user._id).eq("teamId", teamId)
      )
      .unique();

    return membership;
  },
});

// User updates their own profile (personal context fields)
export const updateMyProfile = mutation({
  args: {
    teamId: v.id("teams"),
    dietaryNeeds: v.optional(v.array(v.string())),
    observances: v.optional(v.array(v.string())),
    anythingElse: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, ...updates }) => {
    const user = await requireAuth(ctx);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", user._id).eq("teamId", teamId)
      )
      .unique();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(membership._id, filteredUpdates);
    return membership._id;
  },
});

// Mentors can update a member's profile (including birthdate for YPP)
export const updateMemberProfile = mutation({
  args: {
    teamId: v.id("teams"),
    memberId: v.id("teamMembers"),
    birthdate: v.optional(v.number()),
    dietaryNeeds: v.optional(v.array(v.string())),
    observances: v.optional(v.array(v.string())),
    anythingElse: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, memberId, ...updates }) => {
    // Mentors can update member profiles
    await requireRole(ctx, teamId, "mentor");

    const membership = await ctx.db.get(memberId);
    if (!membership || membership.teamId !== teamId) {
      throw new Error("Member not found");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(memberId, filteredUpdates);
    return memberId;
  },
});
