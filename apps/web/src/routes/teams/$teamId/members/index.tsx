import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/members/")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Team Members</h1>
      <p className="text-muted-foreground">
        Team members will be implemented in buildseason-165
      </p>
    </div>
  );
}
