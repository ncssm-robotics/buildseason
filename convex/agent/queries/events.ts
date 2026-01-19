import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Format a timestamp to a human-readable date/time.
 */
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * List upcoming events for the team.
 */
export const list = internalQuery({
  args: {
    teamId: v.id("teams"),
    type: v.optional(v.string()),
    daysAhead: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const endTime = now + args.daysAhead * 24 * 60 * 60 * 1000;

    // Get events for the team in the time range
    // Take extra events when filtering by type to ensure we return the requested limit
    const fetchLimit = args.type ? args.limit * 3 : args.limit;
    let events = await ctx.db
      .query("events")
      .withIndex("by_team_date", (q) =>
        q
          .eq("teamId", args.teamId)
          .gte("startTime", now)
          .lte("startTime", endTime)
      )
      .take(fetchLimit);

    // Filter by type if specified, then apply the actual limit
    if (args.type) {
      events = events.filter((e) => e.type === args.type).slice(0, args.limit);
    }

    // Get attendee counts for each event
    // TODO: Consider batching or denormalizing counts for optimization
    const result = await Promise.all(
      events.map(async (event) => {
        const attendees = await ctx.db
          .query("eventAttendees")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("status"), "going"))
          .collect();

        return {
          id: event._id,
          title: event.title,
          type: event.type,
          startTime: formatDateTime(event.startTime),
          location: event.location,
          attendeeCount: attendees.length,
          maxAttendees: event.maxAttendees,
          requiresRSVP: event.requiresRSVP,
        };
      })
    );

    return {
      count: result.length,
      events: result,
    };
  },
});

/**
 * Get detailed information about a specific event.
 */
export const get = internalQuery({
  args: {
    teamId: v.id("teams"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event || event.teamId !== args.teamId) {
      return { error: "Event not found" };
    }

    // Get attendee counts
    const allAttendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const going = allAttendees.filter((a) => a.status === "going").length;
    const maybe = allAttendees.filter((a) => a.status === "maybe").length;
    const notGoing = allAttendees.filter(
      (a) => a.status === "not_going"
    ).length;

    return {
      id: event._id,
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: formatDateTime(event.startTime),
      endTime: event.endTime ? formatDateTime(event.endTime) : null,
      location: event.location,
      address: event.address,
      maxAttendees: event.maxAttendees,
      requiresRSVP: event.requiresRSVP,
      attendees: {
        going,
        maybe,
        notGoing,
        total: allAttendees.length,
      },
    };
  },
});

/**
 * Get attendees for a specific event.
 */
export const attendees = internalQuery({
  args: {
    teamId: v.id("teams"),
    eventId: v.id("events"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify event belongs to team
    const event = await ctx.db.get(args.eventId);
    if (!event || event.teamId !== args.teamId) {
      return { error: "Event not found" };
    }

    let attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (args.status) {
      attendees = attendees.filter((a) => a.status === args.status);
    }

    // Get user info for each attendee
    const result = await Promise.all(
      attendees.map(async (attendee) => {
        const user = await ctx.db.get(attendee.userId);
        const member = await ctx.db
          .query("teamMembers")
          .withIndex("by_user_team", (q) =>
            q.eq("userId", attendee.userId).eq("teamId", args.teamId)
          )
          .first();

        return {
          name: user?.name || "Unknown",
          role: member?.role || "member",
          status: attendee.status,
          notes: attendee.notes,
          dietaryNeeds: member?.dietaryNeeds || [],
        };
      })
    );

    return {
      event: event.title,
      attendeeCount: result.length,
      attendees: result,
    };
  },
});

/**
 * Search events by title or description.
 */
export const search = internalQuery({
  args: {
    teamId: v.id("teams"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const searchLower = args.query.toLowerCase();

    // Get upcoming events for the team
    const events = await ctx.db
      .query("events")
      .withIndex("by_team_date", (q) =>
        q.eq("teamId", args.teamId).gte("startTime", now)
      )
      .take(50);

    // Filter by search query
    const matches = events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower)) ||
        (e.location && e.location.toLowerCase().includes(searchLower))
    );

    return {
      query: args.query,
      count: matches.length,
      events: matches.map((e) => ({
        id: e._id,
        title: e.title,
        type: e.type,
        startTime: formatDateTime(e.startTime),
        location: e.location,
      })),
    };
  },
});
