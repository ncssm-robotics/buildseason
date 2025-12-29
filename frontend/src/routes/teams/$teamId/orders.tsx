import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/orders")({
  component: OrdersPage,
});

type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "ordered"
  | "received";

interface Order {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  totalCents: number | null;
  notes: string | null;
  createdAt: string;
  vendor: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  _count?: { items: number };
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

const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "rejected", label: "Rejected" },
];

function OrdersPage() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  // Check if user is mentor/admin (can approve orders)
  // This would normally come from team membership data
  const canApprove = true; // TODO: Check actual role from membership

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["teams", teamId, "orders", { status: statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api.get<Order[]>(`/api/teams/${teamId}/orders?${params}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.delete(`/api/teams/${teamId}/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "orders"] });
      toast.success("Order deleted");
      setDeleteOrderId(null);
    },
    onError: () => {
      toast.error("Failed to delete order");
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      action,
    }: {
      orderId: string;
      action: "submit" | "approve" | "reject" | "order" | "receive";
    }) => api.put(`/api/teams/${teamId}/orders/${orderId}/${action}`, {}),
    onSuccess: (_, { action }) => {
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

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.orderNumber || `ORD-${row.original.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "-",
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original._count?.items || 0,
    },
    {
      accessorKey: "totalCents",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.totalCents
          ? `$${(row.original.totalCents / 100).toFixed(2)}`
          : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigate({
                    to: "/teams/$teamId/orders/$orderId",
                    params: { teamId, orderId: order.id },
                  })
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>

              {/* Draft actions */}
              {order.status === "draft" && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate({
                        to: "/teams/$teamId/orders/$orderId/edit",
                        params: { teamId, orderId: order.id },
                      })
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        action: "submit",
                      })
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Approval
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteOrderId(order.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {/* Pending actions (mentor only) */}
              {order.status === "pending" && canApprove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        action: "approve",
                      })
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        action: "reject",
                      })
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}

              {/* Approved actions */}
              {order.status === "approved" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        action: "order",
                      })
                    }
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Mark as Ordered
                  </DropdownMenuItem>
                </>
              )}

              {/* Ordered actions */}
              {order.status === "ordered" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        action: "receive",
                      })
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Received
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders || [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground">{orders?.length || 0} orders</p>
        </div>
        <Button asChild>
          <Link to="/teams/$teamId/orders/new" params={{ teamId }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {orders?.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {statusFilter === "all"
              ? "No orders yet. Create your first order to get started."
              : `No ${statusFilter} orders found.`}
          </p>
          {statusFilter === "all" && (
            <Button asChild>
              <Link to="/teams/$teamId/orders/new" params={{ teamId }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteOrderId}
        onOpenChange={() => setDeleteOrderId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrderId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteOrderId && deleteMutation.mutate(deleteOrderId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
