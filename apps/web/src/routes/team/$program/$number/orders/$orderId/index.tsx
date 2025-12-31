import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Send,
  Package,
  Truck,
  Clock,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/team/$program/$number/orders/$orderId/")(
  {
    component: OrderDetailPage,
  }
);

type OrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  part: { id: string; name: string; sku: string | null };
};

type OrderDetail = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  rejectionReason: string | null;
  trackingNumber: string | null;
  createdAt: string;
  submittedAt: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  vendor: { id: string; name: string; website: string | null } | null;
  items: OrderItem[];
  createdBy: { id: string; name: string | null; email: string };
  approvedBy: { id: string; name: string | null; email: string } | null;
};

function OrderDetailPage() {
  const { program, number, orderId } = Route.useParams();
  const queryClient = useQueryClient();

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
  const canEdit =
    currentTeam?.role === "admin" || currentTeam?.role === "mentor";

  // Fetch order detail
  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(teamId || "", orderId),
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json() as Promise<OrderDetail>;
    },
    enabled: !!teamId,
  });

  // Action mutations
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/orders/${orderId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(teamId || "", orderId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order submitted for approval");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/teams/${teamId}/orders/${orderId}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(teamId || "", orderId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order approved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
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
        queryKey: queryKeys.orders.detail(teamId || "", orderId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order rejected");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markOrderedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/teams/${teamId}/orders/${orderId}/mark-ordered`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as ordered");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(teamId || "", orderId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order marked as ordered");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markReceivedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/teams/${teamId}/orders/${orderId}/mark-received`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as received");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(teamId || "", orderId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.list(teamId || ""),
      });
      toast.success("Order marked as received");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();
  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString();

  const getOrderTotal = () =>
    order?.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0
    ) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-4">
          This order may have been deleted or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/team/$program/$number/orders" params={{ program, number }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const ActionButtons = () => {
    const isPending =
      submitMutation.isPending ||
      approveMutation.isPending ||
      rejectMutation.isPending ||
      markOrderedMutation.isPending ||
      markReceivedMutation.isPending;

    switch (order.status) {
      case "draft":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          </div>
        );
      case "pending":
        return canApprove ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => approveMutation.mutate()}
              disabled={isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => rejectMutation.mutate()}
              disabled={isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        ) : null;
      case "approved":
        return canEdit ? (
          <Button
            onClick={() => markOrderedMutation.mutate()}
            disabled={isPending}
          >
            <Truck className="mr-2 h-4 w-4" />
            Mark as Ordered
          </Button>
        ) : null;
      case "ordered":
        return canEdit ? (
          <Button
            onClick={() => markReceivedMutation.mutate()}
            disabled={isPending}
          >
            <Package className="mr-2 h-4 w-4" />
            Mark as Received
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/team/$program/$number/orders"
        params={{ program, number }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display">
              Order #{order.id.slice(0, 8)}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {order.vendor?.name || "No vendor"} · {order.items.length} item
            {order.items.length !== 1 ? "s" : ""} ·{" "}
            {formatCurrency(getOrderTotal())}
          </p>
        </div>
        <ActionButtons />
      </div>

      {/* Rejection Notice */}
      {order.status === "rejected" && order.rejectionReason && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-600">Order Rejected</p>
              <p className="text-sm text-muted-foreground">
                {order.rejectionReason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{order.vendor?.name || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.orderedAt && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Truck className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordered</p>
                  <p className="font-medium">{formatDate(order.orderedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {order.receivedAt && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p className="font-medium">{formatDate(order.receivedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""} in
            this order
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.part.name}</p>
                      {item.part.sku && (
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.part.sku}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPriceCents)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPriceCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">
                  Order Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(getOrderTotal())}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TimelineItem
              icon={ShoppingCart}
              title="Order Created"
              description={`by ${order.createdBy.name || order.createdBy.email}`}
              date={formatDateTime(order.createdAt)}
            />
            {order.submittedAt && (
              <TimelineItem
                icon={Send}
                title="Submitted for Approval"
                date={formatDateTime(order.submittedAt)}
              />
            )}
            {order.approvedBy && (
              <TimelineItem
                icon={CheckCircle2}
                title="Approved"
                description={`by ${order.approvedBy.name || order.approvedBy.email}`}
                date={
                  order.submittedAt
                    ? formatDateTime(order.submittedAt)
                    : undefined
                }
              />
            )}
            {order.status === "rejected" && (
              <TimelineItem
                icon={XCircle}
                title="Rejected"
                description={order.rejectionReason || undefined}
                iconClass="text-red-500"
              />
            )}
            {order.orderedAt && (
              <TimelineItem
                icon={Truck}
                title="Marked as Ordered"
                date={formatDateTime(order.orderedAt)}
              />
            )}
            {order.receivedAt && (
              <TimelineItem
                icon={Package}
                title="Received"
                date={formatDateTime(order.receivedAt)}
                iconClass="text-green-500"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
  iconClass,
}: {
  icon: typeof Clock;
  title: string;
  description?: string;
  date?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`p-2 bg-muted rounded-full h-fit ${iconClass || "text-muted-foreground"}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {date && <p className="text-xs text-muted-foreground mt-1">{date}</p>}
      </div>
    </div>
  );
}
