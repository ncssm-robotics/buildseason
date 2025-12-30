import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team/$program/$number/parts/")({
  component: PartsPage,
});

function PartsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Parts Inventory</h1>
      <p className="text-muted-foreground">
        Parts inventory will be implemented in buildseason-c4h
      </p>
    </div>
  );
}
