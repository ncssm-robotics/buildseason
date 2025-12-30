import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/teams/new")({
  component: NewTeamPage,
});

function NewTeamPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Create a Team</CardTitle>
            <CardDescription>
              Set up a new FTC or FRC team on BuildSeason
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Team creation form will be implemented in buildseason-edf
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
