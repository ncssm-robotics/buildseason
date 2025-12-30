import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge";
import {
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type OrdersSearchParams = {
  status?: string;
};

export const Route = createFileRoute("/team/$program/$number/orders/")({
  component: OrdersPage,
  validateSearch: (search: Record<string, unknown>): OrdersSearchParams => ({
    status: typeof search.status === "string" ? search.status : undefined,
  }),
});

type OrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  part: { id: string; name: string };
};

type Order = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  orderedAt: string | null;
  receivedAt: string | null;
  vendor: { id: string; name: string } | null;
  items: OrderItem[];
  createdById: string;
};

function OrdersPage() {
  const { program, number } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    pending: true,
    inProgress: true,
    completed: false,
  });

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
  const canApprove =
    currentTeam?.role === "admin" || currentTeam?.role === "mentor";

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: queryKeys.orders.list(teamId || "", searchParams.status),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.status) params.set("status", searchParams.status);

      const res = await fetch(`/api/teams/${teamId}/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json() as Promise<Order[]>;
    },
    enabled: !!teamId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(
        `/api/teams/${teamId}/orders/${orderId}/approve`,
        {
          method: "POST",
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order approved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/teams/${teamId}/orders/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order rejected");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Group orders by status category
  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const inProgressOrders =
    orders?.filter((o) => ["approved", "ordered"].includes(o.status)) || [];
  const completedOrders =
    orders?.filter((o) => ["received", "rejected"].includes(o.status)) || [];
  const draftOrders = orders?.filter((o) => o.status === "draft") || [];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getOrderTotal = (order: Order) =>
    order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0
    );

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const OrderCard = ({ order }: { order: Order }) => (
    <Card
      key={order.id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() =>
        navigate({
          to: "/team/$program/$number/orders",
          params: { program, number },
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {order.vendor?.name || "No vendor"} · {order.items.length} item
              {order.items.length !== 1 ? "s" : ""} ·{" "}
              {formatCurrency(getOrderTotal(order))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Created {formatDate(order.createdAt)}
            </p>
          </div>
          {canApprove && order.status === "pending" && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => approveMutation.mutate(order.id)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => rejectMutation.mutate(order.id)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const OrderSection = ({
    title,
    icon: Icon,
    orders: sectionOrders,
    sectionKey,
    defaultExpanded = true,
  }: {
    title: string;
    icon: typeof Clock;
    orders: Order[];
    sectionKey: string;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections[sectionKey] ?? defaultExpanded;

    if (sectionOrders.length === 0) return null;

    return (
      <div className="space-y-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
          <Icon className="h-5 w-5" />
          <span>
            {title} ({sectionOrders.length})
          </span>
        </button>
        {isExpanded && (
          <div className="space-y-3 pl-7">
            {sectionOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const hasOrders =
    pendingOrders.length > 0 ||
    inProgressOrders.length > 0 ||
    completedOrders.length > 0 ||
    draftOrders.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground">
            {orders?.length || 0} order{orders?.length !== 1 ? "s" : ""}
            {pendingOrders.length > 0 && canApprove && (
              <span className="text-yellow-600 ml-2">
                ({pendingOrders.length} pending approval)
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link to="/team/$program/$number/orders" params={{ program, number }}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select
              value={searchParams.status || "all"}
              onValueChange={(value) => {
                navigate({
                  to: "/team/$program/$number/orders",
                  params: { program, number },
                  search: value === "all" ? {} : { status: value },
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {!hasOrders ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchParams.status ? "No orders found" : "No orders yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {searchParams.status
                ? "Try adjusting your filters."
                : "Create your first order to start tracking purchases."}
            </p>
            {!searchParams.status && (
              <Button asChild>
                <Link
                  to="/team/$program/$number/orders"
                  params={{ program, number }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Draft Orders */}
          <OrderSection
            title="Drafts"
            icon={ShoppingCart}
            orders={draftOrders}
            sectionKey="draft"
          />

          {/* Pending Approval */}
          <OrderSection
            title="Pending Approval"
            icon={Clock}
            orders={pendingOrders}
            sectionKey="pending"
          />

          {/* In Progress */}
          <OrderSection
            title="In Progress"
            icon={Package}
            orders={inProgressOrders}
            sectionKey="inProgress"
          />

          {/* Completed */}
          <OrderSection
            title="Completed"
            icon={CheckCircle2}
            orders={completedOrders}
            sectionKey="completed"
            defaultExpanded={false}
          />
        </div>
      )}
    </div>
  );
}
