import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/orders/$orderId/edit")({
  component: EditOrderPage,
});

interface OrderItem {
  id?: string;
  partId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
}

interface Order {
  id: string;
  orderNumber: string | null;
  vendorId: string | null;
  notes: string | null;
  items: OrderItem[];
}

interface Vendor {
  id: string;
  name: string;
}

interface Part {
  id: string;
  name: string;
  sku: string | null;
  unitPriceCents: number | null;
}

function EditOrderPage() {
  const { teamId, orderId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vendorId: "",
    notes: "",
  });
  const [items, setItems] = useState<OrderItem[]>([]);

  // Fetch order data
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["teams", teamId, "orders", orderId],
    queryFn: () => api.get<Order>(`/api/teams/${teamId}/orders/${orderId}`),
  });

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.get<Vendor[]>("/api/vendors"),
  });

  // Fetch parts for dropdown
  const { data: parts } = useQuery({
    queryKey: ["teams", teamId, "parts"],
    queryFn: () => api.get<Part[]>(`/api/teams/${teamId}/parts`),
  });

  // Populate form when order loads
  useEffect(() => {
    if (order) {
      setFormData({
        vendorId: order.vendorId || "",
        notes: order.notes || "",
      });
      setItems(
        order.items.map((item) => ({
          id: item.id,
          partId: item.partId,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        }))
      );
    }
  }, [order]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      vendorId: string | null;
      notes: string | null;
      items: OrderItem[];
    }) => api.put(`/api/teams/${teamId}/orders/${orderId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teams", teamId, "orders", orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "orders"] });
      toast.success("Order updated successfully");
      navigate({
        to: "/teams/$teamId/orders/$orderId",
        params: { teamId, orderId },
      });
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { partId: null, description: "", quantity: 1, unitPriceCents: null },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number | null
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If selecting a part, auto-fill description and price
    if (field === "partId" && value && parts) {
      const part = parts.find((p) => p.id === value);
      if (part) {
        newItems[index].description = part.name;
        newItems[index].unitPriceCents = part.unitPriceCents;
      }
    }

    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one item with a description");
      return;
    }

    updateMutation.mutate({
      vendorId: formData.vendorId || null,
      notes: formData.notes.trim() || null,
      items: validItems,
    });
  };

  const orderTotal = items.reduce((sum, item) => {
    return sum + (item.unitPriceCents || 0) * item.quantity;
  }, 0);

  if (orderLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
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

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link
            to="/teams/$teamId/orders/$orderId"
            params={{ teamId, orderId }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Edit Order</h2>
        <p className="text-muted-foreground">
          {order.orderNumber || `ORD-${order.id.slice(0, 8)}`}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          {/* Vendor */}
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium mb-1">
              Vendor
            </label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) =>
                setFormData({ ...formData, vendorId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Optional notes for this order"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-semibold">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-32">Unit Price</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                <>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.partId || ""}
                          onValueChange={(value) =>
                            handleItemChange(index, "partId", value || null)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select part" />
                          </SelectTrigger>
                          <SelectContent>
                            {parts?.map((part) => (
                              <SelectItem key={part.id} value={part.id}>
                                {part.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.unitPriceCents
                              ? (item.unitPriceCents / 100).toFixed(2)
                              : ""
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPriceCents",
                              e.target.value
                                ? Math.round(parseFloat(e.target.value) * 100)
                                : null
                            )
                          }
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unitPriceCents
                          ? `$${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
                    <TableCell></TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No items yet. Add items to this order.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link
              to="/teams/$teamId/orders/$orderId"
              params={{ teamId, orderId }}
            >
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
