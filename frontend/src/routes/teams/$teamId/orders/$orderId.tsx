import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  Package,
  Building2,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/orders/$orderId")({
  component: OrderDetailPage,
});

type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "ordered"
  | "received";

interface OrderItem {
  id: string;
  partId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
  part: { id: string; name: string; sku: string | null } | null;
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalCents: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  items: OrderItem[];
}

const statusColors: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ordered:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
  received: "Received",
};

function OrderDetailPage() {
  const { teamId, orderId } = Route.useParams();
  const queryClient = useQueryClient();

  const canApprove = true; // TODO: Check actual role from membership

  const { data: order, isLoading } = useQuery({
    queryKey: ["teams", teamId, "orders", orderId],
    queryFn: () => api.get<Order>(`/api/teams/${teamId}/orders/${orderId}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (
      action: "submit" | "approve" | "reject" | "order" | "receive"
    ) => api.put(`/api/teams/${teamId}/orders/${orderId}/${action}`, {}),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({
        queryKey: ["teams", teamId, "orders", orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "orders"] });
      const messages: Record<string, string> = {
        submit: "Order submitted for approval",
        approve: "Order approved",
        reject: "Order rejected",
        order: "Order marked as ordered",
        receive: "Order marked as received",
      };
      toast.success(messages[action]);
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4">
          <Link to="/teams/$teamId/orders" params={{ teamId }}>
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const orderTotal = order.items.reduce((sum, item) => {
    return sum + (item.unitPriceCents || 0) * item.quantity;
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams/$teamId/orders" params={{ teamId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {order.orderNumber || `ORD-${order.id.slice(0, 8)}`}
              <Badge variant="outline" className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </h2>
            {order.vendor && (
              <p className="text-muted-foreground mt-1">{order.vendor.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            {order.status === "draft" && (
              <>
                <Button variant="outline" asChild>
                  <Link
                    to="/teams/$teamId/orders/$orderId/edit"
                    params={{ teamId, orderId }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate("submit")}
                  disabled={updateStatusMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              </>
            )}
            {order.status === "pending" && canApprove && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => updateStatusMutation.mutate("reject")}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate("approve")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {order.status === "approved" && (
              <Button
                onClick={() => updateStatusMutation.mutate("order")}
                disabled={updateStatusMutation.isPending}
              >
                <Package className="mr-2 h-4 w-4" />
                Mark as Ordered
              </Button>
            )}
            {order.status === "ordered" && (
              <Button
                onClick={() => updateStatusMutation.mutate("receive")}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Received
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Order Details</h3>
          <dl className="space-y-4">
            {order.vendor && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Vendor</dt>
                  <dd className="font-medium">{order.vendor.name}</dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
            {order.createdBy && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Created By</dt>
                  <dd className="font-medium">{order.createdBy.name}</dd>
                </div>
              </div>
            )}
            {order.approvedBy && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <dt className="text-sm text-muted-foreground">Approved By</dt>
                  <dd className="font-medium">{order.approvedBy.name}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Notes</h3>
          {order.notes ? (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-sm">{order.notes}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No notes added.</p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h3 className="font-semibold">Line Items</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.length > 0 ? (
              <>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.part?.name || item.description}
                    </TableCell>
                    <TableCell>{item.part?.sku || "-"}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unitPriceCents
                        ? `$${(item.unitPriceCents / 100).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unitPriceCents
                        ? `$${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${(orderTotal / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No items in this order.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
