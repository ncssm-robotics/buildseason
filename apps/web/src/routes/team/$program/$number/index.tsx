import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/")({
  component: TeamOverviewPage,
});

type TeamStats = {
  id: string;
  program: string;
  name: string;
  number: string;
  season: string;
  role: string;
  stats: {
    partsCount: number;
    lowStockCount: number;
    pendingOrdersCount: number;
    activeOrdersCount: number;
  };
};

function TeamOverviewPage() {
  const { program, number } = Route.useParams();

  // Get team stats from the teams list
  const { data: teams, isLoading } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<TeamStats[]>;
    },
  });

  // Get members count
  const currentTeam = teams?.find(
    (t) => t.program === program && t.number === number
  );

  const { data: members } = useQuery({
    queryKey: queryKeys.teams.members(currentTeam?.id || ""),
    queryFn: async () => {
      const res = await fetch(`/api/teams/${currentTeam?.id}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json() as Promise<Array<{ id: string }>>;
    },
    enabled: !!currentTeam?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  const stats = currentTeam.stats;
  const canApproveOrders =
    currentTeam.role === "admin" || currentTeam.role === "mentor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">
          #{currentTeam.number} {currentTeam.name}
        </h1>
        <p className="text-muted-foreground">
          {currentTeam.season} · {currentTeam.role}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/team/$program/$number/parts" params={{ program, number }}>
          <StatsCard
            title="Total Parts"
            value={stats.partsCount}
            status={stats.partsCount > 0 ? "ok" : undefined}
          />
        </Link>

        <Link
          to="/team/$program/$number/parts"
          params={{ program, number }}
          search={{ lowStock: true }}
        >
          <StatsCard
            title="Low Stock"
            value={stats.lowStockCount}
            status={stats.lowStockCount > 0 ? "warning" : "ok"}
          />
        </Link>

        <Link
          to="/team/$program/$number/orders"
          params={{ program, number }}
          search={{ status: "pending" }}
        >
          <StatsCard
            title="Pending Orders"
            value={stats.pendingOrdersCount}
            status={stats.pendingOrdersCount > 0 ? "warning" : "ok"}
          />
        </Link>

        <Link to="/team/$program/$number/members" params={{ program, number }}>
          <StatsCard
            title="Team Members"
            value={members?.length || 0}
            status="ok"
          />
        </Link>
      </div>

      {/* Needs Attention */}
      {(stats.pendingOrdersCount > 0 || stats.lowStockCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Needs Attention
            </CardTitle>
            <CardDescription>Items that require your action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingOrdersCount > 0 && canApproveOrders && (
              <Link
                to="/team/$program/$number/orders"
                params={{ program, number }}
                search={{ status: "pending" }}
                className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">
                      {stats.pendingOrdersCount} order
                      {stats.pendingOrdersCount !== 1 ? "s" : ""} pending
                      approval
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Review and approve or reject
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}

            {stats.lowStockCount > 0 && (
              <Link
                to="/team/$program/$number/parts"
                params={{ program, number }}
                search={{ lowStock: true }}
                className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">
                      {stats.lowStockCount} part
                      {stats.lowStockCount !== 1 ? "s" : ""} low on stock
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Consider reordering soon
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link
                to="/team/$program/$number/parts"
                params={{ program, number }}
              >
                <Package className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">View Parts</div>
                  <div className="text-xs text-muted-foreground">
                    Browse inventory
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link
                to="/team/$program/$number/orders"
                params={{ program, number }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">View Orders</div>
                  <div className="text-xs text-muted-foreground">
                    Track purchases
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link
                to="/team/$program/$number/members"
                params={{ program, number }}
              >
                <Users className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Team Members</div>
                  <div className="text-xs text-muted-foreground">
                    Manage team
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              asChild
            >
              <Link to="/teams/new">
                <Plus className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">New Team</div>
                  <div className="text-xs text-muted-foreground">
                    Create another
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State for New Teams */}
      {stats.partsCount === 0 && stats.pendingOrdersCount === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Get Started</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Your team inventory is empty. Start by adding parts to track your
              robotics components.
            </p>
            <Button asChild>
              <Link
                to="/team/$program/$number/parts"
                params={{ program, number }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Part
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
