import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  ArrowUpDown,
} from "lucide-react";

type PartsSearchParams = {
  search?: string;
  lowStock?: boolean;
  sort?: string;
  order?: string;
};

export const Route = createFileRoute("/team/$program/$number/parts/")({
  component: PartsPage,
  validateSearch: (search: Record<string, unknown>): PartsSearchParams => ({
    search: typeof search.search === "string" ? search.search : undefined,
    lowStock: search.lowStock === true || search.lowStock === "true",
    sort: typeof search.sort === "string" ? search.sort : undefined,
    order: typeof search.order === "string" ? search.order : undefined,
  }),
});

type Part = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number | null;
  location: string | null;
  unitPriceCents: number | null;
  description: string | null;
  vendor: { id: string; name: string } | null;
};

function PartsPage() {
  const { program, number } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.search || "");

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

  // Fetch parts
  const { data: parts, isLoading } = useQuery({
    queryKey: queryKeys.parts.list(teamId || "", {
      search: searchParams.search,
      lowStock: searchParams.lowStock,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.search) params.set("search", searchParams.search);
      if (searchParams.lowStock) params.set("lowStock", "true");
      if (searchParams.sort) params.set("sort", searchParams.sort);
      if (searchParams.order) params.set("order", searchParams.order);

      const res = await fetch(`/api/teams/${teamId}/parts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch parts");
      return res.json() as Promise<Part[]>;
    },
    enabled: !!teamId,
  });

  const lowStockCount =
    parts?.filter((p) => p.reorderPoint && p.quantity <= p.reorderPoint)
      .length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/team/$program/$number/parts",
      params: { program, number },
      search: {
        ...searchParams,
        search: searchInput || undefined,
      },
    });
  };

  const toggleLowStock = () => {
    navigate({
      to: "/team/$program/$number/parts",
      params: { program, number },
      search: {
        ...searchParams,
        lowStock: !searchParams.lowStock || undefined,
      },
    });
  };

  const toggleSort = (column: string) => {
    const newOrder =
      searchParams.sort === column && searchParams.order !== "desc"
        ? "desc"
        : "asc";
    navigate({
      to: "/team/$program/$number/parts",
      params: { program, number },
      search: {
        ...searchParams,
        sort: column,
        order: newOrder,
      },
    });
  };

  const getStockStatus = (part: Part): "ok" | "low" | "out" => {
    if (part.quantity === 0) return "out";
    if (part.reorderPoint && part.quantity <= part.reorderPoint) return "low";
    return "ok";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Parts Inventory</h1>
          <p className="text-muted-foreground">
            {parts?.length || 0} part{parts?.length !== 1 ? "s" : ""}
            {lowStockCount > 0 && !searchParams.lowStock && (
              <span className="text-yellow-600 ml-2">
                ({lowStockCount} low stock)
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link
              to="/team/$program/$number/parts"
              params={{ program, number }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Link>
          </Button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && !searchParams.lowStock && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">
                  {lowStockCount} part{lowStockCount !== 1 ? "s" : ""} low on
                  stock
                </p>
                <p className="text-sm text-muted-foreground">
                  Consider reordering soon
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleLowStock}>
              View Low Stock
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or location..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={searchParams.sort || "name"}
              onValueChange={(value) => {
                navigate({
                  to: "/team/$program/$number/parts",
                  params: { program, number },
                  search: {
                    ...searchParams,
                    sort: value,
                  },
                });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={searchParams.lowStock ? "secondary" : "outline"}
              onClick={toggleLowStock}
            >
              {searchParams.lowStock ? "Show All" : "Low Stock Only"}
            </Button>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Parts Table */}
      {!parts || parts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchParams.search || searchParams.lowStock
                ? "No parts found"
                : "No parts yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {searchParams.search || searchParams.lowStock
                ? "Try adjusting your search or filters."
                : "Start by adding parts to your inventory."}
            </p>
            {canEdit && !searchParams.search && !searchParams.lowStock && (
              <Button asChild>
                <Link
                  to="/team/$program/$number/parts"
                  params={{ program, number }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Part
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Part
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("sku")}
                >
                  <div className="flex items-center gap-2">
                    SKU
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => toggleSort("quantity")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Qty
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("location")}
                >
                  <div className="flex items-center gap-2">
                    Location
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => {
                const stockStatus = getStockStatus(part);
                return (
                  <TableRow
                    key={part.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate({
                        to: "/team/$program/$number/parts/$partId",
                        params: { program, number, partId: part.id },
                      })
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{part.name}</p>
                        {part.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {part.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.sku || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.vendor?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {part.quantity}
                      {part.reorderPoint ? (
                        <span className="text-xs text-muted-foreground ml-1">
                          / {part.reorderPoint}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={stockStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.location || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
