import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, handleResponse } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: async () => {
      const res = await api.api.user.$get();
      return handleResponse<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      }>(res);
    },
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const res = await api.api.teams.$get();
      return handleResponse<
        Array<{
          id: string;
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
        }>
      >(res);
    },
  });

  return (
    <AppLayout user={user}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Select a team to
              get started.
            </p>
          </div>
          <Button asChild>
            <Link to="/teams/new">
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamsLoading ? (
            <>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </>
          ) : teams?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">
                  You're not a member of any teams yet.
                </p>
                <Button asChild>
                  <Link to="/teams/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            teams?.map((team) => (
              <Link
                key={team.id}
                to="/teams/$teamId"
                params={{ teamId: team.id }}
              >
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        #{team.number}
                      </span>
                      <span>{team.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {team.season} &middot; {team.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Parts:</span>{" "}
                        <span className="font-medium">
                          {team.stats.partsCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Low Stock:
                        </span>{" "}
                        <span className="font-medium text-orange-500">
                          {team.stats.lowStockCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>{" "}
                        <span className="font-medium">
                          {team.stats.pendingOrdersCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active:</span>{" "}
                        <span className="font-medium">
                          {team.stats.activeOrdersCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
