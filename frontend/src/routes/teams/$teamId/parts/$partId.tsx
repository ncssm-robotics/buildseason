import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Pencil,
  AlertTriangle,
  Package,
  MapPin,
  DollarSign,
  Building2,
  Hash,
} from "lucide-react";

export const Route = createFileRoute("/teams/$teamId/parts/$partId")({
  component: PartDetailPage,
});

interface Part {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number | null;
  location: string | null;
  unitPriceCents: number | null;
  description: string | null;
  vendor: { id: string; name: string } | null;
}

function PartDetailPage() {
  const { teamId, partId } = Route.useParams();

  const { data: part, isLoading } = useQuery({
    queryKey: ["teams", teamId, "parts", partId],
    queryFn: () => api.get<Part>(`/api/teams/${teamId}/parts/${partId}`),
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Part not found</p>
        <Button asChild className="mt-4">
          <Link to="/teams/$teamId/parts" params={{ teamId }}>
            Back to Parts
          </Link>
        </Button>
      </div>
    );
  }

  const isLowStock = part.reorderPoint && part.quantity <= part.reorderPoint;
  const unitPrice = part.unitPriceCents
    ? (part.unitPriceCents / 100).toFixed(2)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams/$teamId/parts" params={{ teamId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parts
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {part.name}
              {isLowStock && (
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Low Stock
                </Badge>
              )}
            </h2>
            {part.description && (
              <p className="text-muted-foreground mt-1">{part.description}</p>
            )}
          </div>
          <Button asChild>
            <Link
              to="/teams/$teamId/parts/$partId/edit"
              params={{ teamId, partId }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inventory Info */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Inventory</h3>
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <dt className="text-sm text-muted-foreground">Quantity</dt>
                <dd
                  className={`font-medium ${isLowStock ? "text-orange-600" : ""}`}
                >
                  {part.quantity}
                  {part.reorderPoint && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (reorder at {part.reorderPoint})
                    </span>
                  )}
                </dd>
              </div>
            </div>
            {part.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Location</dt>
                  <dd className="font-medium">{part.location}</dd>
                </div>
              </div>
            )}
            {part.sku && (
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">SKU</dt>
                  <dd className="font-medium">{part.sku}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Vendor & Pricing */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Vendor & Pricing</h3>
          <dl className="space-y-4">
            {part.vendor && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Vendor</dt>
                  <dd className="font-medium">{part.vendor.name}</dd>
                </div>
              </div>
            )}
            {unitPrice && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Unit Price</dt>
                  <dd className="font-medium">${unitPrice}</dd>
                </div>
              </div>
            )}
            {!part.vendor && !unitPrice && (
              <p className="text-muted-foreground text-sm">
                No vendor or pricing information set.
              </p>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
