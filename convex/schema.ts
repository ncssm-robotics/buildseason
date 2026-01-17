import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Teams - the core organizational unit
  teams: defineTable({
    name: v.string(),
    number: v.string(),
    program: v.string(), // ftc, frc, vex, etc.
    activeSeasonId: v.optional(v.id("seasons")),
  }).index("by_program_number", ["program", "number"]),

  // Team members - links users to teams with roles
  teamMembers: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    role: v.string(), // admin, mentor, student
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_user_team", ["userId", "teamId"]),

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
});
