import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/bom")({
  component: BOMPage,
});

type Subsystem =
  | "drivetrain"
  | "intake"
  | "lift"
  | "scoring"
  | "electronics"
  | "hardware"
  | "other";

interface BOMItem {
  id: string;
  subsystem: Subsystem;
  quantityNeeded: number;
  notes: string | null;
  part: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
}

interface Part {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
}

const subsystems: { value: Subsystem; label: string }[] = [
  { value: "drivetrain", label: "Drivetrain" },
  { value: "intake", label: "Intake" },
  { value: "lift", label: "Lift" },
  { value: "scoring", label: "Scoring" },
  { value: "electronics", label: "Electronics" },
  { value: "hardware", label: "Hardware" },
  { value: "other", label: "Other" },
];

function BOMPage() {
  const { teamId } = Route.useParams();
  const queryClient = useQueryClient();

  const [openSections, setOpenSections] = useState<Set<Subsystem>>(
    new Set(subsystems.map((s) => s.value))
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BOMItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    partId: "",
    subsystem: "other" as Subsystem,
    quantityNeeded: 1,
    notes: "",
  });

  // Fetch BOM items
  const { data: bomItems, isLoading } = useQuery({
    queryKey: ["teams", teamId, "bom"],
    queryFn: () => api.get<BOMItem[]>(`/api/teams/${teamId}/bom`),
  });

  // Fetch parts for dropdown
  const { data: parts } = useQuery({
    queryKey: ["teams", teamId, "parts"],
    queryFn: () => api.get<Part[]>(`/api/teams/${teamId}/parts`),
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: {
      partId: string;
      subsystem: Subsystem;
      quantityNeeded: number;
      notes: string | null;
    }) => api.post(`/api/teams/${teamId}/bom`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "bom"] });
      toast.success("BOM item added");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add BOM item");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        subsystem: Subsystem;
        quantityNeeded: number;
        notes: string | null;
      };
    }) => api.put(`/api/teams/${teamId}/bom/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "bom"] });
      toast.success("BOM item updated");
      setEditItem(null);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update BOM item");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/teams/${teamId}/bom/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "bom"] });
      toast.success("BOM item deleted");
      setDeleteItemId(null);
    },
    onError: () => {
      toast.error("Failed to delete BOM item");
    },
  });

  const resetForm = () => {
    setFormData({
      partId: "",
      subsystem: "other",
      quantityNeeded: 1,
      notes: "",
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partId) {
      toast.error("Please select a part");
      return;
    }
    addMutation.mutate({
      partId: formData.partId,
      subsystem: formData.subsystem,
      quantityNeeded: formData.quantityNeeded,
      notes: formData.notes.trim() || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: {
        subsystem: formData.subsystem,
        quantityNeeded: formData.quantityNeeded,
        notes: formData.notes.trim() || null,
      },
    });
  };

  const openEditDialog = (item: BOMItem) => {
    setFormData({
      partId: item.part.id,
      subsystem: item.subsystem,
      quantityNeeded: item.quantityNeeded,
      notes: item.notes || "",
    });
    setEditItem(item);
  };

  const toggleSection = (subsystem: Subsystem) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(subsystem)) {
      newOpen.delete(subsystem);
    } else {
      newOpen.add(subsystem);
    }
    setOpenSections(newOpen);
  };

  // Group items by subsystem
  const groupedItems = subsystems.reduce(
    (acc, subsystem) => {
      acc[subsystem.value] = (bomItems || []).filter(
        (item) => item.subsystem === subsystem.value
      );
      return acc;
    },
    {} as Record<Subsystem, BOMItem[]>
  );

  // Calculate shortages
  const shortages = (bomItems || []).filter(
    (item) => item.quantityNeeded > item.part.quantity
  );

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill of Materials</h2>
          <p className="text-muted-foreground">
            {bomItems?.length || 0} items
            {shortages.length > 0 && (
              <span className="text-orange-600 ml-2">
                ({shortages.length} shortages)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {shortages.length > 0 && (
            <Button variant="outline" asChild>
              <Link to="/teams/$teamId/orders/new" params={{ teamId }}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order Shortages
              </Link>
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add BOM Item</DialogTitle>
                <DialogDescription>
                  Add a part to your Bill of Materials
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Part <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.partId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, partId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a part" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts?.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name} {part.sku && `(${part.sku})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subsystem
                  </label>
                  <Select
                    value={formData.subsystem}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        subsystem: value as Subsystem,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subsystems.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity Needed
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantityNeeded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantityNeeded: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <Input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Optional notes"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BOM Sections */}
      {bomItems?.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No BOM items yet. Add items to track what you need for your robot.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {subsystems.map((subsystem) => {
            const items = groupedItems[subsystem.value];
            if (items.length === 0) return null;

            const hasShortages = items.some(
              (item) => item.quantityNeeded > item.part.quantity
            );

            return (
              <Collapsible
                key={subsystem.value}
                open={openSections.has(subsystem.value)}
                onOpenChange={() => toggleSection(subsystem.value)}
              >
                <div className="rounded-lg border bg-card">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {openSections.has(subsystem.value) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{subsystem.label}</span>
                        <Badge variant="secondary">{items.length}</Badge>
                        {hasShortages && (
                          <Badge
                            variant="outline"
                            className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Shortages
                          </Badge>
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Needed</TableHead>
                          <TableHead className="text-right">In Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const shortage =
                            item.quantityNeeded > item.part.quantity;
                          const shortageAmount =
                            item.quantityNeeded - item.part.quantity;

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <Link
                                  to="/teams/$teamId/parts/$partId"
                                  params={{ teamId, partId: item.part.id }}
                                  className="hover:underline"
                                >
                                  {item.part.name}
                                </Link>
                              </TableCell>
                              <TableCell>{item.part.sku || "-"}</TableCell>
                              <TableCell className="text-right">
                                {item.quantityNeeded}
                              </TableCell>
                              <TableCell
                                className={`text-right ${shortage ? "text-orange-600 font-medium" : ""}`}
                              >
                                {item.part.quantity}
                              </TableCell>
                              <TableCell>
                                {shortage ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                  >
                                    Need {shortageAmount} more
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  >
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-32 truncate">
                                {item.notes || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteItemId(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit BOM Item</DialogTitle>
            <DialogDescription>Update {editItem?.part.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Subsystem
              </label>
              <Select
                value={formData.subsystem}
                onValueChange={(value) =>
                  setFormData({ ...formData, subsystem: value as Subsystem })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subsystems.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity Needed
              </label>
              <Input
                type="number"
                min="1"
                value={formData.quantityNeeded}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantityNeeded: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete BOM Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from your BOM?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteItemId && deleteMutation.mutate(deleteItemId)
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
