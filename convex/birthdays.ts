import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { isLeapYear, isBirthdayOnDate } from "./lib/ypp";

// Re-export for tests
export { isLeapYear, isBirthdayOnDate };

/**
 * Birthday feature for GLaDOS.
 *
 * Daily cron job checks for team members with birthdays today and
 * sends personalized messages to their team's Discord channel.
 */

/**
 * Get the month and day from a Unix timestamp.
 * Handles leap year birthdays by treating Feb 29 as Mar 1 in non-leap years.
 *
 * @param timestamp - Birthday as Unix timestamp
 * @param currentYear - The current year to check leap year status (defaults to now)
 */
export function getMonthDay(
  timestamp: number,
  currentYear?: number
): { month: number; day: number } {
  const date = new Date(timestamp);
  let month = date.getUTCMonth() + 1; // 1-12
  let day = date.getUTCDate();

  // Handle leap year birthdays: Feb 29 → Mar 1 in non-leap years
  if (month === 2 && day === 29) {
    const year = currentYear ?? new Date().getUTCFullYear();
    if (!isLeapYear(year)) {
      month = 3;
      day = 1;
    }
  }

  return { month, day };
}

/**
 * Find all users with birthdays today, grouped by team.
 */
export const findBirthdaysToday = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all users with birthdates
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("birthdate"), undefined))
      .collect();

    // Filter to users with birthdays today
    const birthdayUsers = users.filter(
      (user) => user.birthdate && isBirthdayOnDate(user.birthdate)
    );

    if (birthdayUsers.length === 0) {
      return [];
    }

    // Group by team
    const teamMap = new Map<
      string,
      {
        teamId: Id<"teams">;
        teamName: string;
        teamNumber: string;
        discordGuildId: string | undefined;
        members: Array<{
          userId: Id<"users">;
          name: string;
          firstName: string;
        }>;
      }
    >();

    for (const user of birthdayUsers) {
      // Find all teams this user is a member of
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const membership of memberships) {
        const team = await ctx.db.get(membership.teamId);
        if (!team) continue;

        const teamKey = team._id.toString();
        if (!teamMap.has(teamKey)) {
          teamMap.set(teamKey, {
            teamId: team._id,
            teamName: team.name,
            teamNumber: team.number,
            discordGuildId: team.discordGuildId,
            members: [],
          });
        }

        const entry = teamMap.get(teamKey)!;
        const firstName = user.name?.split(" ")[0] || "teammate";
        entry.members.push({
          userId: user._id,
          name: user.name || "Team Member",
          firstName,
        });
      }
    }

    return Array.from(teamMap.values());
  },
});

/**
 * Generate a birthday message in GLaDOS style.
 * Warm but not over-the-top, with a subtle Portal reference.
 */
export function generateBirthdayMessage(
  names: string[],
  teamNumber: string
): string {
  if (names.length === 0) return "";

  const isSingle = names.length === 1;
  const nameList =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

  // GLaDOS-style birthday messages - warm but with subtle personality
  const messages = [
    `🎂 Happy birthday, ${nameList}! Team ${teamNumber} is lucky to have ${isSingle ? "you" : "each of you"}.`,
    `🎂 It's ${nameList}'s birthday! Team ${teamNumber} couldn't function without ${isSingle ? "you" : "you all"}. Well, it could. But less efficiently.`,
    `🎂 Happy birthday, ${nameList}! Team ${teamNumber}'s systems predict a 100% chance that today will be excellent for ${isSingle ? "you" : "you all"}.`,
    `🎂 Birthday detected: ${nameList} of Team ${teamNumber}. Protocol dictates I wish ${isSingle ? "you" : "you all"} a wonderful day. Consider it wished.`,
    `🎂 Happy birthday, ${nameList}! Another year of making robots do cool things with Team ${teamNumber}.`,
  ];

  // Pick a random message
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * Get today's date key in YYYY-MM-DD format (UTC).
 */
function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if we already sent a birthday message for this team today.
 */
export const hasSentBirthdayToday = internalQuery({
  args: {
    teamId: v.id("teams"),
    dateKey: v.string(),
  },
  handler: async (ctx, { teamId, dateKey }) => {
    const existing = await ctx.db
      .query("birthdayMessages")
      .withIndex("by_team_date", (q) =>
        q.eq("teamId", teamId).eq("dateKey", dateKey)
      )
      .first();
    return existing !== null;
  },
});

/**
 * Log a birthday message that was sent.
 * Stores in the birthdayMessages table to prevent duplicates.
 */
export const logBirthdayMessage = internalMutation({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("users")),
    message: v.string(),
    sentAt: v.number(),
    discordMessageId: v.optional(v.string()),
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("birthdayMessages", {
      teamId: args.teamId,
      memberIds: args.memberIds,
      message: args.message,
      sentAt: args.sentAt,
      discordMessageId: args.discordMessageId,
      dateKey: args.dateKey,
    });
    console.log(
      `[Birthday] Logged message for team ${args.teamId}: ${args.message} (members: ${args.memberIds.join(", ")})`
    );
    return { success: true };
  },
});

