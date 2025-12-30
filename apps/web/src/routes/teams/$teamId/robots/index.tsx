import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/robots/")({
  component: RobotsPage,
});

function RobotsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Robots</h1>
      <p className="text-muted-foreground">
        Robots list will be implemented in buildseason-nz1
      </p>
    </div>
  );
}
