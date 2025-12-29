import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/orders/new")({
  component: NewOrderPage,
});

interface OrderItem {
  partId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
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

function NewOrderPage() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vendorId: "",
    notes: "",
  });
  const [items, setItems] = useState<OrderItem[]>([
    { partId: null, description: "", quantity: 1, unitPriceCents: null },
  ]);

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      vendorId: string | null;
      notes: string | null;
      items: OrderItem[];
    }) => api.post<{ id: string }>(`/api/teams/${teamId}/orders`, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "orders"] });
      toast.success("Order created successfully");
      navigate({
        to: "/teams/$teamId/orders/$orderId",
        params: { teamId, orderId: result.id },
      });
    },
    onError: () => {
      toast.error("Failed to create order");
    },
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { partId: null, description: "", quantity: 1, unitPriceCents: null },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Order must have at least one item");
      return;
    }
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

    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one item with a description");
      return;
    }

    createMutation.mutate({
      vendorId: formData.vendorId || null,
      notes: formData.notes.trim() || null,
      items: validItems,
    });
  };

  const orderTotal = items.reduce((sum, item) => {
    return sum + (item.unitPriceCents || 0) * item.quantity;
  }, 0);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams/$teamId/orders" params={{ teamId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Create New Order</h2>
        <p className="text-muted-foreground">Add items to create a new order</p>
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
                        handleItemChange(index, "description", e.target.value)
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
                      disabled={items.length === 1}
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
            </TableBody>
          </Table>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Order
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link to="/teams/$teamId/orders" params={{ teamId }}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
