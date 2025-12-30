import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-display">Your Teams</h1>
          <div className="flex gap-2">
            <Link to="/teams/new">
              <Button>Create Team</Button>
            </Link>
            <Link to="/teams/join">
              <Button variant="outline">Join Team</Button>
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          You don't belong to any teams yet. Create or join a team to get started.
        </p>
      </div>
    </div>
  );
}
