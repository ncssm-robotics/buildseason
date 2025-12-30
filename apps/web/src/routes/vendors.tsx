import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-6">Vendor Directory</h1>
        <p className="text-muted-foreground">
          Vendor directory will be implemented in buildseason-xnw
        </p>
      </div>
    </div>
  );
}
