import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/parts/$partId")({
  component: PartDetailPage,
});

function PartDetailPage() {
  const { partId } = Route.useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Part Details</h1>
      <p className="text-muted-foreground">
        Part {partId} details will be implemented in buildseason-t2e
      </p>
    </div>
  );
}
