import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireTeamMember, requireRole } from "./lib/permissions";
import { isAdult } from "./lib/ypp";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await requireAuth(ctx);

    // Get all team memberships for this user
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the teams
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        return team ? { ...team, role: membership.role } : null;
      })
    );

    return teams.filter((t) => t !== null);
  },
});

export const get = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);
    return await ctx.db.get(teamId);
  },
});

export const getByProgramAndNumber = query({
  args: { program: v.string(), number: v.string() },
  handler: async (ctx, { program, number }) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_program_number", (q) =>
        q.eq("program", program).eq("number", number)
      )
      .unique();

    if (!team) {
      return null;
    }

    // Check if user is a member
    const user = await requireAuth(ctx);
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", user._id).eq("teamId", team._id)
      )
      .unique();

    if (!membership) {
      return null;
    }

    return { ...team, role: membership.role };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    number: v.string(),
    program: v.string(),
    creatorBirthdate: v.number(), // Unix timestamp - required for YPP compliance
    creatorRole: v.optional(v.string()), // "lead_mentor" | "mentor", defaults to lead_mentor
  },
  handler: async (
    ctx,
    { name, number, program, creatorBirthdate, creatorRole }
  ) => {
    const user = await requireAuth(ctx);

    // Validate creator is an adult (YPP requirement)
    if (!isAdult(creatorBirthdate)) {
      throw new Error("Team creator must be 18 or older");
    }

    // Default to lead_mentor role
    const role = creatorRole === "mentor" ? "mentor" : "lead_mentor";

    // Check if team already exists
    const existing = await ctx.db
      .query("teams")
      .withIndex("by_program_number", (q) =>
        q.eq("program", program).eq("number", number)
      )
      .unique();

    if (existing) {
      throw new Error("A team with this program and number already exists");
    }

    // Add the creator as a team member first (we need their membership for YPP contact)
    // We'll update the team with yppContacts after creating it
    const teamId = await ctx.db.insert("teams", {
      name,
      number,
      program,
      yppContacts: [user._id], // Creator is the initial YPP contact
    });

    // Add the creator as lead mentor with birthdate
    await ctx.db.insert("teamMembers", {
      userId: user._id,
      teamId,
      role,
      birthdate: creatorBirthdate,
    });

    return teamId;
  },
});

export const update = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    activeSeasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, { teamId, ...updates }) => {
    await requireRole(ctx, teamId, "admin");

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(teamId, filteredUpdates);
    return teamId;
  },
});
