import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/teams/join")({
  component: JoinTeamPage,
});

function JoinTeamPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const acceptInvite = useMutation(api.invites.accept);

  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Look up invite details as user types
  const invite = useQuery(
    api.invites.getByToken,
    token.length >= 6 ? { token } : "skip"
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite?.team) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await acceptInvite({ token });
      // Redirect to profile setup for new members
      navigate({
        to: "/team/$program/$number/profile-setup",
        params: { program: invite.team.program, number: invite.team.number },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join team");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
            <CardDescription>
              Enter the invite code you received from your team admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token">Invite Code</Label>
                <Input
                  id="token"
                  placeholder="Enter your invite code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toLowerCase())}
                  className="font-mono"
                  required
                />
              </div>

              {invite && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{invite.team?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Team #{invite.team?.number} •{" "}
                        {invite.team?.program.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll join as:{" "}
                        <span className="capitalize">{invite.role}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting || !invite}>
                  {isSubmitting ? "Joining..." : "Join Team"}
                </Button>
                <Link to="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