/**
 * Send birthday messages for all teams with birthdays today.
 * Called by the daily cron job.
 */
export const sendBirthdayMessages = internalAction({
  args: {},
  handler: async (ctx) => {
    const birthdaysToday = await ctx.runQuery(
      internal.birthdays.findBirthdaysToday,
      {}
    );

    if (birthdaysToday.length === 0) {
      console.log("[Birthday] No birthdays today");
      return { sent: 0 };
    }

    const dateKey = getDateKey();
    let sentCount = 0;
    let skippedCount = 0;

    for (const teamBirthdays of birthdaysToday) {
      const { teamId, teamNumber, discordGuildId, members } = teamBirthdays;

      if (!discordGuildId) {
        console.log(
          `[Birthday] Team ${teamNumber} has no Discord guild configured, skipping`
        );
        continue;
      }

      // Check if we already sent a message for this team today
      const alreadySent = await ctx.runQuery(
        internal.birthdays.hasSentBirthdayToday,
        { teamId, dateKey }
      );

      if (alreadySent) {
        console.log(
          `[Birthday] Already sent message for team ${teamNumber} today, skipping`
        );
        skippedCount++;
        continue;
      }

      const firstNames = members.map((m) => m.firstName);
      const message = generateBirthdayMessage(firstNames, teamNumber);

      // Schedule the Discord message action
      await ctx.scheduler.runAfter(
        0,
        internal.birthdays.sendDiscordBirthdayMessage,
        {
          teamId,
          guildId: discordGuildId,
          message,
          memberIds: members.map((m) => m.userId),
          dateKey,
        }
      );

      sentCount++;
    }

    console.log(
      `[Birthday] Scheduled ${sentCount} birthday messages (${skippedCount} skipped as duplicates)`
    );
    return { sent: sentCount, skipped: skippedCount };
  },
});

/**
 * Send a birthday message to a Discord channel.
 * This action makes the actual Discord API call.
 */
export const sendDiscordBirthdayMessage = internalAction({
  args: {
    teamId: v.id("teams"),
    guildId: v.string(),
    message: v.string(),
    memberIds: v.array(v.id("users")),
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      console.error("[Birthday] DISCORD_BOT_TOKEN not configured");
      return { success: false, error: "Bot token not configured" };
    }

    try {
      // Get the guild's channels to find a suitable one
      const channelsResponse = await fetch(
        `https://discord.com/api/v10/guilds/${args.guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      if (!channelsResponse.ok) {
        const error = await channelsResponse.text();
        console.error(`[Birthday] Failed to get channels: ${error}`);
        return { success: false, error: "Failed to get guild channels" };
      }

      const channels = (await channelsResponse.json()) as Array<{
        id: string;
        name: string;
        type: number;
      }>;

      // Find the first text channel (type 0) named "general" or first available
      // Type 0 = GUILD_TEXT
      const textChannels = channels.filter((c) => c.type === 0);
      const targetChannel =
        textChannels.find((c) => c.name === "general") || textChannels[0];

      if (!targetChannel) {
        console.error("[Birthday] No text channels found in guild");
        return { success: false, error: "No text channels in guild" };
      }

      // Send the birthday message
      const messageResponse = await fetch(
        `https://discord.com/api/v10/channels/${targetChannel.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: args.message,
          }),
        }
      );

      if (!messageResponse.ok) {
        const error = await messageResponse.text();
        console.error(`[Birthday] Failed to send message: ${error}`);
        return { success: false, error: "Failed to send message" };
      }

      const sentMessage = (await messageResponse.json()) as { id: string };

      // Log the sent message to prevent duplicates
      await ctx.runMutation(internal.birthdays.logBirthdayMessage, {
        teamId: args.teamId,
        memberIds: args.memberIds,
        message: args.message,
        sentAt: Date.now(),
        discordMessageId: sentMessage.id,
        dateKey: args.dateKey,
      });

      console.log(
        `[Birthday] Sent message to channel ${targetChannel.name} (${targetChannel.id})`
      );
      return { success: true, channelId: targetChannel.id };
    } catch (error) {
      console.error("[Birthday] Error sending Discord message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
