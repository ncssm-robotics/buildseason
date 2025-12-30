import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/robots/$robotId/bom/")({
  component: RobotBomPage,
});

function RobotBomPage() {
  const { robotId } = Route.useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Robot BOM</h1>
      <p className="text-muted-foreground">
        BOM for robot {robotId} will be implemented in buildseason-9rw
      </p>
    </div>
  );
}
