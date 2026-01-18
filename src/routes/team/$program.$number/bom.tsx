import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, AlertTriangle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/bom")({
  component: BomPage,
});

function BomPage() {
  const { program, number } = useParams({ from: "/team/$program/$number" });
  const team = useQuery(api.teams.getByProgramAndNumber, { program, number });
  const teamId = team?._id;
  const bomBySubsystem = useQuery(
    api.bom.listBySubsystem,
    teamId ? { teamId } : "skip"
  );
  const subsystems = useQuery(
    api.bom.getSubsystems,
    teamId ? { teamId } : "skip"
  );
  const parts = useQuery(api.parts.list, teamId ? { teamId } : "skip");
  const shortages = useQuery(
    api.bom.getShortages,
    teamId ? { teamId } : "skip"
  );

  const createBomItem = useMutation(api.bom.create);
  const removeBomItem = useMutation(api.bom.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    partId: "",
    subsystem: "",
    quantityNeeded: 1,
    notes: "",
  });

  const handleCreate = async () => {
    if (!teamId) return;
    await createBomItem({
      teamId,
      partId: newItem.partId as Id<"parts">,
      subsystem: newItem.subsystem,
      quantityNeeded: newItem.quantityNeeded,
      notes: newItem.notes || undefined,
    });
    setIsCreateOpen(false);
    setNewItem({ partId: "", subsystem: "", quantityNeeded: 1, notes: "" });
  };

  const handleRemove = async (bomItemId: Id<"bomItems">) => {
    if (confirm("Remove this item from the BOM?")) {
      await removeBomItem({ bomItemId });
    }
  };

  const totalShortages = shortages?.length ?? 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Bill of Materials</h1>
          <p className="text-muted-foreground mt-1">
            Track parts needed for each subsystem
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add to BOM
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add BOM Item</DialogTitle>
              <DialogDescription>
                Add a part requirement to the bill of materials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Part</Label>
                <Select
                  value={newItem.partId}
                  onValueChange={(v) => setNewItem({ ...newItem, partId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a part" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts?.map((part) => (
                      <SelectItem key={part._id} value={part._id}>
                        {part.name}
                        {part.sku && ` (${part.sku})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subsystem</Label>
                <Input
                  value={newItem.subsystem}
                  onChange={(e) =>
                    setNewItem({ ...newItem, subsystem: e.target.value })
                  }
                  placeholder="e.g., Drivetrain, Arm, Intake"
                  list="subsystems"
                />
                <datalist id="subsystems">
                  {subsystems?.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Quantity Needed</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantityNeeded}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantityNeeded: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={newItem.notes}
                  onChange={(e) =>
                    setNewItem({ ...newItem, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={!newItem.partId || !newItem.subsystem}
              >
                Add to BOM
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shortages Alert */}
      {totalShortages > 0 && (
        <Card className="mb-8 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              {totalShortages} Part Shortage{totalShortages !== 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              These parts don't have enough inventory for the BOM
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* BOM by Subsystem */}
      {bomBySubsystem === undefined ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : Object.keys(bomBySubsystem).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No items in the BOM yet. Add parts to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bomBySubsystem).map(([subsystem, items]) => (
            <Card key={subsystem}>
              <CardHeader>
                <CardTitle>{subsystem}</CardTitle>
                <CardDescription>
                  {items.length} part{items.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Needed</TableHead>
                      <TableHead className="text-center">In Stock</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.partName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.partSku || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantityNeeded}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.currentQuantity}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.shortage > 0 ? (
                            <Badge variant="destructive">
                              Need {item.shortage}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-green-500 text-white"
                            >
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
