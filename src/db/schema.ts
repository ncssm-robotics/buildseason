import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Users & Authentication (Better-Auth compatible)
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Teams
// ============================================================================

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  number: text("number").notNull(), // FTC team number like "16626"
  season: text("season").notNull(), // e.g., "2024-2025"
  inviteCode: text("invite_code").unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TeamRole = "admin" | "mentor" | "student";

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  role: text("role").$type<TeamRole>().notNull().default("student"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Vendors
// ============================================================================

export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  avgLeadTimeDays: integer("avg_lead_time_days"),
  notes: text("notes"),
  isGlobal: integer("is_global", { mode: "boolean" }).notNull().default(false), // Seeded vendors
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }), // null for global
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Parts Inventory
// ============================================================================

export const parts = sqliteTable("parts", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id").references(() => vendors.id),
  name: text("name").notNull(),
  sku: text("sku"), // Vendor part number
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  reorderPoint: integer("reorder_point").default(0),
  location: text("location"), // Storage location
  unitPriceCents: integer("unit_price_cents"), // Price in cents
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Bill of Materials
// ============================================================================

export type Subsystem =
  | "drivetrain"
  | "intake"
  | "lift"
  | "scoring"
  | "electronics"
  | "hardware"
  | "other";

export const bomItems = sqliteTable("bom_items", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  partId: text("part_id")
    .notNull()
    .references(() => parts.id, { onDelete: "cascade" }),
  subsystem: text("subsystem").$type<Subsystem>().notNull().default("other"),
  quantityNeeded: integer("quantity_needed").notNull().default(1),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Orders
// ============================================================================

export type OrderStatus =
  | "draft"
  | "pending" // Submitted for approval
  | "approved"
  | "rejected"
  | "ordered" // Placed with vendor
  | "received";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  status: text("status").$type<OrderStatus>().notNull().default("draft"),
  totalCents: integer("total_cents").notNull().default(0),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),

  // Audit trail
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  approvedById: text("approved_by_id").references(() => users.id),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  orderedAt: integer("ordered_at", { mode: "timestamp" }),
  receivedAt: integer("received_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  partId: text("part_id")
    .notNull()
    .references(() => parts.id),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  teamMembers: many(teamMembers),
  createdOrders: many(orders, { relationName: "createdBy" }),
  approvedOrders: many(orders, { relationName: "approvedBy" }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  parts: many(parts),
  bomItems: many(bomItems),
  orders: many(orders),
  vendors: many(vendors),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  team: one(teams, {
    fields: [vendors.teamId],
    references: [teams.id],
  }),
  parts: many(parts),
  orders: many(orders),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  team: one(teams, {
    fields: [parts.teamId],
    references: [teams.id],
  }),
  vendor: one(vendors, {
    fields: [parts.vendorId],
    references: [vendors.id],
  }),
  bomItems: many(bomItems),
  orderItems: many(orderItems),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  team: one(teams, {
    fields: [bomItems.teamId],
    references: [teams.id],
  }),
  part: one(parts, {
    fields: [bomItems.partId],
    references: [parts.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  team: one(teams, {
    fields: [orders.teamId],
    references: [teams.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  createdBy: one(users, {
    fields: [orders.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
  approvedBy: one(users, {
    fields: [orders.approvedById],
    references: [users.id],
    relationName: "approvedBy",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  part: one(parts, {
    fields: [orderItems.partId],
    references: [parts.id],
  }),
}));
