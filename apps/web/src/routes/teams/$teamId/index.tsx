import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/")({
  component: TeamOverviewPage,
});

function TeamOverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Team Overview</h1>
      <p className="text-muted-foreground">
        Team dashboard content will be implemented in buildseason-093
      </p>
    </div>
  );
}
