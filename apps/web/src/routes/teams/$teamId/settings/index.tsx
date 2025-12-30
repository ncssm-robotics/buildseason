import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/settings/")({
  component: TeamSettingsPage,
});

function TeamSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Team Settings</h1>
      <p className="text-muted-foreground">
        Team settings will be implemented later
      </p>
    </div>
  );
}
