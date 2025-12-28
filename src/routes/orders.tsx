import { Hono } from "hono";
import { Layout } from "../components/Layout";
import {
  requireAuth,
  teamMiddleware,
  type AuthVariables,
  type TeamVariables,
} from "../middleware/auth";
import { db } from "../db";
import { orders, teams, vendors, users } from "../db/schema";
import type { OrderStatus } from "../db/schema";
import { eq, desc, and, count } from "drizzle-orm";

const app = new Hono<{ Variables: AuthVariables & TeamVariables }>();

// Apply auth middleware
app.use("*", requireAuth);

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-800" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  approved: { bg: "bg-blue-100", text: "text-blue-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
  ordered: { bg: "bg-purple-100", text: "text-purple-800" },
  received: { bg: "bg-green-100", text: "text-green-800" },
};

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
  received: "Received",
};

// Orders list page
app.get("/teams/:teamId/orders", teamMiddleware, async (c) => {
  const user = c.get("user")!;
  const teamId = c.get("teamId");
  const teamRole = c.get("teamRole");

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  // Filter by status
  const statusFilter = c.req.query("status") as OrderStatus | undefined;

  // Get orders with vendor info
  let orderQuery = db
    .select({
      order: orders,
      vendor: vendors,
      createdBy: users,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .leftJoin(users, eq(orders.createdById, users.id))
    .where(eq(orders.teamId, teamId))
    .orderBy(desc(orders.createdAt))
    .$dynamic();

  if (statusFilter) {
    orderQuery = orderQuery.where(
      and(eq(orders.teamId, teamId), eq(orders.status, statusFilter))
    );
  }

  const ordersList = await orderQuery;

  // Get order counts by status
  const statusCounts = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(eq(orders.teamId, teamId))
    .groupBy(orders.status);

  const countsByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s.count])
  ) as Record<OrderStatus, number>;

  // Calculate totals
  const totalValue = ordersList.reduce(
    (sum, o) => sum + (o.order.totalCents || 0),
    0
  );

  const canCreate = teamRole === "admin" || teamRole === "mentor";

  return c.html(
    <Layout title={`Orders - ${team.name}`}>
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/dashboard" class="text-xl font-bold text-gray-900">
                BuildSeason
              </a>
              <span class="text-gray-300">/</span>
              <a
                href={`/teams/${team.id}`}
                class="text-gray-600 hover:text-gray-900"
              >
                {team.name}
              </a>
              <span class="text-gray-300">/</span>
              <span class="text-gray-600">Orders</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <form action="/api/auth/sign-out" method="post">
                <button
                  type="submit"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto py-8 px-4">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
              <p class="text-gray-600">
                {ordersList.length} orders &middot; $
                {(totalValue / 100).toFixed(2)} total
              </p>
            </div>
            {canCreate && (
              <a
                href={`/teams/${team.id}/orders/new`}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                New Order
              </a>
            )}
          </div>

          {/* Status filter tabs */}
          <div class="bg-white rounded-lg shadow mb-6">
            <div class="border-b border-gray-200">
              <nav class="flex -mb-px overflow-x-auto">
                <a
                  href={`/teams/${team.id}/orders`}
                  class={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    !statusFilter
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All ({ordersList.length})
                </a>
                {(
                  [
                    "draft",
                    "pending",
                    "approved",
                    "rejected",
                    "ordered",
                    "received",
                  ] as OrderStatus[]
                ).map((status) => (
                  <a
                    href={`/teams/${team.id}/orders?status=${status}`}
                    class={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                      statusFilter === status
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {statusLabels[status]} ({countsByStatus[status] || 0})
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Orders list */}
          {ordersList.length === 0 ? (
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <div class="text-gray-400 mb-4">
                <svg
                  class="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p class="text-gray-600 mb-6">
                {statusFilter
                  ? `No ${statusLabels[statusFilter].toLowerCase()} orders.`
                  : "Create your first order to get started."}
              </p>
              {canCreate && !statusFilter && (
                <a
                  href={`/teams/${team.id}/orders/new`}
                  class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Order
                </a>
              )}
            </div>
          ) : (
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {ordersList.map(({ order, vendor, createdBy }) => {
                    const colors = statusColors[order.status];
                    return (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">
                            Order #{order.id.substring(0, 8)}
                          </div>
                          <div class="text-sm text-gray-500">
                            by {createdBy?.name || "Unknown"}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vendor?.name || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(order.totalCents / 100).toFixed(2)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt.toLocaleDateString()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a
                            href={`/teams/${team.id}/orders/${order.id}`}
                            class="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});

export default app;
