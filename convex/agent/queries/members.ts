import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * List team members with their roles.
 */
export const list = internalQuery({
  args: {
    teamId: v.id("teams"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let members;

    if (args.role) {
      members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_role", (q) =>
          q.eq("teamId", args.teamId).eq("role", args.role!)
        )
        .collect();
    } else {
      members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
    }

    // Get user info for each member
    const result = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          id: member._id,
          name: user?.name || "Unknown",
          role: member.role,
          hasDietaryNeeds: !!(
            member.dietaryNeeds && member.dietaryNeeds.length > 0
          ),
          hasObservances: !!(
            member.observances && member.observances.length > 0
          ),
        };
      })
    );

    return {
      count: result.length,
      members: result,
    };
  },
});

/**
 * Get detailed info for a specific team member by ID.
 */
export const get = internalQuery({
  args: {
    teamId: v.id("teams"),
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);

    if (!member || member.teamId !== args.teamId) {
      return { error: "Member not found" };
    }

    const user = await ctx.db.get(member.userId);

    return {
      id: member._id,
      name: user?.name || "Unknown",
      role: member.role,
      dietaryNeeds: member.dietaryNeeds || [],
      observances: member.observances || [],
      notes: member.anythingElse,
    };
  },
});

/**
 * Get detailed info for a team member by name search.
 */
export const getByName = internalQuery({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const searchLower = args.name.toLowerCase();

    // Find matching member by name
    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      if (user?.name?.toLowerCase().includes(searchLower)) {
        return {
          id: member._id,
          name: user.name,
          role: member.role,
          dietaryNeeds: member.dietaryNeeds || [],
          observances: member.observances || [],
          notes: member.anythingElse,
        };
      }
    }

    return { error: `No member found matching "${args.name}"` };
  },
});

/**
 * Get a summary of dietary restrictions for a list of members.
 */
export const dietarySummary = internalQuery({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    let members;

    if (args.memberIds.length === 0) {
      // Get all team members
      members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
    } else {
      // Get specific members
      members = await Promise.all(args.memberIds.map((id) => ctx.db.get(id)));
      members = members.filter(
        (m): m is NonNullable<typeof m> =>
          m !== null && m.teamId === args.teamId
      );
    }

    // Aggregate dietary needs and observances
    const dietaryMap: Record<string, string[]> = {};
    const observanceMap: Record<string, string[]> = {};
    const membersWithNeeds: string[] = [];

    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      const name = user?.name || "Unknown";

      if (member.dietaryNeeds && member.dietaryNeeds.length > 0) {
        membersWithNeeds.push(name);
        for (const need of member.dietaryNeeds) {
          if (!dietaryMap[need]) dietaryMap[need] = [];
          dietaryMap[need].push(name);
        }
      }

      if (member.observances && member.observances.length > 0) {
        for (const obs of member.observances) {
          if (!observanceMap[obs]) observanceMap[obs] = [];
          observanceMap[obs].push(name);
        }
      }
    }

    return {
      totalMembers: members.length,
      membersWithDietaryNeeds: membersWithNeeds.length,
      dietaryRestrictions: Object.entries(dietaryMap).map(
        ([restriction, names]) => ({
          restriction,
          count: names.length,
          members: names,
        })
      ),
      observances: Object.entries(observanceMap).map(([observance, names]) => ({
        observance,
        count: names.length,
        members: names,
      })),
      summary:
        membersWithNeeds.length > 0
          ? `${membersWithNeeds.length} of ${members.length} members have dietary needs to consider.`
          : "No special dietary needs recorded for this group.",
    };
  },
});
