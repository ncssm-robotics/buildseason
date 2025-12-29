import { Hono } from "hono";
import { Layout } from "../components/Layout";
import { SignOutButton } from "../components/SocialAuth";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import { db } from "../db";
import {
  teams,
  teamMembers,
  teamInvites,
  parts,
  orders,
  type TeamRole,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

const app = new Hono<{ Variables: AuthVariables }>();

// Apply auth to all team routes
app.use("*", requireAuth);

// Dashboard - show user's teams with stats
app.get("/dashboard", async (c) => {
  const user = c.get("user")!;

  const memberships = await db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, user.id),
    with: { team: true },
  });

  // Get stats for each team
  const teamsWithStats = await Promise.all(
    memberships.map(async ({ team, role }) => {
      // Get parts count and low stock count
      const partsData = await db
        .select({
          total: sql<number>`count(*)`,
          lowStock: sql<number>`sum(case when ${parts.quantity} <= ${parts.reorderPoint} and ${parts.reorderPoint} > 0 then 1 else 0 end)`,
        })
        .from(parts)
        .where(eq(parts.teamId, team.id));

      // Get pending orders count
      const pendingOrders = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.teamId, team.id), eq(orders.status, "pending")));

      // Get active orders count (approved or ordered)
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
        team,
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

  const error = c.req.query("error");

  return c.html(
    <Layout title="Dashboard - BuildSeason">
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/dashboard" class="text-xl font-bold text-gray-900">
              BuildSeason
            </a>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-6xl mx-auto py-8 px-4">
          {error && (
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">
                {error === "not_a_member"
                  ? "You are not a member of that team."
                  : error}
              </p>
            </div>
          )}

          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p class="text-gray-600">Welcome back, {user.name}</p>
            </div>
            <a
              href="/teams/new"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Team
            </a>
          </div>

          {memberships.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                No teams yet
              </h2>
              <p class="text-gray-600 mb-6">
                Create a team to start managing your FTC robotics parts and
                orders.
              </p>
              <a
                href="/teams/new"
                class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Team
              </a>
            </div>
          ) : (
            <div class="space-y-6">
              {teamsWithStats.map(({ team, role, stats }) => (
                <div class="bg-white rounded-lg shadow overflow-hidden">
                  {/* Team Header */}
                  <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900">
                        {team.name}
                      </h2>
                      <p class="text-sm text-gray-500">
                        Team #{team.number} &middot; {team.season}
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {role}
                      </span>
                      <a
                        href={`/teams/${team.id}`}
                        class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Team →
                      </a>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200">
                    <a
                      href={`/teams/${team.id}/parts`}
                      class="p-4 hover:bg-gray-50 transition"
                    >
                      <div class="text-2xl font-bold text-gray-900">
                        {stats.partsCount}
                      </div>
                      <div class="text-sm text-gray-500">
                        Parts in Inventory
                      </div>
                    </a>

                    <a
                      href={`/teams/${team.id}/parts?lowStock=true`}
                      class={`p-4 hover:bg-gray-50 transition ${stats.lowStockCount > 0 ? "bg-orange-50" : ""}`}
                    >
                      <div
                        class={`text-2xl font-bold ${stats.lowStockCount > 0 ? "text-orange-600" : "text-gray-900"}`}
                      >
                        {stats.lowStockCount}
                      </div>
                      <div class="text-sm text-gray-500">Low Stock Alerts</div>
                    </a>

                    <a
                      href={`/teams/${team.id}/orders?status=pending`}
                      class={`p-4 hover:bg-gray-50 transition ${stats.pendingOrdersCount > 0 ? "bg-yellow-50" : ""}`}
                    >
                      <div
                        class={`text-2xl font-bold ${stats.pendingOrdersCount > 0 ? "text-yellow-600" : "text-gray-900"}`}
                      >
                        {stats.pendingOrdersCount}
                      </div>
                      <div class="text-sm text-gray-500">Pending Approval</div>
                    </a>

                    <a
                      href={`/teams/${team.id}/orders`}
                      class="p-4 hover:bg-gray-50 transition"
                    >
                      <div class="text-2xl font-bold text-gray-900">
                        {stats.activeOrdersCount}
                      </div>
                      <div class="text-sm text-gray-500">Active Orders</div>
                    </a>
                  </div>

                  {/* Quick Actions */}
                  <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-4">
                    <a
                      href={`/teams/${team.id}/parts`}
                      class="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Parts
                    </a>
                    <a
                      href={`/teams/${team.id}/orders`}
                      class="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Orders
                    </a>
                    <a
                      href={`/teams/${team.id}/bom`}
                      class="text-sm text-gray-600 hover:text-gray-900"
                    >
                      BOM
                    </a>
                    <a
                      href={`/teams/${team.id}/members`}
                      class="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Members
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});

// Team creation form
app.get("/teams/new", (c) => {
  const currentYear = new Date().getFullYear();
  const currentSeason = `${currentYear}-${currentYear + 1}`;

  return c.html(
    <Layout title="Create Team - BuildSeason">
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <a href="/dashboard" class="text-xl font-bold text-gray-900">
              BuildSeason
            </a>
          </div>
        </nav>

        <div class="max-w-lg mx-auto py-8 px-4">
          <div class="mb-6">
            <a
              href="/dashboard"
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
              Back to Dashboard
            </a>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-6">
              Create a New Team
            </h1>

            <form
              hx-post="/teams"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="space-y-6"
            >
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700"
                >
                  Team Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g., Iron Panthers"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  for="number"
                  class="block text-sm font-medium text-gray-700"
                >
                  Team Number
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  required
                  pattern="[0-9]+"
                  placeholder="e.g., 16626"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p class="mt-1 text-sm text-gray-500">
                  Your official FTC team number
                </p>
              </div>

              <div>
                <label
                  for="season"
                  class="block text-sm font-medium text-gray-700"
                >
                  Season
                </label>
                <select
                  id="season"
                  name="season"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={currentSeason}>{currentSeason}</option>
                  <option value={`${currentYear - 1}-${currentYear}`}>
                    {currentYear - 1}-{currentYear}
                  </option>
                </select>
              </div>

              <div id="form-result"></div>

              <button
                type="submit"
                class="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span>Create Team</span>
                <span class="htmx-indicator">
                  <svg
                    class="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
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
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// Create team POST handler
app.post("/teams", async (c) => {
  const user = c.get("user")!;
  const body = await c.req.parseBody();

  const name = body.name as string;
  const number = body.number as string;
  const season = body.season as string;

  if (!name || !number || !season) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">All fields are required.</p>
      </div>
    );
  }

  // Validate team number is numeric
  if (!/^\d+$/.test(number)) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">Team number must be numeric.</p>
      </div>
    );
  }

  try {
    const teamId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    // Create team and add creator as admin
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

    // Redirect to the new team
    c.header("HX-Redirect", `/teams/${teamId}`);
    return c.html(<div>Redirecting...</div>);
  } catch (error) {
    console.error("Failed to create team:", error);
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          Failed to create team. Please try again.
        </p>
      </div>
    );
  }
});

// Team overview page (placeholder for now)
app.get("/teams/:teamId", async (c) => {
  const user = c.get("user")!;
  const teamId = c.req.param("teamId");

  // Check membership
  const membership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, teamId)),
  });

  if (!membership) {
    return c.redirect("/dashboard?error=not_a_member");
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  return c.html(
    <Layout title={`${team.name} - BuildSeason`}>
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/dashboard" class="text-xl font-bold text-gray-900">
                BuildSeason
              </a>
              <span class="text-gray-300">/</span>
              <span class="text-gray-600">{team.name}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto py-8 px-4">
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p class="text-gray-600">
              Team #{team.number} &middot; {team.season}
            </p>
          </div>

          {membership.role === "admin" || membership.role === "mentor" ? (
            <div class="bg-white rounded-lg shadow p-6 mb-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Invite Team Members
              </h2>
              <div id="invite-section">
                <p class="text-sm text-gray-600 mb-4">
                  Generate an invite link to allow new members to join your
                  team.
                </p>
                <button
                  hx-get={`/teams/${team.id}/invite`}
                  hx-target="#invite-section"
                  hx-swap="innerHTML"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Generate Invite Link
                </button>
              </div>
            </div>
          ) : null}

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href={`/teams/${team.id}/parts`}
              class="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div class="text-blue-600 mb-2">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900">Parts Inventory</h3>
              <p class="text-sm text-gray-500">Track your parts and supplies</p>
            </a>

            <a
              href={`/teams/${team.id}/orders`}
              class="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div class="text-green-600 mb-2">
                <svg
                  class="w-8 h-8"
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
              <h3 class="font-semibold text-gray-900">Orders</h3>
              <p class="text-sm text-gray-500">Manage purchase orders</p>
            </a>

            <a
              href={`/teams/${team.id}/bom`}
              class="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div class="text-purple-600 mb-2">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900">Bill of Materials</h3>
              <p class="text-sm text-gray-500">Robot subsystem parts lists</p>
            </a>

            <a
              href={`/teams/${team.id}/members`}
              class="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div class="text-orange-600 mb-2">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900">Team Members</h3>
              <p class="text-sm text-gray-500">Manage your team roster</p>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// Generate invite link
app.get("/teams/:teamId/invite", async (c) => {
  const user = c.get("user")!;
  const teamId = c.req.param("teamId");

  // Check membership and permissions
  const membership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, teamId)),
  });

  if (
    !membership ||
    (membership.role !== "admin" && membership.role !== "mentor")
  ) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          You do not have permission to generate invite links.
        </p>
      </div>
    );
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">Team not found.</p>
      </div>
    );
  }

  // Generate a unique token
  const token = crypto.randomUUID();
  const inviteId = crypto.randomUUID();

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    await db.insert(teamInvites).values({
      id: inviteId,
      teamId,
      token,
      role: "student", // Default role for invites
      expiresAt,
      createdBy: user.id,
    });

    const inviteUrl = `${c.req.url.split("/teams/")[0]}/invite/${token}`;

    return c.html(
      <div>
        <p class="text-sm text-gray-600 mb-4">
          Share this link with new team members. It will expire in 7 days and
          can only be used once.
        </p>
        <div class="flex gap-2">
          <input
            type="text"
            readonly
            value={inviteUrl}
            id="invite-url"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
          <button
            onclick="navigator.clipboard.writeText(document.getElementById('invite-url').value); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 2000);"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Copy
          </button>
        </div>
        <button
          hx-get={`/teams/${teamId}/invite`}
          hx-target="#invite-section"
          hx-swap="innerHTML"
          class="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          Generate New Link
        </button>
      </div>
    );
  } catch (error) {
    console.error("Failed to create invite:", error);
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          Failed to generate invite link. Please try again.
        </p>
      </div>
    );
  }
});

