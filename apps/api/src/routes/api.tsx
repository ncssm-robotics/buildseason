import { Hono } from "hono";
import {
  requireAuth,
  teamMiddleware,
  requireMentor,
  type AuthVariables,
  type TeamVariables,
} from "../middleware/auth";
import { db } from "../db";
import {
  teams,
  teamMembers,
  parts,
  orders,
  orderItems,
  vendors,
  bomItems,
  type TeamRole,
  type OrderStatus,
} from "../db/schema";
import { eq, and, sql, like, or, asc, desc } from "drizzle-orm";

// Escape SQL LIKE wildcards to prevent pattern injection
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

// ============ User Routes ============
const userRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const user = c.get("user")!;
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    });
  });

// ============ Teams Routes ============
const teamsRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const user = c.get("user")!;

    const memberships = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, user.id),
      with: { team: true },
    });

    const teamsWithStats = await Promise.all(
      memberships.map(async ({ team, role }) => {
        const partsData = await db
          .select({
            total: sql<number>`count(*)`,
            lowStock: sql<number>`sum(case when ${parts.quantity} <= ${parts.reorderPoint} and ${parts.reorderPoint} > 0 then 1 else 0 end)`,
          })
          .from(parts)
          .where(eq(parts.teamId, team.id));

        const pendingOrders = await db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(eq(orders.teamId, team.id), eq(orders.status, "pending")));

        const activeOrders = await db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(
            and(
              eq(orders.teamId, team.id),
              sql`${orders.status} IN ('approved', 'ordered')`
            )
          );

        return {
          id: team.id,
          name: team.name,
          number: team.number,
          season: team.season,
          role,
          stats: {
            partsCount: partsData[0]?.total || 0,
            lowStockCount: partsData[0]?.lowStock || 0,
            pendingOrdersCount: pendingOrders[0]?.count || 0,
            activeOrdersCount: activeOrders[0]?.count || 0,
          },
        };
      })
    );

    return c.json(teamsWithStats);
  })
  .post("/", async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();

    const { name, number, season } = body;

    if (!name || !number || !season) {
      return c.json({ error: "All fields are required" }, 400);
    }

    if (!/^\d+$/.test(number)) {
      return c.json({ error: "Team number must be numeric" }, 400);
    }

    try {
      const teamId = crypto.randomUUID();
      const memberId = crypto.randomUUID();

      await db.insert(teams).values({
        id: teamId,
        name: name.trim(),
        number: number.trim(),
        season,
      });

      await db.insert(teamMembers).values({
        id: memberId,
        userId: user.id,
        teamId,
        role: "admin",
      });

      return c.json({ id: teamId, name: name.trim(), number, season });
    } catch (error) {
      console.error("Failed to create team:", error);
      return c.json({ error: "Failed to create team" }, 500);
    }
  })
  .get("/:teamId", async (c) => {
    const user = c.get("user")!;
    const teamId = c.req.param("teamId");

    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, user.id),
        eq(teamMembers.teamId, teamId)
      ),
    });

    if (!membership) {
      return c.json({ error: "Not a team member", code: "not_a_member" }, 403);
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return c.json({ error: "Team not found" }, 404);
    }

    return c.json({
      ...team,
      role: membership.role,
    });
  });

// ============ Team Members Routes ============
const teamMembersRoutes = new Hono<{
  Variables: AuthVariables & TeamVariables;
}>()
  .use("*", teamMiddleware)
  .get("/", async (c) => {
    const teamId = c.get("teamId");

    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, teamId),
      with: { user: true },
    });

    return c.json(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
        },
      }))
    );
  })
  .post("/:memberId/role", async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");
    const teamRole = c.get("teamRole");
    const memberId = c.req.param("memberId");

    if (teamRole !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const newRole = body.role as TeamRole;

    if (!["admin", "mentor", "student"].includes(newRole)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    const targetMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return c.json({ error: "Member not found" }, 404);
    }

    if (targetMember.userId === user.id) {
      return c.json({ error: "Cannot change your own role" }, 400);
    }

    await db
      .update(teamMembers)
      .set({ role: newRole })
      .where(eq(teamMembers.id, memberId));

    return c.json({ success: true, role: newRole });
  })
  .delete("/:memberId", async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");
    const teamRole = c.get("teamRole");
    const memberId = c.req.param("memberId");

    if (teamRole !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const targetMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return c.json({ error: "Member not found" }, 404);
    }

    if (targetMember.userId === user.id) {
      return c.json({ error: "Cannot remove yourself" }, 400);
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    return c.json({ success: true });
  });

