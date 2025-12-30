import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StockStatus } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Package,
  MapPin,
  DollarSign,
  ExternalLink,
  ShoppingCart,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/parts/$partId/")({
  component: PartDetailPage,
});

type BomUsage = {
  id: string;
  subsystem: string;
  quantityNeeded: number;
  notes: string | null;
};

type OrderHistory = {
  orderId: string;
  orderStatus: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
  vendorName: string | null;
};

type PartDetail = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number | null;
  location: string | null;
  unitPriceCents: number | null;
  description: string | null;
  vendor: { id: string; name: string; website: string | null } | null;
  bomUsage: BomUsage[];
  orderHistory: OrderHistory[];
};

function PartDetailPage() {
  const { program, number, partId } = Route.useParams();

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

  // Fetch part detail
  const { data: part, isLoading } = useQuery({
    queryKey: queryKeys.parts.detail(teamId || "", partId),
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/parts/${partId}`);
      if (!res.ok) throw new Error("Failed to fetch part");
      return res.json() as Promise<PartDetail>;
    },
    enabled: !!teamId,
  });

  const getStockStatus = (): StockStatus => {
    if (!part) return "ok";
    if (part.quantity === 0) return "out";
    if (part.reorderPoint && part.quantity <= part.reorderPoint) return "low";
    return "ok";
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();

  const totalValue = part ? (part.unitPriceCents || 0) * part.quantity : 0;

  const totalNeeded =
    part?.bomUsage.reduce((sum, bom) => sum + bom.quantityNeeded, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Part not found</h2>
        <p className="text-muted-foreground mb-4">
          This part may have been deleted or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/team/$program/$number/parts" params={{ program, number }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parts
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/team/$program/$number/parts"
        params={{ program, number }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Parts
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-display">{part.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {part.sku && (
              <span className="text-muted-foreground">SKU: {part.sku}</span>
            )}
            <StatusBadge status={getStockStatus()} />
          </div>
        </div>
        <div className="flex gap-2">
          {part.vendor?.website && (
            <Button variant="outline" asChild>
              <a
                href={part.vendor.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on {part.vendor.name}
              </a>
            </Button>
          )}
          {canEdit && (
            <Button asChild>
              <Link
                to="/team/$program/$number/parts/$partId"
                params={{ program, number, partId }}
              >
                Edit Part
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {part.description && (
        <p className="text-muted-foreground">{part.description}</p>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="text-2xl font-bold">
                  {part.quantity}
                  {part.reorderPoint ? (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {part.reorderPoint}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Price</p>
                <p className="text-2xl font-bold">
                  {part.unitPriceCents
                    ? formatCurrency(part.unitPriceCents)
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {totalValue > 0 ? formatCurrency(totalValue) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-2xl font-bold">{part.location || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* BOM Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              BOM Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {part.bomUsage.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                This part is not used in any BOM
              </p>
            ) : (
              <div className="space-y-3">
                {part.bomUsage.map((bom) => (
                  <div
                    key={bom.id}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{bom.subsystem}</p>
                      {bom.notes && (
                        <p className="text-sm text-muted-foreground">
                          {bom.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {bom.quantityNeeded} needed
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-medium">Total Needed</span>
                  <span className="font-bold">{totalNeeded}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Vendor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!part.vendor ? (
              <p className="text-muted-foreground text-sm">
                No vendor assigned
              </p>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{part.vendor.name}</p>
                  {part.vendor.website && (
                    <a
                      href={part.vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      {part.vendor.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {part.orderHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No order history for this part
            </p>
          ) : (
            <div className="space-y-3">
              {part.orderHistory.map((order) => (
                <Link
                  key={order.orderId}
                  to="/team/$program/$number/orders"
                  params={{ program, number }}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      Order #{order.orderId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.vendorName || "No vendor"} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.quantity} units</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(order.quantity * order.unitPriceCents)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