// Join page - show invite details
app.get("/invite/:token", async (c) => {
  const token = c.req.param("token");
  const user = c.get("user");

  const invite = await db.query.teamInvites.findFirst({
    where: eq(teamInvites.token, token),
    with: { team: true },
  });

  if (!invite) {
    return c.html(
      <Layout title="Invalid Invite - BuildSeason">
        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div class="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
            <div class="text-red-600 mb-4">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invite Link
            </h1>
            <p class="text-gray-600 mb-6">
              This invite link is not valid or has expired.
            </p>
            <a
              href="/dashboard"
              class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if invite has expired
  if (new Date() > invite.expiresAt) {
    return c.html(
      <Layout title="Expired Invite - BuildSeason">
        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div class="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
            <div class="text-yellow-600 mb-4">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              Invite Link Expired
            </h1>
            <p class="text-gray-600 mb-6">
              This invite link has expired. Please request a new invite from
              your team admin.
            </p>
            <a
              href="/dashboard"
              class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if invite has already been used
  if (invite.usedAt) {
    return c.html(
      <Layout title="Used Invite - BuildSeason">
        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div class="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
            <div class="text-yellow-600 mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              Invite Already Used
            </h1>
            <p class="text-gray-600 mb-6">
              This invite link has already been used. Please request a new
              invite from your team admin.
            </p>
            <a
              href="/dashboard"
              class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // If user is not logged in, redirect to login with return URL
  if (!user) {
    return c.redirect(`/login?redirect=/invite/${token}`);
  }

  // Check if user is already a member
  const existingMembership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, invite.teamId)),
  });

  if (existingMembership) {
    return c.html(
      <Layout title="Already a Member - BuildSeason">
        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div class="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
            <div class="text-green-600 mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              Already a Member
            </h1>
            <p class="text-gray-600 mb-6">
              You are already a member of {invite.team.name}.
            </p>
            <a
              href={`/teams/${invite.teamId}`}
              class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Team
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Show join confirmation page
  return c.html(
    <Layout title={`Join ${invite.team.name} - BuildSeason`}>
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <div class="text-center mb-6">
            <div class="text-blue-600 mb-4">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Join Team</h1>
            <p class="text-gray-600">You've been invited to join</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 class="font-semibold text-gray-900 mb-1">{invite.team.name}</h2>
            <p class="text-sm text-gray-600">
              Team #{invite.team.number} &middot; {invite.team.season}
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Role: <span class="font-medium capitalize">{invite.role}</span>
            </p>
          </div>

          <div id="join-result"></div>

          <form
            hx-post={`/invite/${token}`}
            hx-target="#join-result"
            hx-swap="innerHTML"
          >
            <button
              type="submit"
              class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Accept Invitation
            </button>
          </form>

          <a
            href="/dashboard"
            class="block text-center mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </a>
        </div>
      </div>
    </Layout>
  );
});

// Team members page
app.get("/teams/:teamId/members", async (c) => {
  const user = c.get("user")!;
  const teamId = c.req.param("teamId");

  // Check membership
  const membership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, teamId)),
  });

  if (!membership) {
    return c.redirect("/dashboard?error=not_a_member");
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return c.redirect("/dashboard?error=team_not_found");
  }

  // Get all team members with user info
  const members = await db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
    with: { user: true },
  });

  const isAdmin = membership.role === "admin";

  return c.html(
    <Layout title={`Team Members - ${team.name}`}>
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
              <span class="text-gray-600">Members</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">{user.name}</span>
              <SignOutButton class="text-sm text-gray-500 hover:text-gray-700" />
            </div>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto py-8 px-4">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Team Members</h1>
              <p class="text-gray-600">
                {members.length} member{members.length !== 1 ? "s" : ""} on{" "}
                {team.name}
              </p>
            </div>
            <a
              href={`/teams/${team.id}`}
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
              Back to Team
            </a>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {isAdmin && (
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr id={`member-${member.id}`}>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        {member.user.image ? (
                          <img
                            class="h-10 w-10 rounded-full"
                            src={member.user.image}
                            alt=""
                          />
                        ) : (
                          <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span class="text-gray-500 font-medium">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {member.user.name}
                            {member.userId === user.id && (
                              <span class="ml-2 text-xs text-gray-400">
                                (you)
                              </span>
                            )}
                          </div>
                          <div class="text-sm text-gray-500">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {isAdmin && member.userId !== user.id ? (
                        <select
                          hx-post={`/teams/${teamId}/members/${member.id}/role`}
                          hx-trigger="change"
                          hx-target={`#member-${member.id}`}
                          hx-swap="outerHTML"
                          name="role"
                          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option
                            value="admin"
                            selected={member.role === "admin"}
                          >
                            Admin
                          </option>
                          <option
                            value="mentor"
                            selected={member.role === "mentor"}
                          >
                            Mentor
                          </option>
                          <option
                            value="student"
                            selected={member.role === "student"}
                          >
                            Student
                          </option>
                        </select>
                      ) : (
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : member.role === "mentor"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {member.userId !== user.id ? (
                          <button
                            hx-delete={`/teams/${teamId}/members/${member.id}`}
                            hx-target={`#member-${member.id}`}
                            hx-swap="outerHTML"
                            hx-confirm={`Remove ${member.user.name} from the team?`}
                            class="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        ) : (
                          <span class="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div class="mt-6 text-sm text-gray-500">
              <p>
                <strong>Roles:</strong>
              </p>
              <ul class="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>Admin</strong> - Full access, can manage members and
                  settings
                </li>
                <li>
                  <strong>Mentor</strong> - Can create and approve orders,
                  manage inventory
                </li>
                <li>
                  <strong>Student</strong> - Can view and request parts
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});

// Update member role (admin only)
app.post("/teams/:teamId/members/:memberId/role", async (c) => {
  const user = c.get("user")!;
  const teamId = c.req.param("teamId");
  const memberId = c.req.param("memberId");

  // Check that current user is admin
  const currentMembership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, teamId)),
  });

  if (!currentMembership || currentMembership.role !== "admin") {
    return c.text("Forbidden", 403);
  }

  // Get the member being updated
  const targetMember = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.id, memberId),
    with: { user: true },
  });

  if (!targetMember || targetMember.teamId !== teamId) {
    return c.text("Member not found", 404);
  }

  // Can't change own role
  if (targetMember.userId === user.id) {
    return c.text("Cannot change your own role", 400);
  }

  const body = await c.req.parseBody();
  const newRole = body.role as TeamRole;

  if (!["admin", "mentor", "student"].includes(newRole)) {
    return c.text("Invalid role", 400);
  }

  await db
    .update(teamMembers)
    .set({ role: newRole })
    .where(eq(teamMembers.id, memberId));

  // Return updated row
  return c.html(
    <tr id={`member-${targetMember.id}`}>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          {targetMember.user.image ? (
            <img
              class="h-10 w-10 rounded-full"
              src={targetMember.user.image}
              alt=""
            />
          ) : (
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-gray-500 font-medium">
                {targetMember.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">
              {targetMember.user.name}
            </div>
            <div class="text-sm text-gray-500">{targetMember.user.email}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <select
          hx-post={`/teams/${teamId}/members/${targetMember.id}/role`}
          hx-trigger="change"
          hx-target={`#member-${targetMember.id}`}
          hx-swap="outerHTML"
          name="role"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="admin" selected={newRole === "admin"}>
            Admin
          </option>
          <option value="mentor" selected={newRole === "mentor"}>
            Mentor
          </option>
          <option value="student" selected={newRole === "student"}>
            Student
          </option>
        </select>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
        <button
          hx-delete={`/teams/${teamId}/members/${targetMember.id}`}
          hx-target={`#member-${targetMember.id}`}
          hx-swap="outerHTML"
          hx-confirm={`Remove ${targetMember.user.name} from the team?`}
          class="text-red-600 hover:text-red-900"
        >
          Remove
        </button>
      </td>
    </tr>
  );
});

// Remove member (admin only)
app.delete("/teams/:teamId/members/:memberId", async (c) => {
  const user = c.get("user")!;
  const teamId = c.req.param("teamId");
  const memberId = c.req.param("memberId");

  // Check that current user is admin
  const currentMembership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, teamId)),
  });

  if (!currentMembership || currentMembership.role !== "admin") {
    return c.text("Forbidden", 403);
  }

  // Get the member being removed
  const targetMember = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.id, memberId),
  });

  if (!targetMember || targetMember.teamId !== teamId) {
    return c.text("Member not found", 404);
  }

  // Can't remove yourself
  if (targetMember.userId === user.id) {
    return c.text("Cannot remove yourself", 400);
  }

  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

  // Return empty string to remove the row
  return c.html(<></>);
});

