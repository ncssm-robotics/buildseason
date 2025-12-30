import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/robots/$robotId/")({
  component: RobotDetailPage,
});

function RobotDetailPage() {
  const { robotId } = Route.useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Robot Details</h1>
      <p className="text-muted-foreground">
        Robot {robotId} details and BOM will be implemented in buildseason-9rw
      </p>
    </div>
  );
}
