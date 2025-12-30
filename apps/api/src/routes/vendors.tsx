import { Hono } from "hono";
import { Layout } from "../components/Layout";
import { db } from "../db";
import { vendors } from "../db/schema";
import { asc, desc, eq } from "drizzle-orm";

const app = new Hono();

// Vendors list page (public, read-only)
app.get("/vendors", async (c) => {
  // Query params for sorting
  const sort = c.req.query("sort") || "name";
  const order = c.req.query("order") || "asc";

  // Build query - only show global vendors
  let query = db
    .select()
    .from(vendors)
    .where(eq(vendors.isGlobal, true))
    .$dynamic();

  // Add sorting
  const sortColumn =
    sort === "leadTime" ? vendors.avgLeadTimeDays : vendors.name;

  query = query.orderBy(order === "desc" ? desc(sortColumn) : asc(sortColumn));

  const vendorsList = await query;

  return c.html(
    <Layout title="Vendor Directory">
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/" class="text-xl font-bold text-gray-900">
                BuildSeason
              </a>
              <span class="text-gray-300">/</span>
              <span class="text-gray-600">Vendor Directory</span>
            </div>
            <div class="flex items-center gap-4">
              <a
                href="/login"
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign in
              </a>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto py-8 px-4">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                FTC Vendor Directory
              </h1>
              <p class="text-gray-600">
                {vendorsList.length} verified suppliers for FTC teams
              </p>
            </div>
          </div>

          {/* Sorting controls */}
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <form class="flex flex-wrap gap-4 items-end">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  name="sort"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name" selected={sort === "name"}>
                    Vendor Name
                  </option>
                  <option value="leadTime" selected={sort === "leadTime"}>
                    Lead Time
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
              <button
                type="submit"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Vendors table */}
          {vendorsList.length === 0 ? (
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                No vendors found
              </h2>
              <p class="text-gray-600">Check back later for vendor listings.</p>
            </div>
          ) : (
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Time (Days)
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {vendorsList.map((vendor) => {
                    return (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </div>
                          {vendor.notes && (
                            <div class="text-sm text-gray-500">
                              {vendor.notes.substring(0, 60)}
                              {vendor.notes.length > 60 ? "..." : ""}
                            </div>
                          )}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          {vendor.website ? (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Visit site
                            </a>
                          ) : (
                            <span class="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="text-sm text-gray-900">
                            {vendor.avgLeadTimeDays !== null
                              ? `${vendor.avgLeadTimeDays} days`
                              : "-"}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a
                            href={`/vendors/${vendor.id}`}
                            class="text-blue-600 hover:text-blue-900"
                          >
                            View Details
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

// Vendor detail page (public, read-only)
app.get("/vendors/:vendorId", async (c) => {
  const vendorId = c.req.param("vendorId");

  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.id, vendorId),
  });

  if (!vendor) {
    return c.redirect("/vendors?error=not_found");
  }

  return c.html(
    <Layout title={`${vendor.name} - Vendor Directory`}>
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/" class="text-xl font-bold text-gray-900">
                BuildSeason
              </a>
              <span class="text-gray-300">/</span>
              <a href="/vendors" class="text-gray-600 hover:text-gray-900">
                Vendor Directory
              </a>
            </div>
            <div class="flex items-center gap-4">
              <a
                href="/login"
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign in
              </a>
            </div>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="mb-6">
            <a
              href="/vendors"
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
              Back to Vendor Directory
            </a>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h1 class="text-2xl font-bold text-gray-900">{vendor.name}</h1>
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  {vendor.website}
                </a>
              )}
            </div>

            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt class="text-sm font-medium text-gray-500">
                    Average Lead Time
                  </dt>
                  <dd class="mt-1 text-lg text-gray-900">
                    {vendor.avgLeadTimeDays !== null
                      ? `${vendor.avgLeadTimeDays} days`
                      : "Not specified"}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Website</dt>
                  <dd class="mt-1 text-lg">
                    {vendor.website ? (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        Visit website
                      </a>
                    ) : (
                      <span class="text-gray-500">Not available</span>
                    )}
                  </dd>
                </div>
              </div>

              {vendor.notes && (
                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-2">
                    Description
                  </dt>
                  <dd class="text-gray-900">{vendor.notes}</dd>
                </div>
              )}

              <div class="pt-4 border-t border-gray-200">
                <p class="text-sm text-gray-500">
                  This is a verified FTC supplier. Lead times are estimates and
                  may vary based on availability and location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default app;
