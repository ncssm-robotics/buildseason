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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/parts/$partId/edit")({
  component: EditPartPage,
});

interface Part {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number | null;
  location: string | null;
  unitPriceCents: number | null;
  description: string | null;
  vendorId: string | null;
  vendor: { id: string; name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
}

function EditPartPage() {
  const { teamId, partId } = Route.useParams();
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

  // Fetch part data
  const { data: part, isLoading: partLoading } = useQuery({
    queryKey: ["teams", teamId, "parts", partId],
    queryFn: () => api.get<Part>(`/api/teams/${teamId}/parts/${partId}`),
  });

  // Fetch vendors for dropdown
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.get<Vendor[]>("/api/vendors"),
  });

  // Populate form when part data loads
  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name,
        sku: part.sku || "",
        quantity: part.quantity,
        reorderPoint: part.reorderPoint?.toString() || "",
        location: part.location || "",
        unitPriceCents: part.unitPriceCents
          ? (part.unitPriceCents / 100).toFixed(2)
          : "",
        description: part.description || "",
        vendorId: part.vendorId || "",
      });
    }
  }, [part]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/api/teams/${teamId}/parts/${partId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "parts"] });
      toast.success("Part updated successfully");
      navigate({
        to: "/teams/$teamId/parts/$partId",
        params: { teamId, partId },
      });
    },
    onError: () => {
      toast.error("Failed to update part");
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

    updateMutation.mutate(data);
  };

  if (partLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Part not found</p>
        <Button asChild className="mt-4">
          <Link to="/teams/$teamId/parts" params={{ teamId }}>
            Back to Parts
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams/$teamId/parts/$partId" params={{ teamId, partId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Part
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Edit Part</h2>
        <p className="text-muted-foreground">Update part information</p>
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
              Quantity
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
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link to="/teams/$teamId/parts/$partId" params={{ teamId, partId }}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