// Accept invite
app.post("/invite/:token", async (c) => {
  const user = c.get("user")!;
  const token = c.req.param("token");

  const invite = await db.query.teamInvites.findFirst({
    where: eq(teamInvites.token, token),
    with: { team: true },
  });

  if (!invite) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">Invalid invite link.</p>
      </div>
    );
  }

  // Check if invite has expired
  if (new Date() > invite.expiresAt) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">This invite link has expired.</p>
      </div>
    );
  }

  // Check if invite has already been used
  if (invite.usedAt) {
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          This invite link has already been used.
        </p>
      </div>
    );
  }

  // Check if user is already a member
  const existingMembership = await db.query.teamMembers.findFirst({
    where: (tm, { and, eq }) =>
      and(eq(tm.userId, user.id), eq(tm.teamId, invite.teamId)),
  });

  if (existingMembership) {
    c.header("HX-Redirect", `/teams/${invite.teamId}`);
    return c.html(<div>Redirecting...</div>);
  }

  try {
    const memberId = crypto.randomUUID();

    // Add user to team
    await db.insert(teamMembers).values({
      id: memberId,
      userId: user.id,
      teamId: invite.teamId,
      role: invite.role,
    });

    // Mark invite as used
    await db
      .update(teamInvites)
      .set({ usedAt: new Date() })
      .where(eq(teamInvites.id, invite.id));

    // Redirect to team page
    c.header("HX-Redirect", `/teams/${invite.teamId}`);
    return c.html(<div>Redirecting...</div>);
  } catch (error) {
    console.error("Failed to accept invite:", error);
    return c.html(
      <div class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">
          Failed to join team. Please try again.
        </p>
      </div>
    );
  }
});

export default app;
