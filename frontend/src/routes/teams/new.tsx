import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/new")({
  component: NewTeamPage,
});

function NewTeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    teamNumber: "",
    season: "",
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      teamNumber: number | null;
      season: string | null;
    }) => api.post<{ id: string }>("/api/teams", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created successfully");
      navigate({
        to: "/teams/$teamId",
        params: { teamId: result.id },
      });
    },
    onError: () => {
      toast.error("Failed to create team");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      teamNumber: formData.teamNumber ? parseInt(formData.teamNumber) : null,
      season: formData.season.trim() || null,
    });
  };

  // Get current season suggestion (e.g., "2024-2025")
  const currentYear = new Date().getFullYear();
  const seasonSuggestion = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <Link
            to="/dashboard"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <span>Create Team</span>
        </div>
      </header>
      <main className="container mx-auto max-w-md px-4 py-8">
        <h2 className="mb-2 text-2xl font-bold">Create New Team</h2>
        <p className="mb-6 text-muted-foreground">
          Set up a new robotics team for the season
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            {/* Team Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Team Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Aperture Science"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your team's display name
              </p>
            </div>

            {/* Team Number */}
            <div>
              <label
                htmlFor="teamNumber"
                className="block text-sm font-medium mb-1"
              >
                Team Number
              </label>
              <Input
                id="teamNumber"
                type="number"
                min="1"
                value={formData.teamNumber}
                onChange={(e) =>
                  setFormData({ ...formData, teamNumber: e.target.value })
                }
                placeholder="e.g., 5064"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your official FRC/FTC team number (optional)
              </p>
            </div>

            {/* Season */}
            <div>
              <label
                htmlFor="season"
                className="block text-sm font-medium mb-1"
              >
                Season
              </label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) =>
                  setFormData({ ...formData, season: e.target.value })
                }
                placeholder={seasonSuggestion}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Competition season (e.g., {seasonSuggestion})
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Team
            </Button>
            <Button variant="outline" type="button" asChild>
              <Link to="/dashboard">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
