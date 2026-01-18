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
    // Lead mentors can update team settings
    await requireRole(ctx, teamId, "lead_mentor");

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(teamId, filteredUpdates);
    return teamId;
  },
});

/**
 * Add a user as a YPP contact for a team.
 * Only lead mentors can manage YPP contacts.
 * The user must be an adult mentor on the team.
 */
export const addYppContact = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, { teamId, userId }) => {
    await requireRole(ctx, teamId, "lead_mentor");

    const team = await ctx.db.get(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is already a YPP contact
    if (team.yppContacts?.includes(userId)) {
      return teamId; // Already a contact, no-op
    }

    // Validate the user is an adult mentor
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user_team", (q) =>
        q.eq("userId", userId).eq("teamId", teamId)
      )
      .unique();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    if (membership.role === "student") {
      throw new Error("Students cannot be YPP contacts");
    }

    if (membership.birthdate && !isAdult(membership.birthdate)) {
      throw new Error("YPP contacts must be 18 or older");
    }

    // Add to yppContacts
    const currentContacts = team.yppContacts ?? [];
    await ctx.db.patch(teamId, {
      yppContacts: [...currentContacts, userId],
    });

    return teamId;
  },
});

/**
 * Remove a user from YPP contacts for a team.
 * Only lead mentors can manage YPP contacts.
 * Cannot remove the last YPP contact.
 */
export const removeYppContact = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, { teamId, userId }) => {
    await requireRole(ctx, teamId, "lead_mentor");

    const team = await ctx.db.get(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const currentContacts = team.yppContacts ?? [];

    // Check if user is a YPP contact
    if (!currentContacts.includes(userId)) {
      return teamId; // Not a contact, no-op
    }

    // Cannot remove the last YPP contact
    if (currentContacts.length === 1) {
      throw new Error("Cannot remove the last YPP contact");
    }

    // Remove from yppContacts
    await ctx.db.patch(teamId, {
      yppContacts: currentContacts.filter((id) => id !== userId),
    });

    return teamId;
  },
});
