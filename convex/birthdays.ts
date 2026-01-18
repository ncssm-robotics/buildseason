import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Birthday feature for GLaDOS.
 *
 * Daily cron job checks for team members with birthdays today and
 * sends personalized messages to their team's Discord channel.
 */

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

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
    const year = currentYear ?? new Date().getFullYear();
    if (!isLeapYear(year)) {
      month = 3;
      day = 1;
    }
  }

  return { month, day };
}

/**
 * Check if a given date is someone's birthday.
 *
 * @param birthdate - Birthday as Unix timestamp
 * @param checkDate - The date to check against (defaults to now)
 */
export function isBirthdayOnDate(birthdate: number, checkDate?: Date): boolean {
  const today = checkDate ?? new Date();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDay = today.getUTCDate();
  const currentYear = today.getFullYear();

  const { month, day } = getMonthDay(birthdate, currentYear);

  return month === todayMonth && day === todayDay;
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
function generateBirthdayMessage(names: string[], teamNumber: string): string {
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
    `🎂 It's ${nameList}'s birthday! The team couldn't function without ${isSingle ? "you" : "you all"}. Well, it could. But less efficiently.`,
    `🎂 Happy birthday, ${nameList}! I calculated a 100% chance that today would be excellent for ${isSingle ? "you" : "you all"}.`,
    `🎂 Birthday detected: ${nameList}. Protocol dictates I wish ${isSingle ? "you" : "you all"} a wonderful day. Consider it wished.`,
    `🎂 Happy birthday, ${nameList}! Another year of making robots do cool things.`,
  ];

  // Pick a random message
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * Log a birthday message that was sent (or would be sent).
 * This allows us to track what was sent and avoid duplicates.
 */
export const logBirthdayMessage = internalMutation({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("users")),
    message: v.string(),
    sentAt: v.number(),
    discordMessageId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // For now, we just log to console
    // In the future, we could add a birthdayMessages table to track sent messages
    console.log(
      `[Birthday] Sent to team ${args.teamId}: ${args.message} (members: ${args.memberIds.join(", ")})`
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

    let sentCount = 0;

    for (const teamBirthdays of birthdaysToday) {
      const { teamId, teamNumber, discordGuildId, members } = teamBirthdays;

      if (!discordGuildId) {
        console.log(
          `[Birthday] Team ${teamNumber} has no Discord guild configured, skipping`
        );
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
        }
      );

      sentCount++;
    }

    console.log(`[Birthday] Scheduled ${sentCount} birthday messages`);
    return { sent: sentCount };
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

      // Log the sent message
      await ctx.runMutation(internal.birthdays.logBirthdayMessage, {
        teamId: args.teamId,
        memberIds: args.memberIds,
        message: args.message,
        sentAt: Date.now(),
        discordMessageId: sentMessage.id,
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
