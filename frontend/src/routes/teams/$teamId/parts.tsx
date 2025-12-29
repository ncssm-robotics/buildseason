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
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/parts")({
  component: PartsPage,
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
  vendor: { id: string; name: string } | null;
}

function PartsPage() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [deletePartId, setDeletePartId] = useState<string | null>(null);

  // Fetch parts
  const { data: parts, isLoading } = useQuery({
    queryKey: ["teams", teamId, "parts", { lowStock: lowStockOnly }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (lowStockOnly) params.set("lowStock", "true");
      return api.get<Part[]>(`/api/teams/${teamId}/parts?${params}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (partId: string) =>
      api.delete(`/api/teams/${teamId}/parts/${partId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "parts"] });
      toast.success("Part deleted");
      setDeletePartId(null);
    },
    onError: () => {
      toast.error("Failed to delete part");
    },
  });

  // Filter for low stock
  const filteredParts = (parts || []).filter((part) => {
    if (!lowStockOnly) return true;
    return part.reorderPoint && part.quantity <= part.reorderPoint;
  });

  const lowStockCount = (parts || []).filter(
    (p) => p.reorderPoint && p.quantity <= p.reorderPoint
  ).length;

  const columns: ColumnDef<Part>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isLowStock =
          row.original.reorderPoint &&
          row.original.quantity <= row.original.reorderPoint;
        return (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                {row.original.description}
              </div>
            )}
            {isLowStock && (
              <Badge
                variant="outline"
                className="mt-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.sku || "-",
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "-",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isLowStock =
          row.original.reorderPoint &&
          row.original.quantity <= row.original.reorderPoint;
        return (
          <div>
            <span className={isLowStock ? "text-orange-600 font-medium" : ""}>
              {row.original.quantity}
            </span>
            {row.original.reorderPoint ? (
              <div className="text-xs text-muted-foreground">
                Reorder at {row.original.reorderPoint}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.location || "-",
    },
    {
      id: "actions",
      cell: ({ row }) => (
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
                  to: "/teams/$teamId/parts/$partId",
                  params: { teamId, partId: row.original.id },
                })
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/teams/$teamId/parts/$partId/edit",
                  params: { teamId, partId: row.original.id },
                })
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeletePartId(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredParts,
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
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
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
          <h2 className="text-2xl font-bold">Parts Inventory</h2>
          <p className="text-muted-foreground">
            {parts?.length || 0} parts
            {lowStockCount > 0 && (
              <span className="text-orange-600 ml-2">
                ({lowStockCount} low stock)
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link to="/teams/$teamId/parts/new" params={{ teamId }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, SKU, location..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="lowStock"
            checked={lowStockOnly}
            onCheckedChange={(checked) => setLowStockOnly(checked === true)}
          />
          <label htmlFor="lowStock" className="text-sm cursor-pointer">
            Low stock only
          </label>
        </div>
      </div>

      {/* Table */}
      {parts?.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No parts yet. Add your first part to get started.
          </p>
          <Button asChild>
            <Link to="/teams/$teamId/parts/new" params={{ teamId }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Link>
          </Button>
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
      <Dialog open={!!deletePartId} onOpenChange={() => setDeletePartId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePartId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletePartId && deleteMutation.mutate(deletePartId)
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
