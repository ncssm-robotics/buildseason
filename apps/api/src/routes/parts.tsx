import { Hono } from "hono";
import { Layout } from "../components/Layout";
import { SignOutButton } from "../components/SocialAuth";
import {
  requireAuth,
  teamMiddleware,
  type AuthVariables,
  type TeamVariables,
} from "../middleware/auth";
import { db } from "../db";
import {
  parts,
  teams,
  orderItems,
  orders,
  vendors,
  bomItems,
} from "../db/schema";
import { eq, asc, desc, sql, like, or, and } from "drizzle-orm";
import { requireMentor } from "../middleware/auth";

const app = new Hono<{ Variables: AuthVariables & TeamVariables }>();

// Escape SQL LIKE wildcards to prevent pattern injection
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

// Apply auth to /teams/* routes only (not globally to avoid catching /api/auth/*)
app.use("/teams/*", requireAuth);

// Parts list page
app.get("/teams/:teamId/parts", teamMiddleware, async (c) => {
  const user = c.get("user")!;
  const teamId = c.get("teamId");
  const teamRole = c.get("teamRole");

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  // Query params for sorting and filtering
  const sort = c.req.query("sort") || "name";
  const order = c.req.query("order") || "asc";
  const search = c.req.query("search") || "";
  const lowStock = c.req.query("lowStock") === "true";

  // Build query
  let query = db
    .select()
    .from(parts)
    .where(eq(parts.teamId, teamId))
    .$dynamic();

  // Add search filter (escape wildcards to prevent LIKE pattern injection)
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

  // Add low stock filter
  if (lowStock) {
    query = query.where(
      sql`${parts.quantity} <= ${parts.reorderPoint} AND ${parts.reorderPoint} > 0`
    );
  }

  // Add sorting
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

  // Get vendors for display
  const partsWithVendors = await Promise.all(
    partsList.map(async (part) => {
      if (part.vendorId) {
        const vendor = await db.query.vendors.findFirst({
          where: (v, { eq }) => eq(v.id, part.vendorId!),
        });
        return { ...part, vendor };
      }
      return { ...part, vendor: null };
    })
  );

  // Count low stock items
  const lowStockCount = partsList.filter(
    (p) => p.reorderPoint && p.quantity <= p.reorderPoint
  ).length;

  const canEdit = teamRole === "admin" || teamRole === "mentor";

  return c.html(
    <Layout title={`Parts - ${team.name}`}>
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
              <span class="text-gray-600">Parts</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto py-8 px-4">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Parts Inventory</h1>
              <p class="text-gray-600">
                {partsList.length} parts
                {lowStockCount > 0 && (
                  <span class="text-orange-600 ml-2">
                    ({lowStockCount} low stock)
                  </span>
                )}
              </p>
            </div>
            {canEdit && (
              <a
                href={`/teams/${team.id}/parts/new`}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Part
              </a>
            )}
          </div>

          {/* Filters */}
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <form class="flex flex-wrap gap-4 items-end">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  name="search"
                  value={search}
                  placeholder="Name, SKU, or location..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  name="sort"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name" selected={sort === "name"}>
                    Name
                  </option>
                  <option value="sku" selected={sort === "sku"}>
                    SKU
                  </option>
                  <option value="quantity" selected={sort === "quantity"}>
                    Quantity
                  </option>
                  <option value="location" selected={sort === "location"}>
                    Location
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  name="order"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc" selected={order === "asc"}>
                    Ascending
                  </option>
                  <option value="desc" selected={order === "desc"}>
                    Descending
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowStock"
                  name="lowStock"
                  value="true"
                  checked={lowStock}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="lowStock" class="text-sm text-gray-700">
                  Low stock only
                </label>
              </div>
              <button
                type="submit"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Parts table */}
          {partsList.length === 0 ? (
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                No parts yet
              </h2>
              <p class="text-gray-600 mb-6">
                {search || lowStock
                  ? "No parts match your filters."
                  : "Start by adding parts to your inventory."}
              </p>
              {canEdit && !search && !lowStock && (
                <a
                  href={`/teams/${team.id}/parts/new`}
                  class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First Part
                </a>
              )}
            </div>
          ) : (
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {partsWithVendors.map((part) => {
                    const isLowStock =
                      part.reorderPoint && part.quantity <= part.reorderPoint;
                    return (
                      <tr
                        class={isLowStock ? "bg-orange-50" : "hover:bg-gray-50"}
                      >
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div>
                              <div class="text-sm font-medium text-gray-900">
                                {part.name}
                              </div>
                              {part.description && (
                                <div class="text-sm text-gray-500">
                                  {part.description.substring(0, 50)}
                                  {part.description.length > 50 ? "..." : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.sku || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.vendor?.name || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center gap-2">
                            <span
                              class={`text-sm font-medium ${isLowStock ? "text-orange-600" : "text-gray-900"}`}
                            >
                              {part.quantity}
                            </span>
                            {isLowStock && (
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Low
                              </span>
                            )}
                          </div>
                          {part.reorderPoint && (
                            <div class="text-xs text-gray-400">
                              Reorder at {part.reorderPoint}
                            </div>
                          )}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.location || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a
                            href={`/teams/${team.id}/parts/${part.id}`}
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

// Add part form
app.get(
  "/teams/:teamId/parts/new",
  teamMiddleware,
  requireMentor,
  async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return c.redirect("/dashboard?error=team_not_found");
    }

    // Get available vendors (global + team-specific)
    const availableVendors = await db.query.vendors.findMany({
      where: or(eq(vendors.isGlobal, true), eq(vendors.teamId, teamId)),
      orderBy: asc(vendors.name),
    });

    return c.html(
      <Layout title={`Add Part - ${team.name}`}>
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
                <a
                  href={`/teams/${team.id}/parts`}
                  class="text-gray-600 hover:text-gray-900"
                >
                  Parts
                </a>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">{user.name}</span>
                <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
              </div>
            </div>
          </nav>

          <div class="max-w-2xl mx-auto py-8 px-4">
            <div class="mb-6">
              <a
                href={`/teams/${team.id}/parts`}
                class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Parts
              </a>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h1 class="text-2xl font-bold text-gray-900 mb-6">
                Add New Part
              </h1>

              <form
                hx-post={`/teams/${team.id}/parts`}
                hx-target="#form-result"
                hx-swap="innerHTML"
                class="space-y-6"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Part Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="e.g., goBILDA 5202 Motor"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="sku"
                      class="block text-sm font-medium text-gray-700"
                    >
                      SKU / Part Number
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      placeholder="e.g., 5202-0002-0027"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="vendorId"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Vendor
                    </label>
                    <select
                      id="vendorId"
                      name="vendorId"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select vendor...</option>
                      {availableVendors.map((v) => (
                        <option value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      for="quantity"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      required
                      min="0"
                      value="0"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="reorderPoint"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      id="reorderPoint"
                      name="reorderPoint"
                      min="0"
                      placeholder="0"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p class="mt-1 text-xs text-gray-500">
                      Alert when quantity drops to this level
                    </p>
                  </div>

                  <div>
                    <label
                      for="location"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Storage Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      placeholder="e.g., Bin A3"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="unitPrice"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div class="col-span-2">
                    <label
                      for="description"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="Optional notes about this part..."
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>

                <div id="form-result"></div>

                <div class="flex gap-4">
                  <button
                    type="submit"
                    class="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Add Part</span>
                    <span class="htmx-indicator">
                      <svg
                        class="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  </button>
                  <a
                    href={`/teams/${team.id}/parts`}
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
);

// Create part POST handler
app.post("/teams/:teamId/parts", teamMiddleware, requireMentor, async (c) => {
  const teamId = c.get("teamId");
  const body = await c.req.parseBody();

  const name = (body.name as string)?.trim();
  const sku = (body.sku as string)?.trim() || null;
  const vendorId = (body.vendorId as string) || null;
  const quantity = parseInt(body.quantity as string) || 0;
  const reorderPoint = parseInt(body.reorderPoint as string) || 0;
  const location = (body.location as string)?.trim() || null;
  const unitPrice = parseFloat(body.unitPrice as string) || 0;
  const description = (body.description as string)?.trim() || null;

  if (!name) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">Part name is required.</p>
      </div>
    );
  }

  try {
    const partId = crypto.randomUUID();

    await db.insert(parts).values({
      id: partId,
      teamId,
      name,
      sku,
      vendorId: vendorId || null,
      quantity,
      reorderPoint,
      location,
      unitPriceCents: Math.round(unitPrice * 100),
      description,
    });

    c.header("HX-Redirect", `/teams/${teamId}/parts/${partId}`);
    return c.html(<div>Redirecting...</div>);
  } catch (error) {
    console.error("Failed to create part:", error);
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          Failed to create part. Please try again.
        </p>
      </div>
    );
  }
});

// Part detail page
app.get("/teams/:teamId/parts/:partId", teamMiddleware, async (c) => {
  const user = c.get("user")!;
  const teamId = c.get("teamId");
  const teamRole = c.get("teamRole");
  const partId = c.req.param("partId");

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  const part = await db.query.parts.findFirst({
    where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
  });

  if (!team || !part) {
    return c.redirect(`/teams/${teamId}/parts?error=not_found`);
  }

  const vendor = part.vendorId
    ? await db.query.vendors.findFirst({
        where: eq(vendors.id, part.vendorId),
      })
    : null;

  const canEdit = teamRole === "admin" || teamRole === "mentor";

  return c.html(
    <Layout title={`${part.name} - ${team.name}`}>
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
              <a
                href={`/teams/${team.id}/parts`}
                class="text-gray-600 hover:text-gray-900"
              >
                Parts
              </a>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="mb-6">
            <a
              href={`/teams/${team.id}/parts`}
              class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Parts
            </a>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{part.name}</h1>
                {part.sku && <p class="text-gray-500">SKU: {part.sku}</p>}
              </div>
              {canEdit && (
                <a
                  href={`/teams/${team.id}/parts/${part.id}/edit`}
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Edit Part
                </a>
              )}
            </div>

            <div class="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <dt class="text-sm font-medium text-gray-500">Quantity</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">
                  {part.quantity}
                  {part.reorderPoint && part.quantity <= part.reorderPoint && (
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Low Stock
                    </span>
                  )}
                </dd>
                {part.reorderPoint ? (
                  <dd class="text-sm text-gray-500">
                    Reorder at {part.reorderPoint}
                  </dd>
                ) : null}
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">Vendor</dt>
                <dd class="mt-1 text-lg text-gray-900">
                  {vendor?.name || "-"}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">Location</dt>
                <dd class="mt-1 text-lg text-gray-900">
                  {part.location || "-"}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">Unit Price</dt>
                <dd class="mt-1 text-lg text-gray-900">
                  {part.unitPriceCents
                    ? `$${(part.unitPriceCents / 100).toFixed(2)}`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">Total Value</dt>
                <dd class="mt-1 text-lg text-gray-900">
                  {part.unitPriceCents
                    ? `$${((part.unitPriceCents * part.quantity) / 100).toFixed(2)}`
                    : "-"}
                </dd>
              </div>

              {part.description && (
                <div class="col-span-2 md:col-span-3">
                  <dt class="text-sm font-medium text-gray-500">Description</dt>
                  <dd class="mt-1 text-gray-900">{part.description}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// Edit part form
app.get(
  "/teams/:teamId/parts/:partId/edit",
  teamMiddleware,
  requireMentor,
  async (c) => {
    const user = c.get("user")!;
    const teamId = c.get("teamId");
    const partId = c.req.param("partId");

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    const part = await db.query.parts.findFirst({
      where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    });

    if (!team || !part) {
      return c.redirect(`/teams/${teamId}/parts?error=not_found`);
    }

    const availableVendors = await db.query.vendors.findMany({
      where: or(eq(vendors.isGlobal, true), eq(vendors.teamId, teamId)),
      orderBy: asc(vendors.name),
    });

    return c.html(
      <Layout title={`Edit ${part.name} - ${team.name}`}>
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
                <a
                  href={`/teams/${team.id}/parts`}
                  class="text-gray-600 hover:text-gray-900"
                >
                  Parts
                </a>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">{user.name}</span>
                <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
              </div>
            </div>
          </nav>

          <div class="max-w-2xl mx-auto py-8 px-4">
            <div class="mb-6">
              <a
                href={`/teams/${team.id}/parts/${part.id}`}
                class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Part
              </a>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h1 class="text-2xl font-bold text-gray-900 mb-6">Edit Part</h1>

              <form
                hx-put={`/teams/${team.id}/parts/${part.id}`}
                hx-target="#form-result"
                hx-swap="innerHTML"
                class="space-y-6"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Part Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={part.name}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="sku"
                      class="block text-sm font-medium text-gray-700"
                    >
                      SKU / Part Number
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={part.sku || ""}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="vendorId"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Vendor
                    </label>
                    <select
                      id="vendorId"
                      name="vendorId"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select vendor...</option>
                      {availableVendors.map((v) => (
                        <option value={v.id} selected={v.id === part.vendorId}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      for="quantity"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      required
                      min="0"
                      value={part.quantity}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="reorderPoint"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      id="reorderPoint"
                      name="reorderPoint"
                      min="0"
                      value={part.reorderPoint || ""}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="location"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Storage Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={part.location || ""}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="unitPrice"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      min="0"
                      step="0.01"
                      value={
                        part.unitPriceCents
                          ? (part.unitPriceCents / 100).toFixed(2)
                          : ""
                      }
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div class="col-span-2">
                    <label
                      for="description"
                      class="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {part.description || ""}
                    </textarea>
                  </div>
                </div>

                <div id="form-result"></div>

                <div class="flex gap-4">
                  <button
                    type="submit"
                    class="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Save Changes</span>
                    <span class="htmx-indicator">
                      <svg
                        class="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  </button>
                  <a
                    href={`/teams/${team.id}/parts/${part.id}`}
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
);

// Update part PUT handler
app.put(
  "/teams/:teamId/parts/:partId",
  teamMiddleware,
  requireMentor,
  async (c) => {
    const teamId = c.get("teamId");
    const partId = c.req.param("partId");
    const body = await c.req.parseBody();

    const name = (body.name as string)?.trim();
    const sku = (body.sku as string)?.trim() || null;
    const vendorId = (body.vendorId as string) || null;
    const quantity = parseInt(body.quantity as string) || 0;
    const reorderPoint = parseInt(body.reorderPoint as string) || 0;
    const location = (body.location as string)?.trim() || null;
    const unitPrice = parseFloat(body.unitPrice as string) || 0;
    const description = (body.description as string)?.trim() || null;

    if (!name) {
      return c.html(
        <div class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">Part name is required.</p>
        </div>
      );
    }

    // Verify part belongs to team
    const existingPart = await db.query.parts.findFirst({
      where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    });

    if (!existingPart) {
      return c.html(
        <div class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">Part not found.</p>
        </div>
      );
    }

    try {
      await db
        .update(parts)
        .set({
          name,
          sku,
          vendorId: vendorId || null,
          quantity,
          reorderPoint,
          location,
          unitPriceCents: Math.round(unitPrice * 100),
          description,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, partId));

      c.header("HX-Redirect", `/teams/${teamId}/parts/${partId}`);
      return c.html(<div>Redirecting...</div>);
    } catch (error) {
      console.error("Failed to update part:", error);
      return c.html(
        <div class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">
            Failed to update part. Please try again.
          </p>
        </div>
      );
    }
  }
);

// Part detail page
app.get("/teams/:teamId/parts/:partId", teamMiddleware, async (c) => {
  const user = c.get("user")!;
  const teamId = c.get("teamId");
  const teamRole = c.get("teamRole");
  const partId = c.req.param("partId");

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  const part = await db.query.parts.findFirst({
    where: and(eq(parts.id, partId), eq(parts.teamId, teamId)),
    with: { vendor: true },
  });

  if (!part) {
    return c.redirect(`/teams/${teamId}/parts?error=part_not_found`);
  }

  // Get order history for this part
  const orderHistory = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      orderedAt: orders.orderedAt,
      receivedAt: orders.receivedAt,
      createdAt: orders.createdAt,
      vendorName: vendors.name,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(and(eq(orderItems.partId, partId), eq(orders.teamId, teamId)))
    .orderBy(desc(orders.createdAt));

  // Get BOM usage for this part
  const bomUsage = await db.query.bomItems.findMany({
    where: and(eq(bomItems.partId, partId), eq(bomItems.teamId, teamId)),
  });

  const totalNeeded = bomUsage.reduce((sum, b) => sum + b.quantityNeeded, 0);
  const canEdit = teamRole === "admin" || teamRole === "mentor";
  const isLowStock = part.reorderPoint && part.quantity <= part.reorderPoint;

  return c.html(
    <Layout title={`${part.name} - ${team.name}`}>
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
              <a
                href={`/teams/${team.id}/parts`}
                class="text-gray-600 hover:text-gray-900"
              >
                Parts
              </a>
              <span class="text-gray-300">/</span>
              <span class="text-gray-600">{part.name}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto py-8 px-4">
          {/* Part Header */}
          <div class="bg-white rounded-lg shadow mb-6">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{part.name}</h1>
                {part.sku && <p class="text-gray-500">SKU: {part.sku}</p>}
              </div>
              <div class="flex gap-2">
                {canEdit && (
                  <a
                    href={`/teams/${teamId}/parts/${partId}/edit`}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Edit Part
                  </a>
                )}
              </div>
            </div>

            <div class="p-6">
              {/* Stats Row */}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                  class={`p-4 rounded-lg ${isLowStock ? "bg-orange-50 border border-orange-200" : "bg-gray-50"}`}
                >
                  <div
                    class={`text-2xl font-bold ${isLowStock ? "text-orange-600" : "text-gray-900"}`}
                  >
                    {part.quantity}
                  </div>
                  <div class="text-sm text-gray-500">In Stock</div>
                  {isLowStock && (
                    <div class="text-xs text-orange-600 mt-1">Low stock!</div>
                  )}
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-gray-900">
                    {totalNeeded}
                  </div>
                  <div class="text-sm text-gray-500">Needed (BOM)</div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-gray-900">
                    {part.reorderPoint || 0}
                  </div>
                  <div class="text-sm text-gray-500">Reorder Point</div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-gray-900">
                    {part.unitPriceCents
                      ? `$${(part.unitPriceCents / 100).toFixed(2)}`
                      : "-"}
                  </div>
                  <div class="text-sm text-gray-500">Unit Price</div>
                </div>
              </div>

              {/* Details Grid */}
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-sm font-medium text-gray-500 mb-2">
                    Description
                  </h3>
                  <p class="text-gray-900">
                    {part.description || "No description"}
                  </p>
                </div>

                <div>
                  <h3 class="text-sm font-medium text-gray-500 mb-2">
                    Location
                  </h3>
                  <p class="text-gray-900">
                    {part.location || "Not specified"}
                  </p>
                </div>

                <div>
                  <h3 class="text-sm font-medium text-gray-500 mb-2">Vendor</h3>
                  <p class="text-gray-900">
                    {part.vendor ? (
                      <a
                        href={`/vendors/${part.vendor.id}`}
                        class="text-blue-600 hover:text-blue-800"
                      >
                        {part.vendor.name}
                      </a>
                    ) : (
                      "Not specified"
                    )}
                  </p>
                </div>

                <div>
                  <h3 class="text-sm font-medium text-gray-500 mb-2">
                    Last Updated
                  </h3>
                  <p class="text-gray-900">
                    {part.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BOM Usage */}
          {bomUsage.length > 0 && (
            <div class="bg-white rounded-lg shadow mb-6">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">BOM Usage</h2>
              </div>
              <div class="p-6">
                <div class="space-y-2">
                  {bomUsage.map((bom) => (
                    <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span class="text-gray-900 capitalize">
                        {bom.subsystem}
                      </span>
                      <span class="text-gray-600">
                        {bom.quantityNeeded} needed
                      </span>
                    </div>
                  ))}
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between font-medium">
                  <span>Total Needed</span>
                  <span>{totalNeeded}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order History */}
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Order History</h2>
            </div>
            {orderHistory.length === 0 ? (
              <div class="p-6 text-center text-gray-500">
                No order history for this part
              </div>
            ) : (
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendor
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {orderHistory.map((order) => {
                    const statusColors: Record<string, string> = {
                      draft: "bg-gray-100 text-gray-800",
                      pending: "bg-yellow-100 text-yellow-800",
                      approved: "bg-blue-100 text-blue-800",
                      rejected: "bg-red-100 text-red-800",
                      ordered: "bg-purple-100 text-purple-800",
                      received: "bg-green-100 text-green-800",
                    };

                    return (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-gray-900">
                          <a
                            href={`/teams/${teamId}/orders/${order.orderId}`}
                            class="text-blue-600 hover:text-blue-800"
                          >
                            {order.createdAt?.toLocaleDateString() || "-"}
                          </a>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          {order.vendorName || "-"}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900 text-center">
                          {order.quantity}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900 text-right">
                          $
                          {(
                            (order.quantity * order.unitPriceCents) /
                            100
                          ).toFixed(2)}
                        </td>
                        <td class="px-6 py-4 text-center">
                          <span
                            class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-800"}`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default app;