// ============ Parts Routes ============
const teamPartsRoutes = new Hono<{ Variables: AuthVariables & TeamVariables }>()
  .use("*", teamMiddleware)
  .get("/", async (c) => {
    const teamId = c.get("teamId");

    const sort = c.req.query("sort") || "name";
    const order = c.req.query("order") || "asc";
    const search = c.req.query("search") || "";
    const lowStock = c.req.query("lowStock") === "true";

    let query = db
      .select()
      .from(parts)
      .where(eq(parts.teamId, teamId))
      .$dynamic();

    if (search) {
      const escaped = escapeLikePattern(search);
      query = query.where(
        or(
          like(parts.name, `%${escaped}%`),
          like(parts.sku, `%${escaped}%`),
          like(parts.location, `%${escaped}%`)
        )
      );
    }

    if (lowStock) {
      query = query.where(
        sql`${parts.quantity} <= ${parts.reorderPoint} AND ${parts.reorderPoint} > 0`
      );
    }

    const sortColumn =
      sort === "quantity"
        ? parts.quantity
        : sort === "location"
          ? parts.location
          : sort === "sku"
            ? parts.sku
            : parts.name;

    query = query.orderBy(order === "desc" ? desc(sortColumn) : asc(sortColumn));

    const partsList = await query;

    const partsWithVendors = await Promise.all(
      partsList.map(async (part) => {
        if (part.vendorId) {
          const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, part.vendorId),
          });
          return { ...part, vendor };
        }
        return { ...part, vendor: null };
      })
    );

    return c.json(partsWithVendors);
  })
  .post("/", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const body = await c.req.json();

    const name = body.name?.trim();
    if (!name) {
      return c.json({ error: "Part name is required" }, 400);
    }

    try {
      const partId = crypto.randomUUID();

      await db.insert(parts).values({
        id: partId,
        teamId,
        name,
        sku: body.sku?.trim() || null,
        vendorId: body.vendorId || null,
        quantity: parseInt(body.quantity) || 0,
        reorderPoint: parseInt(body.reorderPoint) || 0,
        location: body.location?.trim() || null,
        unitPriceCents: Math.round((parseFloat(body.unitPrice) || 0) * 100),
        description: body.description?.trim() || null,
      });

      return c.json({ id: partId, name });
    } catch (error) {
      console.error("Failed to create part:", error);
      return c.json({ error: "Failed to create part" }, 500);
    }
  })
  .get("/:partId", async (c) => {
    const teamId = c.get("teamId");
    const partId = c.req.param("partId");

    const part = await db.query.parts.findFirst({
      where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    });

    if (!part) {
      return c.json({ error: "Part not found" }, 404);
    }

    const vendor = part.vendorId
      ? await db.query.vendors.findFirst({
          where: eq(vendors.id, part.vendorId),
        })
      : null;

    const bomUsage = await db.query.bomItems.findMany({
      where: and(eq(bomItems.partId, partId), eq(bomItems.teamId, teamId)),
    });

    const orderHistory = await db
      .select({
        orderId: orders.id,
        orderStatus: orders.status,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        createdAt: orders.createdAt,
        vendorName: vendors.name,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(and(eq(orderItems.partId, partId), eq(orders.teamId, teamId)))
      .orderBy(desc(orders.createdAt));

    return c.json({
      ...part,
      vendor,
      bomUsage,
      orderHistory,
    });
  })
  .put("/:partId", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const partId = c.req.param("partId");
    const body = await c.req.json();

    const name = body.name?.trim();
    if (!name) {
      return c.json({ error: "Part name is required" }, 400);
    }

    const existingPart = await db.query.parts.findFirst({
      where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    });

    if (!existingPart) {
      return c.json({ error: "Part not found" }, 404);
    }

    try {
      await db
        .update(parts)
        .set({
          name,
          sku: body.sku?.trim() || null,
          vendorId: body.vendorId || null,
          quantity: parseInt(body.quantity) || 0,
          reorderPoint: parseInt(body.reorderPoint) || 0,
          location: body.location?.trim() || null,
          unitPriceCents: Math.round((parseFloat(body.unitPrice) || 0) * 100),
          description: body.description?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, partId));

      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to update part:", error);
      return c.json({ error: "Failed to update part" }, 500);
    }
  })
  .delete("/:partId", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const partId = c.req.param("partId");

    const existingPart = await db.query.parts.findFirst({
      where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    });

    if (!existingPart) {
      return c.json({ error: "Part not found" }, 404);
    }

    try {
      await db.delete(parts).where(eq(parts.id, partId));
      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to delete part:", error);
      return c.json({ error: "Failed to delete part" }, 500);
    }
  });

