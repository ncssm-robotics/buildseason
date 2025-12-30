import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/teams/new")({
  component: NewTeamPage,
});

const PROGRAMS = [
  { value: "ftc", label: "FIRST Tech Challenge (FTC)" },
  { value: "frc", label: "FIRST Robotics Competition (FRC)" },
  { value: "vex", label: "VEX Robotics" },
  { value: "mate", label: "MATE ROV" },
  { value: "tarc", label: "Team America Rocketry Challenge" },
  { value: "other", label: "Other" },
] as const;

type FormData = {
  program: string;
  number: string;
  name: string;
  season: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  // If we're past August, we're in the next season
  const seasonYear = now.getMonth() >= 7 ? year : year - 1;
  return `${seasonYear}-${seasonYear + 1}`;
}

function NewTeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    program: "ftc",
    number: "",
    name: "",
    season: getCurrentSeason(),
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.program) {
      newErrors.program = "Please select a program";
    }

    if (!formData.number.trim()) {
      newErrors.number = "Team number is required";
    } else if (!/^\d+$/.test(formData.number.trim())) {
      newErrors.number = "Team number must contain only digits";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    }

    if (!formData.season.trim()) {
      newErrors.season = "Season is required";
    } else if (!/^\d{4}-\d{4}$/.test(formData.season.trim())) {
      newErrors.season = "Season must be in format YYYY-YYYY (e.g., 2024-2025)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTeamMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create team");
      }
      return result as { id: string; program: string; number: string };
    },
    onSuccess: (data) => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
      // Navigate to the new team's dashboard
      navigate({
        to: "/team/$program/$number",
        params: { program: data.program, number: data.number },
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createTeamMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = createTeamMutation.isPending;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-lg mx-auto">
        <Link
          to="/onboarding"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">
              Create a Team
            </CardTitle>
            <CardDescription>
              Set up a new robotics team on BuildSeason
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) => handleChange("program", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="program">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map((program) => (
                      <SelectItem key={program.value} value={program.value}>
                        {program.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.program && (
                  <p className="text-sm text-destructive">{errors.program}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Team Number</Label>
                <Input
                  id="number"
                  placeholder="e.g., 5064"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  disabled={isLoading}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">{errors.number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Aperture Science"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Input
                  id="season"
                  placeholder="e.g., 2024-2025"
                  value={formData.season}
                  onChange={(e) => handleChange("season", e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Format: YYYY-YYYY (e.g., 2024-2025)
                </p>
                {errors.season && (
                  <p className="text-sm text-destructive">{errors.season}</p>
                )}
              </div>

              {createTeamMutation.isError && (
                <p className="text-sm text-destructive">
                  {createTeamMutation.error.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  "Create Team"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
