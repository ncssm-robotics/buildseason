import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/teams/join")({
  component: JoinTeamPage,
});

function JoinTeamPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Join a Team</CardTitle>
            <CardDescription>
              Enter an invite code to join an existing team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invite Code</Label>
              <Input id="code" placeholder="Enter invite code" />
            </div>
            <Button className="w-full" disabled>
              Join Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
