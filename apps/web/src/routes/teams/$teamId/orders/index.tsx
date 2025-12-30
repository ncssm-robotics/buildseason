import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Orders</h1>
      <p className="text-muted-foreground">
        Orders list will be implemented in buildseason-sbt
      </p>
    </div>
  );
}
