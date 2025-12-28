import type { Database } from "../../db";
import type { TeamRole, Subsystem, OrderStatus } from "../../db/schema";
import * as schema from "../../db/schema";

/**
 * Factory utilities for creating test data.
 * All factories return objects that can be inserted into the database.
 */

let userCounter = 0;
let teamCounter = 0;
let partCounter = 0;
let vendorCounter = 0;

/**
 * Generates a unique ID for testing.
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * User factory - creates test users
 */
export interface CreateUserOptions {
  id?: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  image?: string;
}

export function createUser(options: CreateUserOptions = {}) {
  const counter = ++userCounter;
  return {
    id: options.id || generateId("user"),
    email: options.email || `test${counter}@example.com`,
    emailVerified: options.emailVerified ?? false,
    name: options.name || `Test User ${counter}`,
    image: options.image || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Inserts a user into the database and returns the user object.
 */
export async function createUserInDb(
  db: Database,
  options: CreateUserOptions = {}
) {
  const user = createUser(options);
  await db.insert(schema.users).values(user);
  return user;
}

/**
 * Team factory - creates test teams
 */
export interface CreateTeamOptions {
  id?: string;
  name?: string;
  number?: string;
  season?: string;
  inviteCode?: string;
}

export function createTeam(options: CreateTeamOptions = {}) {
  const counter = ++teamCounter;
  return {
    id: options.id || generateId("team"),
    name: options.name || `Test Team ${counter}`,
    number: options.number || `${10000 + counter}`,
    season: options.season || "2024-2025",
    inviteCode: options.inviteCode || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Inserts a team into the database and returns the team object.
 */
export async function createTeamInDb(
  db: Database,
  options: CreateTeamOptions = {}
) {
  const team = createTeam(options);
  await db.insert(schema.teams).values(team);
  return team;
}

/**
 * Team member factory - creates team memberships
 */
export interface CreateTeamMemberOptions {
  id?: string;
  userId: string;
  teamId: string;
  role?: TeamRole;
}

export function createTeamMember(options: CreateTeamMemberOptions) {
  return {
    id: options.id || generateId("member"),
    userId: options.userId,
    teamId: options.teamId,
    role: options.role || ("student" as TeamRole),
    createdAt: new Date(),
  };
}

/**
 * Inserts a team member into the database and returns the member object.
 */
export async function createTeamMemberInDb(
  db: Database,
  options: CreateTeamMemberOptions
) {
  const member = createTeamMember(options);
  await db.insert(schema.teamMembers).values(member);
  return member;
}

/**
 * Vendor factory - creates test vendors
 */
export interface CreateVendorOptions {
  id?: string;
  name?: string;
  website?: string;
  avgLeadTimeDays?: number;
  notes?: string;
  isGlobal?: boolean;
  teamId?: string;
}

export function createVendor(options: CreateVendorOptions = {}) {
  const counter = ++vendorCounter;
  return {
    id: options.id || generateId("vendor"),
    name: options.name || `Vendor ${counter}`,
    website: options.website || null,
    avgLeadTimeDays: options.avgLeadTimeDays || null,
    notes: options.notes || null,
    isGlobal: options.isGlobal ?? false,
    teamId: options.teamId || null,
    createdAt: new Date(),
  };
}

/**
 * Inserts a vendor into the database and returns the vendor object.
 */
export async function createVendorInDb(
  db: Database,
  options: CreateVendorOptions = {}
) {
  const vendor = createVendor(options);
  await db.insert(schema.vendors).values(vendor);
  return vendor;
}

/**
 * Part factory - creates test parts
 */
export interface CreatePartOptions {
  id?: string;
  teamId: string;
  vendorId?: string;
  name?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  reorderPoint?: number;
  location?: string;
  unitPriceCents?: number;
  imageUrl?: string;
}

export function createPart(options: CreatePartOptions) {
  const counter = ++partCounter;
  return {
    id: options.id || generateId("part"),
    teamId: options.teamId,
    vendorId: options.vendorId || null,
    name: options.name || `Test Part ${counter}`,
    sku: options.sku || null,
    description: options.description || null,
    quantity: options.quantity ?? 0,
    reorderPoint: options.reorderPoint ?? 0,
    location: options.location || null,
    unitPriceCents: options.unitPriceCents || null,
    imageUrl: options.imageUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Inserts a part into the database and returns the part object.
 */
export async function createPartInDb(db: Database, options: CreatePartOptions) {
  const part = createPart(options);
  await db.insert(schema.parts).values(part);
  return part;
}

/**
 * BOM item factory - creates bill of materials items
 */
export interface CreateBomItemOptions {
  id?: string;
  teamId: string;
  partId: string;
  subsystem?: Subsystem;
  quantityNeeded?: number;
  notes?: string;
}

export function createBomItem(options: CreateBomItemOptions) {
  return {
    id: options.id || generateId("bom"),
    teamId: options.teamId,
    partId: options.partId,
    subsystem: options.subsystem || ("other" as Subsystem),
    quantityNeeded: options.quantityNeeded ?? 1,
    notes: options.notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Inserts a BOM item into the database and returns the item object.
 */
export async function createBomItemInDb(
  db: Database,
  options: CreateBomItemOptions
) {
  const bomItem = createBomItem(options);
  await db.insert(schema.bomItems).values(bomItem);
  return bomItem;
}

/**
 * Order factory - creates test orders
 */
export interface CreateOrderOptions {
  id?: string;
  teamId: string;
  vendorId: string;
  createdById: string;
  status?: OrderStatus;
  totalCents?: number;
  notes?: string;
  rejectionReason?: string;
  approvedById?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  orderedAt?: Date;
  receivedAt?: Date;
}

export function createOrder(options: CreateOrderOptions) {
  return {
    id: options.id || generateId("order"),
    teamId: options.teamId,
    vendorId: options.vendorId,
    createdById: options.createdById,
    status: options.status || ("draft" as OrderStatus),
    totalCents: options.totalCents ?? 0,
    notes: options.notes || null,
    rejectionReason: options.rejectionReason || null,
    approvedById: options.approvedById || null,
    createdAt: new Date(),
    submittedAt: options.submittedAt || null,
    approvedAt: options.approvedAt || null,
    orderedAt: options.orderedAt || null,
    receivedAt: options.receivedAt || null,
    updatedAt: new Date(),
  };
}

/**
 * Inserts an order into the database and returns the order object.
 */
export async function createOrderInDb(
  db: Database,
  options: CreateOrderOptions
) {
  const order = createOrder(options);
  await db.insert(schema.orders).values(order);
  return order;
}

/**
 * Order item factory - creates order line items
 */
export interface CreateOrderItemOptions {
  id?: string;
  orderId: string;
  partId: string;
  quantity?: number;
  unitPriceCents: number;
}

export function createOrderItem(options: CreateOrderItemOptions) {
  return {
    id: options.id || generateId("order-item"),
    orderId: options.orderId,
    partId: options.partId,
    quantity: options.quantity ?? 1,
    unitPriceCents: options.unitPriceCents,
    createdAt: new Date(),
  };
}

/**
 * Inserts an order item into the database and returns the item object.
 */
export async function createOrderItemInDb(
  db: Database,
  options: CreateOrderItemOptions
) {
  const orderItem = createOrderItem(options);
  await db.insert(schema.orderItems).values(orderItem);
  return orderItem;
}

/**
 * Session factory - creates test sessions
 */
export interface CreateSessionOptions {
  id?: string;
  userId: string;
  token?: string;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function createSession(options: CreateSessionOptions) {
  const token = options.token || generateId("token");
  const expiresAt =
    options.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return {
    id: options.id || generateId("session"),
    userId: options.userId,
    token,
    expiresAt,
    ipAddress: options.ipAddress || null,
    userAgent: options.userAgent || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Inserts a session into the database and returns the session object.
 */
export async function createSessionInDb(
  db: Database,
  options: CreateSessionOptions
) {
  const session = createSession(options);
  await db.insert(schema.sessions).values(session);
  return session;
}

/**
 * Helper to create a complete test scenario with user, team, and membership
 */
export async function createUserWithTeam(
  db: Database,
  options: {
    user?: CreateUserOptions;
    team?: CreateTeamOptions;
    role?: TeamRole;
  } = {}
) {
  const user = await createUserInDb(db, options.user);
  const team = await createTeamInDb(db, options.team);
  const member = await createTeamMemberInDb(db, {
    userId: user.id,
    teamId: team.id,
    role: options.role,
  });

  return { user, team, member };
}
