/**
 * Permission and channel context utilities.
 * Handles team context extraction and permission checking.
 */
import type {
  Channel,
  GuildMember,
  PermissionResolvable,
  User,
} from "discord.js";

/**
 * Team context extracted from a Discord channel or user.
 */
export interface TeamContext {
  /** Internal BuildSeason team ID */
  teamId: string | null;
  /** Robotics program (FTC, FRC, etc.) */
  program: string | null;
  /** Team number */
  teamNumber: string | null;
  /** Channel type context */
  channelType: "team" | "dm" | "general";
}

/**
 * Extracts team context from a Discord channel.
 * Uses channel naming conventions: #ftc-12345-general, #frc-8404-build
 *
 * @param channel - Discord channel to extract context from
 * @returns Team context or null context for unknown channels
 */
export async function getTeamContext(channel: Channel): Promise<TeamContext> {
  // DM - would need to lookup from user in database
  if (channel.isDMBased()) {
    return {
      teamId: null,
      program: null,
      teamNumber: null,
      channelType: "dm",
    };
  }

  // Guild channel - check channel name or category
  if ("name" in channel && channel.name) {
    // Channel naming convention: ftc-12345-general, frc-8404-build
    const match = channel.name.match(/^(ftc|frc)-(\d+)/i);
    if (match) {
      const program = match[1].toUpperCase();
      const teamNumber = match[2];

      return {
        // teamId would be looked up from database in full implementation
        teamId: `${program}-${teamNumber}`,
        program,
        teamNumber,
        channelType: "team",
      };
    }
  }

  // Unknown/general channel
  return {
    teamId: null,
    program: null,
    teamNumber: null,
    channelType: "general",
  };
}

/**
 * Checks if a guild member has a specific permission.
 *
 * @param member - Guild member to check
 * @param permission - Permission to check for
 * @returns true if member has the permission
 */
export function hasPermission(
  member: GuildMember | null,
  permission: PermissionResolvable
): boolean {
  if (!member) return false;
  return member.permissions.has(permission);
}

/**
 * Checks if a user has approval authority based on roles.
 * Mentors and coaches can approve requests.
 *
 * @param member - Guild member to check
 * @returns true if member can approve requests
 */
export function canApprove(member: GuildMember | null): boolean {
  if (!member) return false;

  // Check for mentor/coach roles (case-insensitive)
  const approverRoles = ["mentor", "coach", "lead mentor", "admin"];
  return member.roles.cache.some((role) =>
    approverRoles.includes(role.name.toLowerCase())
  );
}

/**
 * Checks if a user is a bot administrator.
 *
 * @param user - User to check
 * @returns true if user is a bot admin
 */
export function isBotAdmin(user: User): boolean {
  const adminIds = process.env.DISCORD_ADMIN_IDS?.split(",") ?? [];
  return adminIds.includes(user.id);
}

/**
 * Gets the display name for a user in a guild context.
 *
 * @param member - Guild member (may be null for DMs)
 * @param user - Discord user
 * @returns Display name (nickname if available, otherwise username)
 */
export function getDisplayName(member: GuildMember | null, user: User): string {
  return member?.displayName ?? user.displayName;
}
