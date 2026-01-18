import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Minus, Plus as PlusIcon } from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/parts")({
  component: PartsPage,
});

function PartsPage() {
  const { program, number } = useParams({ from: "/team/$program/$number" });
  const team = useQuery(api.teams.getByProgramAndNumber, { program, number });
  const teamId = team?._id;
  const parts = useQuery(api.parts.list, teamId ? { teamId } : "skip");
  const vendors = useQuery(api.vendors.list, teamId ? { teamId } : "skip");
  const createPart = useMutation(api.parts.create);
  const adjustQuantity = useMutation(api.parts.adjustQuantity);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPart, setNewPart] = useState({
    name: "",
    sku: "",
    vendorId: "" as string,
    quantity: 0,
    reorderPoint: 5,
    location: "",
    unitPriceCents: 0,
  });

  const filteredParts = parts?.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePart = async () => {
    if (!teamId) return;
    await createPart({
      teamId,
      name: newPart.name,
      sku: newPart.sku || undefined,
      vendorId: newPart.vendorId
        ? (newPart.vendorId as Id<"vendors">)
        : undefined,
      quantity: newPart.quantity,
      reorderPoint: newPart.reorderPoint,
      location: newPart.location || undefined,
      unitPriceCents: newPart.unitPriceCents || undefined,
    });
    setIsCreateOpen(false);
    setNewPart({
      name: "",
      sku: "",
      vendorId: "",
      quantity: 0,
      reorderPoint: 5,
      location: "",
      unitPriceCents: 0,
    });
  };

  const handleAdjustQuantity = async (
    partId: Id<"parts">,
    adjustment: number
  ) => {
    await adjustQuantity({ partId, adjustment });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Parts Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team's parts and components
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
              <DialogDescription>
                Add a new part to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Part Name</Label>
                <Input
                  id="name"
                  value={newPart.name}
                  onChange={(e) =>
                    setNewPart({ ...newPart, name: e.target.value })
                  }
                  placeholder="e.g., 5mm Hex Shaft"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (optional)</Label>
                  <Input
                    id="sku"
                    value={newPart.sku}
                    onChange={(e) =>
                      setNewPart({ ...newPart, sku: e.target.value })
                    }
                    placeholder="REV-12-3456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={newPart.vendorId}
                    onValueChange={(v) =>
                      setNewPart({ ...newPart, vendorId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Initial Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={newPart.quantity}
                    onChange={(e) =>
                      setNewPart({
                        ...newPart,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    value={newPart.reorderPoint}
                    onChange={(e) =>
                      setNewPart({
                        ...newPart,
                        reorderPoint: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={newPart.location}
                    onChange={(e) =>
                      setNewPart({ ...newPart, location: e.target.value })
                    }
                    placeholder="Bin A-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Unit Price (cents)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={newPart.unitPriceCents}
                    onChange={(e) =>
                      setNewPart({
                        ...newPart,
                        unitPriceCents: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleCreatePart} className="w-full">
                Add Part
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No parts found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParts.map((part) => (
                  <TableRow key={part._id}>
                    <TableCell className="font-medium">
                      {part.name}
                      {part.quantity <= part.reorderPoint && (
                        <Badge variant="destructive" className="ml-2">
                          Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.sku || "-"}
                    </TableCell>
                    <TableCell>{part.vendorName || "-"}</TableCell>
                    <TableCell>{part.location || "-"}</TableCell>
                    <TableCell className="text-center">
                      {part.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {part.unitPriceCents
                        ? `$${(part.unitPriceCents / 100).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAdjustQuantity(part._id, -1)}
                          disabled={part.quantity <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAdjustQuantity(part._id, 1)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
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
