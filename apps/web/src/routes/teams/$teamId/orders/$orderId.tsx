import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/orders/$orderId")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Order Details</h1>
      <p className="text-muted-foreground">
        Order {orderId} details will be implemented in buildseason-c11
      </p>
    </div>
  );
}
