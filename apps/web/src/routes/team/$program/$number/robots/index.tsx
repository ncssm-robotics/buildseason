import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type RobotStatus } from "@/components/ui/status-badge";
import { Plus, Bot, Layers, DollarSign, PieChart } from "lucide-react";

type RobotsSearchParams = {
  seasonId?: string;
  status?: string;
};

export const Route = createFileRoute("/team/$program/$number/robots/")({
  component: RobotsPage,
  validateSearch: (search: Record<string, unknown>): RobotsSearchParams => ({
    seasonId: typeof search.seasonId === "string" ? search.seasonId : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
});

type Season = {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
};

type Robot = {
  id: string;
  name: string;
  status: RobotStatus;
  description: string | null;
  seasonId: string;
  bomItemCount: number;
  bomCostCents: number;
  allocationPercent: number;
};

function RobotsPage() {
  const { program, number } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  // Get team info from teams list
  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<
        Array<{ id: string; program: string; number: string; role: string }>
      >;
    },
  });

  const currentTeam = teams?.find(
    (t) => t.program === program && t.number === number
  );
  const teamId = currentTeam?.id;
  const canEdit =
    currentTeam?.role === "admin" || currentTeam?.role === "mentor";

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ["teams", teamId, "seasons"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/seasons`);
      if (!res.ok) throw new Error("Failed to fetch seasons");
      return res.json() as Promise<Season[]>;
    },
    enabled: !!teamId,
  });

  // Get selected season (default to current season)
  const selectedSeasonId =
    searchParams.seasonId || seasons?.find((s) => s.isCurrent)?.id || "";

  // Fetch robots for selected season
  const { data: robots, isLoading } = useQuery({
    queryKey: [
      "teams",
      teamId,
      "robots",
      selectedSeasonId,
      searchParams.status,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSeasonId) params.set("seasonId", selectedSeasonId);
      if (searchParams.status) params.set("status", searchParams.status);
      const res = await fetch(`/api/teams/${teamId}/robots?${params}`);
      if (!res.ok) throw new Error("Failed to fetch robots");
      return res.json() as Promise<Robot[]>;
    },
    enabled: !!teamId && !!selectedSeasonId,
  });

  const handleSeasonChange = (seasonId: string) => {
    navigate({
      to: "/team/$program/$number/robots",
      params: { program, number },
      search: { ...searchParams, seasonId },
    });
  };

  const handleStatusChange = (status: string) => {
    navigate({
      to: "/team/$program/$number/robots",
      params: { program, number },
      search: {
        ...searchParams,
        status: status === "all" ? undefined : status,
      },
    });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const currentSeason = seasons?.find((s) => s.id === selectedSeasonId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Robots</h1>
          <p className="text-muted-foreground">
            {currentSeason
              ? `${currentSeason.name} (${currentSeason.year})`
              : "Select a season"}
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link
              to="/team/$program/$number/robots"
              params={{ program, number }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Robot
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select season..." />
              </SelectTrigger>
              <SelectContent>
                {seasons?.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} ({season.year})
                    {season.isCurrent && " - Current"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchParams.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="competition_ready">
                  Competition Ready
                </SelectItem>
                <SelectItem value="disassembled">Disassembled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Robots Grid */}
      {!robots || robots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchParams.status
                ? "No robots found"
                : "No robots yet for this season"}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {searchParams.status
                ? "Try adjusting your filters."
                : "Create your first robot to start building your BOM."}
            </p>
            {canEdit && !searchParams.status && (
              <Button asChild>
                <Link
                  to="/team/$program/$number/robots"
                  params={{ program, number }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Robot
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <RobotCard
              key={robot.id}
              robot={robot}
              program={program}
              number={number}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RobotCard({
  robot,
  program,
  number,
  formatCurrency,
}: {
  robot: Robot;
  program: string;
  number: string;
  formatCurrency: (cents: number) => string;
}) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() =>
        navigate({
          to: "/team/$program/$number/robots",
          params: { program, number },
        })
      }
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{robot.name}</h3>
          <StatusBadge status={robot.status} />
        </div>

        {robot.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {robot.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Layers className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">{robot.bomItemCount}</p>
            <p className="text-xs text-muted-foreground">BOM Items</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">
              {formatCurrency(robot.bomCostCents)}
            </p>
            <p className="text-xs text-muted-foreground">BOM Cost</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <PieChart className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">{robot.allocationPercent}%</p>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
