import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type RobotStatus } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Package,
  Layers,
  ShoppingCart,
  ArrowRightLeft,
  Check,
  AlertTriangle,
  XCircle,
} from "lucide-react";

type BomSearchParams = {
  subsystem?: string;
};

export const Route = createFileRoute(
  "/team/$program/$number/robots/$robotId/bom/"
)({
  component: RobotBomPage,
  validateSearch: (search: Record<string, unknown>): BomSearchParams => ({
    subsystem:
      typeof search.subsystem === "string" ? search.subsystem : undefined,
  }),
});

type Robot = {
  id: string;
  name: string;
  status: RobotStatus;
  description: string | null;
  seasonId: string;
};

type BomItem = {
  id: string;
  partId: string;
  partName: string;
  partSku: string | null;
  subsystem: string | null;
  quantityNeeded: number;
  quantityAllocated: number;
  availableInInventory: number;
  unitPriceCents: number | null;
};

type BomSummary = {
  totalItems: number;
  totalCostCents: number;
  allocationPercent: number;
  fullyAllocated: number;
  partiallyAllocated: number;
  notAllocated: number;
};

function RobotBomPage() {
  const { program, number, robotId } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [selectedSubsystem, setSelectedSubsystem] = useState(
    searchParams.subsystem || "all"
  );

  // Get team info
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

  // Fetch robot data
  const { data: robot, isLoading: robotLoading } = useQuery({
    queryKey: ["teams", teamId, "robots", robotId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/robots/${robotId}`);
      if (!res.ok) throw new Error("Failed to fetch robot");
      return res.json() as Promise<Robot>;
    },
    enabled: !!teamId,
  });

  // Fetch BOM items
  const { data: bomItems, isLoading: bomLoading } = useQuery({
    queryKey: ["teams", teamId, "robots", robotId, "bom", selectedSubsystem],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubsystem && selectedSubsystem !== "all") {
        params.set("subsystem", selectedSubsystem);
      }
      const res = await fetch(
        `/api/teams/${teamId}/robots/${robotId}/bom?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch BOM items");
      return res.json() as Promise<BomItem[]>;
    },
    enabled: !!teamId && !!robotId,
  });

  // Fetch BOM summary
  const { data: summary } = useQuery({
    queryKey: ["teams", teamId, "robots", robotId, "bom", "summary"],
    queryFn: async () => {
      const res = await fetch(
        `/api/teams/${teamId}/robots/${robotId}/bom/summary`
      );
      if (!res.ok) throw new Error("Failed to fetch BOM summary");
      return res.json() as Promise<BomSummary>;
    },
    enabled: !!teamId && !!robotId,
  });

  // Get unique subsystems from BOM items
  const subsystems = Array.from(
    new Set(bomItems?.map((item) => item.subsystem).filter(Boolean) || [])
  ).sort() as string[];

  // Group BOM items by subsystem
  const groupedItems: Record<string, BomItem[]> = {};
  bomItems?.forEach((item) => {
    const key = item.subsystem || "Uncategorized";
    if (!groupedItems[key]) groupedItems[key] = [];
    groupedItems[key].push(item);
  });

  const handleSubsystemChange = (value: string) => {
    setSelectedSubsystem(value);
    navigate({
      to: "/team/$program/$number/robots/$robotId/bom",
      params: { program, number, robotId },
      search: { subsystem: value === "all" ? undefined : value },
    });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getGapStatus = (
    item: BomItem
  ): "complete" | "partial" | "missing" | "over" => {
    const gap = item.quantityNeeded - item.quantityAllocated;
    if (gap <= 0)
      return item.quantityAllocated > item.quantityNeeded ? "over" : "complete";
    if (item.quantityAllocated > 0) return "partial";
    return "missing";
  };

  const getGapBadge = (item: BomItem) => {
    const status = getGapStatus(item);
    const gap = item.quantityNeeded - item.quantityAllocated;
    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case "over":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Check className="h-3 w-3 mr-1" />
            Over ({Math.abs(gap)})
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Need {gap}
          </Badge>
        );
      case "missing":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Need {gap}
          </Badge>
        );
    }
  };

  const isLoading = robotLoading || bomLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Robot not found</h2>
        <p className="text-muted-foreground mb-4">
          This robot may have been deleted or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/team/$program/$number/robots" params={{ program, number }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Robots
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/team/$program/$number/robots/$robotId"
        params={{ program, number, robotId }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to {robot.name}
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold font-display">
              {robot.name} BOM
            </h1>
            <StatusBadge status={robot.status} />
          </div>
          <p className="text-muted-foreground">
            Bill of Materials - {bomItems?.length || 0} item
            {bomItems?.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                to="/team/$program/$number/robots/$robotId/bom"
                params={{ program, number, robotId }}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Allocate Parts
              </Link>
            </Button>
            <Button asChild>
              <Link
                to="/team/$program/$number/robots/$robotId/bom"
                params={{ program, number, robotId }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to BOM
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalCostCents)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.allocationPercent}%</p>
              <p className="text-xs text-muted-foreground">
                {summary.fullyAllocated} complete, {summary.partiallyAllocated}{" "}
                partial
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missing Parts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {summary.notAllocated}
              </p>
              {summary.notAllocated > 0 && canEdit && (
                <Button size="sm" variant="outline" className="mt-2" asChild>
                  <Link
                    to="/team/$program/$number/orders/new"
                    params={{ program, number }}
                  >
                    <ShoppingCart className="mr-1 h-3 w-3" />
                    Order Missing
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select
              value={selectedSubsystem}
              onValueChange={handleSubsystemChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subsystem..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsystems</SelectItem>
                {subsystems.map((subsystem) => (
                  <SelectItem key={subsystem} value={subsystem}>
                    {subsystem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Layers className="mr-2 h-4 w-4" />
              Compare to Inventory
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BOM Table */}
      {!bomItems || bomItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedSubsystem !== "all"
                ? "No items in this subsystem"
                : "No BOM items yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {selectedSubsystem !== "all"
                ? "Try selecting a different subsystem."
                : "Start by adding parts to this robot's bill of materials."}
            </p>
            {canEdit && selectedSubsystem === "all" && (
              <Button asChild>
                <Link
                  to="/team/$program/$number/robots/$robotId/bom"
                  params={{ program, number, robotId }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First BOM Item
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([subsystem, items]) => (
              <Card key={subsystem}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    {subsystem}
                    <Badge variant="secondary">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead className="text-right">Needed</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const gap = item.quantityNeeded - item.quantityAllocated;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Link
                              to="/team/$program/$number/parts/$partId"
                              params={{
                                program,
                                number,
                                partId: item.partId,
                              }}
                              className="hover:underline"
                            >
                              <div>
                                <p className="font-medium">{item.partName}</p>
                                {item.partSku && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.partSku}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.quantityNeeded}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantityAllocated}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.availableInInventory}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                gap > 0
                                  ? "text-red-600 font-medium"
                                  : gap < 0
                                    ? "text-blue-600"
                                    : "text-green-600"
                              }
                            >
                              {gap > 0 ? `+${gap}` : gap}
                            </span>
                          </TableCell>
                          <TableCell>{getGapBadge(item)}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {gap > 0 && item.availableInInventory > 0 && (
                                  <Button size="sm" variant="outline">
                                    Allocate
                                  </Button>
                                )}
                                {item.quantityAllocated > 0 && (
                                  <Button size="sm" variant="ghost">
                                    Return
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