// ============ Orders Routes ============
const teamOrdersRoutes = new Hono<{
  Variables: AuthVariables & TeamVariables;
}>()
  .use("*", teamMiddleware)
  .get("/", async (c) => {
    const teamId = c.get("teamId");
    const status = c.req.query("status");

    const query = db.query.orders.findMany({
      where: status
        ? and(
            eq(orders.teamId, teamId),
            eq(orders.status, status as OrderStatus)
          )
        : eq(orders.teamId, teamId),
      with: { vendor: true, items: { with: { part: true } } },
      orderBy: desc(orders.createdAt),
    });

    const ordersList = await query;

    return c.json(ordersList);
  })
  .post("/", async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");
    const body = await c.req.json();

    const { vendorId, items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Order must have at least one item" }, 400);
    }

    try {
      const orderId = crypto.randomUUID();

      await db.insert(orders).values({
        id: orderId,
        teamId,
        vendorId: vendorId || null,
        status: "draft",
        notes: notes?.trim() || null,
        createdById: user.id,
      });

      for (const item of items) {
        await db.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          partId: item.partId,
          quantity: parseInt(item.quantity) || 1,
          unitPriceCents: Math.round((parseFloat(item.unitPrice) || 0) * 100),
        });
      }

      return c.json({ id: orderId });
    } catch (error) {
      console.error("Failed to create order:", error);
      return c.json({ error: "Failed to create order" }, 500);
    }
  })
  .get("/:orderId", async (c) => {
    const teamId = c.get("teamId");
    const orderId = c.req.param("orderId");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.teamId, teamId)),
      with: { vendor: true, items: { with: { part: true } } },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order);
  })
  .put("/:orderId", async (c) => {
    const teamId = c.get("teamId");
    const orderId = c.req.param("orderId");
    const body = await c.req.json();

    const existingOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.teamId, teamId)),
    });

    if (!existingOrder) {
      return c.json({ error: "Order not found" }, 404);
    }

    try {
      await db
        .update(orders)
        .set({
          vendorId: body.vendorId || null,
          notes: body.notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to update order:", error);
      return c.json({ error: "Failed to update order" }, 500);
    }
  })
  .post("/:orderId/submit", async (c) => {
    const teamId = c.get("teamId");
    const orderId = c.req.param("orderId");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.teamId, teamId)),
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status !== "draft") {
      return c.json({ error: "Order is not in draft status" }, 400);
    }

    await db
      .update(orders)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return c.json({ success: true, status: "pending" });
  })
  .post("/:orderId/approve", requireMentor, async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");
    const orderId = c.req.param("orderId");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.teamId, teamId)),
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status !== "pending") {
      return c.json({ error: "Order is not pending approval" }, 400);
    }

    await db
      .update(orders)
      .set({
        status: "approved",
        approvedById: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return c.json({ success: true, status: "approved" });
  })
  .post("/:orderId/reject", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const orderId = c.req.param("orderId");
    const body = await c.req.json();

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.teamId, teamId)),
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status !== "pending") {
      return c.json({ error: "Order is not pending approval" }, 400);
    }

    await db
      .update(orders)
      .set({
        status: "rejected",
        rejectionReason: body.reason?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return c.json({ success: true, status: "rejected" });
  });

