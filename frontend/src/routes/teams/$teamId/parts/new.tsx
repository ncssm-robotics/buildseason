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
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/parts/new")({
  component: NewPartPage,
});

interface Vendor {
  id: string;
  name: string;
}

function NewPartPage() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: 0,
    reorderPoint: "",
    location: "",
    unitPriceCents: "",
    description: "",
    vendorId: "",
  });

  // Fetch vendors for dropdown
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.get<Vendor[]>("/api/vendors"),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ id: string }>(`/api/teams/${teamId}/parts`, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "parts"] });
      toast.success("Part created successfully");
      navigate({
        to: "/teams/$teamId/parts/$partId",
        params: { teamId, partId: result.id },
      });
    },
    onError: () => {
      toast.error("Failed to create part");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const data: Record<string, unknown> = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      quantity: formData.quantity,
      reorderPoint: formData.reorderPoint
        ? parseInt(formData.reorderPoint)
        : null,
      location: formData.location.trim() || null,
      unitPriceCents: formData.unitPriceCents
        ? Math.round(parseFloat(formData.unitPriceCents) * 100)
        : null,
      description: formData.description.trim() || null,
      vendorId: formData.vendorId || null,
    };

    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams/$teamId/parts" params={{ teamId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parts
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Add New Part</h2>
        <p className="text-muted-foreground">Add a part to your inventory</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Part name"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
            />
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU
            </label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              placeholder="Part number or SKU"
            />
          </div>

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
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-medium">Inventory</h3>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium mb-1"
            >
              Initial Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Reorder Point */}
          <div>
            <label
              htmlFor="reorderPoint"
              className="block text-sm font-medium mb-1"
            >
              Reorder Point
            </label>
            <Input
              id="reorderPoint"
              type="number"
              min="0"
              value={formData.reorderPoint}
              onChange={(e) =>
                setFormData({ ...formData, reorderPoint: e.target.value })
              }
              placeholder="Low stock warning threshold"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-1"
            >
              Location
            </label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Storage location"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label
              htmlFor="unitPrice"
              className="block text-sm font-medium mb-1"
            >
              Unit Price ($)
            </label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPriceCents}
              onChange={(e) =>
                setFormData({ ...formData, unitPriceCents: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Part
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link to="/teams/$teamId/parts" params={{ teamId }}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
