import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-6">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to BuildSeason. Select a team to get started.
        </p>
        {/* Dashboard content will be built in buildseason-093 */}
      </div>
    </div>
  );
}
