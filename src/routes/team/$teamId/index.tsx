import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, AlertTriangle, Users } from "lucide-react";

export const Route = createFileRoute("/team/$teamId/")({
  component: TeamOverviewPage,
});

function TeamOverviewPage() {
  const { teamId } = useParams({ from: "/team/$teamId" });
  const team = useQuery(api.teams.get, { teamId: teamId as Id<"teams"> });
  const parts = useQuery(api.parts.list, { teamId: teamId as Id<"teams"> });
  const lowStock = useQuery(api.parts.getLowStock, {
    teamId: teamId as Id<"teams">,
  });
  const members = useQuery(api.members.list, { teamId: teamId as Id<"teams"> });
  const orders = useQuery(api.orders.list, { teamId: teamId as Id<"teams"> });

  const pendingOrders =
    orders?.filter((o) => o.status === "pending").length ?? 0;
  const partsCount = parts?.length ?? 0;
  const lowStockCount = lowStock?.length ?? 0;
  const membersCount = members?.length ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">
          {team?.name ?? <Skeleton className="h-9 w-48 inline-block" />}
        </h1>
        <p className="text-muted-foreground mt-1">
          Team overview and quick stats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parts === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                partsCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStock === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                lowStockCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                pendingOrders
              )}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                membersCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Items
            </CardTitle>
            <CardDescription>
              These parts are at or below their reorder point
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((part) => (
                <li
                  key={part._id}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <span>{part.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {part.quantity} / {part.reorderPoint} min
                  </span>
                </li>
              ))}
              {lowStock.length > 5 && (
                <li className="text-sm text-muted-foreground pt-2">
                  And {lowStock.length - 5} more...
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
