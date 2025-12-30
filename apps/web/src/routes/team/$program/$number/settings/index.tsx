import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team/$program/$number/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Team Settings</h1>
      <p className="text-muted-foreground">
        Team settings will be implemented in a future iteration
      </p>
    </div>
  );
}