// ============ BOM Routes ============
const teamBomRoutes = new Hono<{ Variables: AuthVariables & TeamVariables }>()
  .use("*", teamMiddleware)
  .get("/", async (c) => {
    const teamId = c.get("teamId");

    const bomList = await db.query.bomItems.findMany({
      where: eq(bomItems.teamId, teamId),
      with: { part: true },
      orderBy: [asc(bomItems.subsystem), asc(bomItems.createdAt)],
    });

    return c.json(bomList);
  })
  .post("/", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const body = await c.req.json();

    const { partId, subsystem, quantityNeeded, notes } = body;

    if (!partId || !subsystem) {
      return c.json({ error: "Part and subsystem are required" }, 400);
    }

    try {
      const bomId = crypto.randomUUID();

      await db.insert(bomItems).values({
        id: bomId,
        teamId,
        partId,
        subsystem,
        quantityNeeded: parseInt(quantityNeeded) || 1,
        notes: notes?.trim() || null,
      });

      return c.json({ id: bomId });
    } catch (error) {
      console.error("Failed to create BOM item:", error);
      return c.json({ error: "Failed to create BOM item" }, 500);
    }
  })
  .put("/:itemId", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const itemId = c.req.param("itemId");
    const body = await c.req.json();

    const existingItem = await db.query.bomItems.findFirst({
      where: and(eq(bomItems.id, itemId), eq(bomItems.teamId, teamId)),
    });

    if (!existingItem) {
      return c.json({ error: "BOM item not found" }, 404);
    }

    try {
      await db
        .update(bomItems)
        .set({
          subsystem: body.subsystem,
          quantityNeeded: parseInt(body.quantityNeeded) || 1,
          notes: body.notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(bomItems.id, itemId));

      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to update BOM item:", error);
      return c.json({ error: "Failed to update BOM item" }, 500);
    }
  })
  .delete("/:itemId", requireMentor, async (c) => {
    const teamId = c.get("teamId");
    const itemId = c.req.param("itemId");

    const existingItem = await db.query.bomItems.findFirst({
      where: and(eq(bomItems.id, itemId), eq(bomItems.teamId, teamId)),
    });

    if (!existingItem) {
      return c.json({ error: "BOM item not found" }, 404);
    }

    try {
      await db.delete(bomItems).where(eq(bomItems.id, itemId));
      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to delete BOM item:", error);
      return c.json({ error: "Failed to delete BOM item" }, 500);
    }
  });

// ============ Vendors Routes ============
const vendorsRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const vendorsList = await db.query.vendors.findMany({
      where: eq(vendors.isGlobal, true),
      orderBy: asc(vendors.name),
    });

    return c.json(vendorsList);
  })
  .get("/:vendorId", async (c) => {
    const vendorId = c.req.param("vendorId");

    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, vendorId),
    });

    if (!vendor) {
      return c.json({ error: "Vendor not found" }, 404);
    }

    return c.json(vendor);
  });

// Team-scoped vendors
const teamVendorsRoutes = new Hono<{
  Variables: AuthVariables & TeamVariables;
}>()
  .use("*", teamMiddleware)
  .get("/", async (c) => {
    const teamId = c.get("teamId");

    const vendorsList = await db.query.vendors.findMany({
      where: or(eq(vendors.isGlobal, true), eq(vendors.teamId, teamId)),
      orderBy: asc(vendors.name),
    });

    return c.json(vendorsList);
  });

// ============ Compose API Routes ============
const apiRoutes = new Hono()
  .route("/api/user", userRoutes)
  .route("/api/teams", teamsRoutes)
  .route("/api/teams/:teamId/members", teamMembersRoutes)
  .route("/api/teams/:teamId/parts", teamPartsRoutes)
  .route("/api/teams/:teamId/orders", teamOrdersRoutes)
  .route("/api/teams/:teamId/bom", teamBomRoutes)
  .route("/api/teams/:teamId/vendors", teamVendorsRoutes)
  .route("/api/vendors", vendorsRoutes);

// Export type for Hono RPC client
export type ApiRoutes = typeof apiRoutes;

export default apiRoutes;
