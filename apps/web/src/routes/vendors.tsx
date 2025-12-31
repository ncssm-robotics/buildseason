import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, Clock, Store, Globe } from "lucide-react";

export const Route = createFileRoute("/vendors")({
  component: VendorsPage,
});

type Vendor = {
  id: string;
  name: string;
  website: string | null;
  leadTimeDays: number | null;
  isGlobal: boolean;
  teamName: string | null;
};

function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: queryKeys.vendors.list(),
    queryFn: async () => {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json() as Promise<Vendor[]>;
    },
  });

  // Filter vendors by search
  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLeadTime = (days: number | null) => {
    if (!days) return null;
    if (days === 1) return "1 day";
    if (days <= 7) return `${days} days`;
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "~1 week" : `~${weeks} weeks`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Vendor Directory</h1>
          <p className="text-muted-foreground">
            Browse vendors for robotics parts and supplies
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vendor Grid */}
        {!filteredVendors || filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No vendors found" : "No vendors yet"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery
                  ? "Try adjusting your search."
                  : "Vendors will appear here once added."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                formatLeadTime={formatLeadTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorCard({
  vendor,
  formatLeadTime,
}: {
  vendor: Vendor;
  formatLeadTime: (days: number | null) => string | null;
}) {
  const leadTime = formatLeadTime(vendor.leadTimeDays);

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{vendor.name}</h3>
          <Badge variant={vendor.isGlobal ? "secondary" : "outline"}>
            {vendor.isGlobal ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Global
              </>
            ) : (
              vendor.teamName || "Team"
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {new URL(vendor.website).hostname}
            </a>
          )}

          {leadTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Lead time: {leadTime}</span>
            </div>
          )}

          {!vendor.website && !leadTime && (
            <p className="text-sm text-muted-foreground">
              No additional details
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
