import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Truck, Package } from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/orders")({
  component: OrdersPage,
});

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  ordered: "bg-blue-500",
  received: "bg-purple-500",
};

function OrdersPage() {
  const { program, number } = useParams({ from: "/team/$program/$number" });
  const team = useQuery(api.teams.getByProgramAndNumber, { program, number });
  const teamId = team?._id;
  const orders = useQuery(api.orders.list, teamId ? { teamId } : "skip");
  const canApprove = useQuery(
    api.orders.canApprove,
    teamId ? { teamId } : "skip"
  );

  const submitOrder = useMutation(api.orders.submit);
  const approveOrder = useMutation(api.orders.approve);
  const rejectOrder = useMutation(api.orders.reject);
  const markOrdered = useMutation(api.orders.markOrdered);
  const markReceived = useMutation(api.orders.markReceived);

  const handleSubmit = async (orderId: Id<"orders">) => {
    await submitOrder({ orderId });
  };

  const handleApprove = async (orderId: Id<"orders">) => {
    await approveOrder({ orderId });
  };

  const handleReject = async (orderId: Id<"orders">) => {
    const reason = prompt("Reason for rejection:");
    if (reason) {
      await rejectOrder({ orderId, reason });
    }
  };

  const handleMarkOrdered = async (orderId: Id<"orders">) => {
    await markOrdered({ orderId });
  };

  const handleMarkReceived = async (orderId: Id<"orders">) => {
    await markReceived({ orderId });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage part orders
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders === undefined ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.vendorName}
                    </TableCell>
                    <TableCell>{order.itemCount} items</TableCell>
                    <TableCell>
                      ${(order.totalCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${STATUS_COLORS[order.status]} text-white`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.createdByName}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => handleSubmit(order._id)}
                            >
                              Submit for Approval
                            </DropdownMenuItem>
                          )}
                          {order.status === "pending" && canApprove && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApprove(order._id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReject(order._id)}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "approved" && canApprove && (
                            <DropdownMenuItem
                              onClick={() => handleMarkOrdered(order._id)}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Mark as Ordered
                            </DropdownMenuItem>
                          )}
                          {order.status === "ordered" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkReceived(order._id)}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Mark as Received
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
