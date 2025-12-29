import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  Plus,
  Loader2,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

interface TeamStats {
  partsCount: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  activeOrdersCount: number;
}

interface Team {
  id: string;
  name: string;
  number: string;
  season: string;
  role: "admin" | "mentor" | "student";
  stats: TeamStats;
}

function DashboardPage() {
  const { isAuthenticated, isPending: authPending, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authPending && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authPending, navigate]);

  // Fetch teams
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.get<Team[]>("/api/teams"),
    enabled: isAuthenticated,
  });

  if (authPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const hasTeams = teams && teams.length > 0;

  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            {hasTeams
              ? " Select a team to manage parts and orders."
              : " Create your first team to get started."}
          </p>
        </div>
        <Button asChild>
          <Link to="/teams/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      {teamsError ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error loading teams
            </CardTitle>
            <CardDescription>
              {teamsError instanceof Error
                ? teamsError.message
                : "Please try again later."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : teamsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasTeams ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                No teams yet
              </CardTitle>
              <CardDescription>
                Create your first team to start managing parts and orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/teams/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

function TeamCard({ team }: { team: Team }) {
  const roleColors = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    mentor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    student:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <Link
        to="/teams/$teamId/parts"
        params={{ teamId: team.id }}
        className="block"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <CardDescription>
                Team {team.number} • {team.season}
              </CardDescription>
            </div>
            <Badge variant="outline" className={roleColors[team.role]}>
              {team.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>
                {team.stats.partsCount}{" "}
                {team.stats.partsCount === 1 ? "part" : "parts"}
              </span>
            </div>
            {team.stats.lowStockCount > 0 && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{team.stats.lowStockCount} low stock</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span>
                {team.stats.pendingOrdersCount + team.stats.activeOrdersCount}{" "}
                {team.stats.pendingOrdersCount +
                  team.stats.activeOrdersCount ===
                1
                  ? "order"
                  : "orders"}
              </span>
            </div>
            {team.stats.pendingOrdersCount > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Users className="h-4 w-4" />
                <span>{team.stats.pendingOrdersCount} pending</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
