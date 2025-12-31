import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StockStatus } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Store,
  ExternalLink,
  Clock,
  FileText,
  Package,
} from "lucide-react";

export const Route = createFileRoute(
  "/team/$program/$number/vendors/$vendorId/"
)({
  component: VendorDetailPage,
});

type VendorPart = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number | null;
  location: string | null;
  unitPriceCents: number | null;
};

type VendorDetail = {
  id: string;
  name: string;
  website: string | null;
  avgLeadTimeDays: number | null;
  notes: string | null;
  isGlobal: boolean;
  parts: VendorPart[];
};

function VendorDetailPage() {
  const { program, number, vendorId } = Route.useParams();

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

  // Fetch vendor detail with parts
  const { data: vendor, isLoading } = useQuery({
    queryKey: queryKeys.vendors.teamDetail(teamId || "", vendorId),
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/vendors/${vendorId}`);
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return res.json() as Promise<VendorDetail>;
    },
    enabled: !!teamId,
  });

  const formatLeadTime = (days: number | null) => {
    if (!days) return null;
    if (days === 1) return "1 day";
    if (days <= 7) return `${days} days`;
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "~1 week" : `~${weeks} weeks`;
  };

  const getStockStatus = (part: VendorPart): StockStatus => {
    if (part.quantity === 0) return "out";
    if (part.reorderPoint && part.quantity <= part.reorderPoint) return "low";
    return "ok";
  };

  const formatCurrency = (cents: number | null) =>
    cents ? `$${(cents / 100).toFixed(2)}` : "-";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vendor not found</h2>
        <p className="text-muted-foreground mb-4">
          This vendor may have been deleted or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/vendors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Link>
        </Button>
      </div>
    );
  }

  const leadTime = formatLeadTime(vendor.avgLeadTimeDays);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/vendors"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Vendors
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-display">{vendor.name}</h1>
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
            >
              {new URL(vendor.website).hostname}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        {vendor.website && (
          <Button asChild variant="outline">
            <a href={vendor.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Website
            </a>
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leadTime && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Average Lead Time
                  </p>
                  <p className="text-2xl font-bold">{leadTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Parts from this Vendor
                </p>
                <p className="text-2xl font-bold">{vendor.parts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {vendor.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {vendor.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parts from this Vendor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parts from this Vendor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vendor.parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parts yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have any parts from this vendor in your inventory.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.parts.map((part) => {
                  const stockStatus = getStockStatus(part);
                  return (
                    <TableRow key={part.id}>
                      <TableCell>
                        <Link
                          to="/team/$program/$number/parts/$partId"
                          params={{ program, number, partId: part.id }}
                          className="font-medium hover:underline"
                        >
                          {part.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.sku || "-"}
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
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(part.unitPriceCents)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
