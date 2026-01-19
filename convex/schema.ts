import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Extend the users table with birthdate for YPP compliance
  // This overrides the authTables users table while keeping auth fields
  users: defineTable({
    // Auth fields (from authTables)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    birthdate: v.optional(v.number()), // Unix timestamp for YPP compliance
  }),

  // Teams - the core organizational unit
  teams: defineTable({
    name: v.string(),
    number: v.string(),
    program: v.string(), // ftc, frc, vex, etc.
    activeSeasonId: v.optional(v.id("seasons")),
    discordGuildId: v.optional(v.string()), // Discord server ID for bot integration
    yppContacts: v.optional(v.array(v.id("users"))), // Adult mentors designated as YPP contacts
  })
    .index("by_program_number", ["program", "number"])
    .index("by_discord_guild", ["discordGuildId"]),

  // Team members - links users to teams with roles
  teamMembers: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    role: v.string(), // "lead_mentor" | "mentor" | "student"
    // Personal context for GLaDOS personalization
    dietaryNeeds: v.optional(v.array(v.string())), // e.g., ["vegetarian", "nut allergy"]
    observances: v.optional(v.array(v.string())), // e.g., ["Shabbat", "Ramadan fasting"]
    anythingElse: v.optional(v.string()), // Free-text notes from mentor
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_user_team", ["userId", "teamId"])
    .index("by_team_role", ["teamId", "role"]),

  // Team invites - for inviting new members
  teamInvites: defineTable({
    teamId: v.id("teams"),
    token: v.string(),
    role: v.string(),
    expiresAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_token", ["token"]),

  // Seasons - competition years
  seasons: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    year: v.string(), // "2024-2025"
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isArchived: v.boolean(),
  }).index("by_team", ["teamId"]),

  // Vendors - parts suppliers
  vendors: defineTable({
    name: v.string(),
    website: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    notes: v.optional(v.string()),
    isGlobal: v.boolean(),
    teamId: v.optional(v.id("teams")),
  }).index("by_team", ["teamId"]),

  // Parts - inventory items
  parts: defineTable({
    teamId: v.id("teams"),
    vendorId: v.optional(v.id("vendors")),
    name: v.string(),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.number(),
    reorderPoint: v.number(),
    location: v.optional(v.string()),
    unitPriceCents: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["teamId"],
    }),

  // BOM items - bill of materials entries
  bomItems: defineTable({
    teamId: v.id("teams"),
    partId: v.id("parts"),
    subsystem: v.string(),
    quantityNeeded: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_part", ["partId"]),

  // Orders - purchase orders
  orders: defineTable({
    teamId: v.id("teams"),
    vendorId: v.id("vendors"),
    status: v.string(), // draft, pending, approved, rejected, ordered, received
    totalCents: v.number(),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    createdBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
  })
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"]),

  // Order items - line items in an order
  orderItems: defineTable({
    orderId: v.id("orders"),
    partId: v.id("parts"),
    quantity: v.number(),
    unitPriceCents: v.number(),
  }).index("by_order", ["orderId"]),

  // Agent configuration - configurable prompts and guardrails
  agentConfig: defineTable({
    key: v.string(), // "system_prompt", "safety_rules", etc.
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_key", ["key"]),

  // Safety alerts - for mentor notification of concerning content
  safetyAlerts: defineTable({
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.optional(v.string()),
    alertType: v.string(), // "crisis", "escalation", "review"
    severity: v.string(), // "high", "medium", "low"
    triggerReason: v.string(),
    messageContent: v.string(),
    status: v.string(), // "pending", "reviewed", "resolved"
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
    createdAt: v.number(),
    // Mentor acknowledgment tracking
    notifiedMentorId: v.optional(v.string()), // Discord user ID of mentor who was DM'd
    ackMethod: v.optional(v.string()), // "emoji", "reply", "link", "dashboard"
    ackAt: v.optional(v.number()), // When acknowledged
    ackBy: v.optional(v.string()), // Discord user ID who acknowledged
    escalatedAt: v.optional(v.number()), // When escalation was triggered
    escalationCount: v.optional(v.number()), // Number of times escalated
  })
    .index("by_team_status", ["teamId", "status"])
    .index("by_severity", ["severity"])
    .index("by_pending_unacked", ["status", "ackAt"]),

  // Alert acknowledgment tokens - for "click to review" links in DMs
  alertAckTokens: defineTable({
    token: v.string(),
    alertId: v.id("safetyAlerts"),
    teamId: v.id("teams"),
    mentorDiscordId: v.string(), // Discord user ID of mentor
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_alert", ["alertId"]),

  // Conversations - for multi-turn agent interactions
  conversations: defineTable({
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.string(),
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    lastActivity: v.number(),
  })
    .index("by_team_channel", ["teamId", "channelId"])
    .index("by_last_activity", ["lastActivity"]),

  // Discord links - maps Discord users to BuildSeason users
  // For users who sign in via Discord OAuth, this is populated automatically
  // For users who sign in via Google/GitHub, they can link manually
  discordLinks: defineTable({
    userId: v.id("users"), // BuildSeason user
    discordUserId: v.string(), // Discord user ID
    discordUsername: v.optional(v.string()), // Discord username for display
    linkedAt: v.number(),
    linkedVia: v.string(), // "oauth" | "manual" | "bot_link"
  })
    .index("by_user", ["userId"])
    .index("by_discord_user", ["discordUserId"]),

  // Discord link tokens - for "click here to connect" flow from bot
  // When an unknown Discord user interacts with bot, we generate a token
  // They click a link, log in, and the token connects their accounts
  discordLinkTokens: defineTable({
    token: v.string(),
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    guildId: v.optional(v.string()),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    usedBy: v.optional(v.id("users")),
  })
    .index("by_token", ["token"])
    .index("by_discord_user", ["discordUserId"]),

  // Provider profiles - stores usernames/display names for OAuth providers
  // This supplements authAccounts (which only stores provider IDs)
  providerProfiles: defineTable({
    userId: v.id("users"),
    provider: v.string(), // "github", "google", "discord"
    username: v.optional(v.string()), // Provider-specific username
    displayName: v.optional(v.string()), // Display name from provider
    avatarUrl: v.optional(v.string()), // Avatar URL from provider
    email: v.optional(v.string()), // Email from provider (if different)
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  // Events - team calendar and event management
  events: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("competition"),
      v.literal("outreach"),
      v.literal("meeting"),
      v.literal("practice"),
      v.literal("other")
    ),
    startTime: v.number(), // Unix timestamp
    endTime: v.optional(v.number()), // Unix timestamp
    location: v.optional(v.string()), // Location name
    address: v.optional(v.string()), // Full address
    createdBy: v.id("users"),
    maxAttendees: v.optional(v.number()),
    requiresRSVP: v.boolean(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_date", ["teamId", "startTime"]),

  // Event attendees - RSVP tracking for events
  eventAttendees: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("not_going")
    ),
    rsvpAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"]),

  // Audit logs - append-only log of all agent interactions for compliance
  // Separate from conversations table (which is for multi-turn context)
  agentAuditLogs: defineTable({
    teamId: v.id("teams"),
    userId: v.string(), // Discord user ID
    channelId: v.optional(v.string()), // Discord channel ID (optional for DMs)
    timestamp: v.number(), // Unix timestamp
    userMessage: v.string(), // The user's input message
    agentResponse: v.string(), // The agent's response
    toolCalls: v.optional(
      v.array(
        v.object({
          name: v.string(), // Tool name
          input: v.string(), // JSON stringified input
          output: v.optional(v.string()), // JSON stringified output (if available)
          error: v.optional(v.string()), // Error message if tool failed
        })
      )
    ),
    // Metadata for filtering and compliance
    containsSafetyAlert: v.optional(v.boolean()), // Did this trigger a safety alert?
    messageType: v.optional(v.string()), // "mention", "dm", "channel", etc.
  })
    .index("by_team", ["teamId"])
    .index("by_team_user", ["teamId", "userId"])
    .index("by_team_timestamp", ["teamId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  // Birthday messages - tracks sent birthday messages to prevent duplicates
  birthdayMessages: defineTable({
    teamId: v.id("teams"),
    memberIds: v.array(v.id("users")), // Users who had birthdays
    message: v.string(),
    sentAt: v.number(),
    discordMessageId: v.optional(v.string()),
    // Date key for duplicate prevention (YYYY-MM-DD format in UTC)
    dateKey: v.string(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_date", ["teamId", "dateKey"]),
});
