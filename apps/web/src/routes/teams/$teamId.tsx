import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId")({
  component: TeamLayout,
});

function TeamLayout() {
  const { teamId } = Route.useParams();

  return (
    <div className="min-h-screen bg-background">
      {/* Team layout with sidebar will be implemented in buildseason-1bg */}
      <div className="p-8">
        <div className="text-sm text-muted-foreground mb-4">
          Team: {teamId}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
