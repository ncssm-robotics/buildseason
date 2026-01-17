import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRole } from "./lib/permissions";

// Generate a random invite token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireRole(ctx, teamId, "admin");

    const invites = await ctx.db
      .query("teamInvites")
      .filter((q) => q.eq(q.field("teamId"), teamId))
      .collect();

    // Filter out expired invites
    const now = Date.now();
    return invites.filter((invite) => invite.expiresAt > now);
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    role: v.string(),
  },
  handler: async (ctx, { teamId, role }) => {
    const { user } = await requireRole(ctx, teamId, "admin");

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const inviteId = await ctx.db.insert("teamInvites", {
      teamId,
      token,
      role,
      expiresAt,
      createdBy: user._id,
    });

    return { inviteId, token };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invite) {
      return null;
    }

    if (invite.expiresAt < Date.now()) {
      return null;
    }

    // Get the team details
    const team = await ctx.db.get(invite.teamId);

    return {
      ...invite,
      team,
    };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireAuth(ctx);

    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invite) {
      throw new Error("Invalid invite");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", user._id).eq("teamId", invite.teamId)
      )
      .unique();

    if (existingMembership) {
      throw new Error("Already a member of this team");
    }

    // Add as team member
    await ctx.db.insert("teamMembers", {
      userId: user._id,
      teamId: invite.teamId,
      role: invite.role,
    });

    // Delete the invite
    await ctx.db.delete(invite._id);

    return invite.teamId;
  },
});

export const revoke = mutation({
  args: { inviteId: v.id("teamInvites") },
  handler: async (ctx, { inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    await requireRole(ctx, invite.teamId, "admin");
    await ctx.db.delete(inviteId);

    return inviteId;
  },
});
