import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team/$program/$number/")({
  component: TeamOverviewPage,
});

function TeamOverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">Team Overview</h1>
      <p className="text-muted-foreground">
        Team dashboard content will be implemented in buildseason-093
      </p>
    </div>
  );
}
