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
import { bomItems, teams, type Subsystem } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<{ Variables: AuthVariables & TeamVariables }>();

// Apply auth middleware
app.use("*", requireAuth);

// Subsystem display names and colors
const subsystemConfig: Record<
  Subsystem,
  { name: string; color: string; bg: string }
> = {
  drivetrain: { name: "Drivetrain", color: "text-blue-800", bg: "bg-blue-100" },
  intake: { name: "Intake", color: "text-green-800", bg: "bg-green-100" },
  lift: { name: "Lift", color: "text-purple-800", bg: "bg-purple-100" },
  scoring: { name: "Scoring", color: "text-orange-800", bg: "bg-orange-100" },
  electronics: { name: "Electronics", color: "text-red-800", bg: "bg-red-100" },
  hardware: { name: "Hardware", color: "text-gray-800", bg: "bg-gray-100" },
  other: { name: "Other", color: "text-slate-800", bg: "bg-slate-100" },
};

// BOM list page grouped by subsystem
app.get("/teams/:teamId/bom", teamMiddleware, async (c) => {
  const user = c.get("user")!;
  const teamId = c.get("teamId");
  const teamRole = c.get("teamRole");

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  // Get all BOM items with their parts
  const items = await db.query.bomItems.findMany({
    where: eq(bomItems.teamId, teamId),
    with: { part: true },
  });

  // Group by subsystem
  const grouped = items.reduce(
    (acc, item) => {
      const subsystem = item.subsystem as Subsystem;
      if (!acc[subsystem]) {
        acc[subsystem] = [];
      }
      acc[subsystem].push(item);
      return acc;
    },
    {} as Record<Subsystem, typeof items>
  );

  // Order subsystems
  const orderedSubsystems: Subsystem[] = [
    "drivetrain",
    "intake",
    "lift",
    "scoring",
    "electronics",
    "hardware",
    "other",
  ];

  const canEdit = teamRole === "admin" || teamRole === "mentor";

  // Calculate totals
  const totalItems = items.length;
  const totalNeeded = items.reduce((sum, i) => sum + i.quantityNeeded, 0);
  const totalOnHand = items.reduce(
    (sum, i) => sum + (i.part?.quantity || 0),
    0
  );
  const shortages = items.filter(
    (i) => (i.part?.quantity || 0) < i.quantityNeeded
  ).length;

  return c.html(
    <Layout title={`BOM - ${team.name}`}>
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
              <span class="text-gray-600">Bill of Materials</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto py-8 px-4">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Bill of Materials
              </h1>
              <p class="text-gray-600">
                {totalItems} items across {Object.keys(grouped).length}{" "}
                subsystems
              </p>
            </div>
            {canEdit && (
              <a
                href={`/teams/${team.id}/bom/new`}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add BOM Item
              </a>
            )}
          </div>

          {/* Summary Cards */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div class="text-sm text-gray-500">BOM Items</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-gray-900">{totalNeeded}</div>
              <div class="text-sm text-gray-500">Total Needed</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-gray-900">{totalOnHand}</div>
              <div class="text-sm text-gray-500">On Hand</div>
            </div>
            <div
              class={`rounded-lg shadow p-4 ${shortages > 0 ? "bg-red-50" : "bg-white"}`}
            >
              <div
                class={`text-2xl font-bold ${shortages > 0 ? "text-red-600" : "text-gray-900"}`}
              >
                {shortages}
              </div>
              <div class="text-sm text-gray-500">Shortages</div>
            </div>
          </div>

          {items.length === 0 ? (
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
                No BOM items yet
              </h2>
              <p class="text-gray-600 mb-6">
                Add parts to your Bill of Materials to track what you need for
                your robot build.
              </p>
              {canEdit && (
                <a
                  href={`/teams/${team.id}/bom/new`}
                  class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First BOM Item
                </a>
              )}
            </div>
          ) : (
            <div class="space-y-6">
              {orderedSubsystems.map((subsystem) => {
                const subsystemItems = grouped[subsystem];
                if (!subsystemItems || subsystemItems.length === 0) return null;

                const config = subsystemConfig[subsystem];
                const subsystemShortages = subsystemItems.filter(
                  (i) => (i.part?.quantity || 0) < i.quantityNeeded
                ).length;

                return (
                  <div
                    class="bg-white rounded-lg shadow overflow-hidden"
                    x-data="{ open: true }"
                  >
                    {/* Subsystem Header - Collapsible */}
                    <button
                      type="button"
                      class="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                      x-on:click="open = !open"
                    >
                      <div class="flex items-center gap-3">
                        <span
                          class={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
                        >
                          {config.name}
                        </span>
                        <span class="text-gray-500">
                          {subsystemItems.length} item
                          {subsystemItems.length !== 1 ? "s" : ""}
                        </span>
                        {subsystemShortages > 0 && (
                          <span class="text-xs text-red-600 font-medium">
                            {subsystemShortages} shortage
                            {subsystemShortages !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <svg
                        class="w-5 h-5 text-gray-400 transition-transform"
                        x-bind:class="{ 'rotate-180': open }"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Items Table */}
                    <div x-show="open" x-collapse>
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Part
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Needed
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              On Hand
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {subsystemItems.map((item) => {
                            const onHand = item.part?.quantity || 0;
                            const needed = item.quantityNeeded;
                            const isShort = onHand < needed;
                            const isFull = onHand >= needed;

                            return (
                              <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                  <div>
                                    <a
                                      href={`/teams/${teamId}/parts/${item.partId}`}
                                      class="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      {item.part?.name || "Unknown Part"}
                                    </a>
                                    {item.part?.sku && (
                                      <div class="text-xs text-gray-500">
                                        SKU: {item.part.sku}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                  <span class="text-sm font-medium text-gray-900">
                                    {needed}
                                  </span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                  <span
                                    class={`text-sm font-medium ${isShort ? "text-red-600" : "text-gray-900"}`}
                                  >
                                    {onHand}
                                  </span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                  {isFull ? (
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg
                                        class="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fill-rule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clip-rule="evenodd"
                                        />
                                      </svg>
                                      OK
                                    </span>
                                  ) : (
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Need {needed - onHand}
                                    </span>
                                  )}
                                </td>
                                <td class="px-6 py-4">
                                  <span class="text-sm text-gray-500 truncate max-w-xs">
                                    {item.notes || "-"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});

export default app;
