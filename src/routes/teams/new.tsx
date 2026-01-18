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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/teams/new")({
  component: NewTeamPage,
});

const PROGRAMS = [
  { value: "ftc", label: "FIRST Tech Challenge (FTC)" },
  { value: "frc", label: "FIRST Robotics Competition (FRC)" },
  { value: "vex", label: "VEX Robotics" },
  { value: "vexu", label: "VEX U" },
  { value: "other", label: "Other" },
];

function NewTeamPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const createTeam = useMutation(api.teams.create);
  const user = useQuery(api.users.getUser);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [program, setProgram] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill birthdate from user's existing data
  useEffect(() => {
    if (user?.birthdate && !birthdate) {
      const date = new Date(user.birthdate);
      setBirthdate(date.toISOString().split("T")[0]);
    }
  }, [user?.birthdate, birthdate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // User already has birthdate on file
  const hasBirthdate = !!user?.birthdate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Only pass birthdate if user doesn't have one or if they changed it
      const birthdateTimestamp = new Date(birthdate).getTime();
      const needsBirthdateUpdate =
        !hasBirthdate || birthdateTimestamp !== user?.birthdate;

      await createTeam({
        name,
        number,
        program,
        birthdate: needsBirthdateUpdate ? birthdateTimestamp : undefined,
      });
      navigate({ to: "/team/$program/$number", params: { program, number } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
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
            <CardTitle>Create a New Team</CardTitle>
            <CardDescription>
              Set up your robotics team to start tracking inventory and orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., The Robotics Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Team Number</Label>
                <Input
                  id="number"
                  placeholder="e.g., 12345"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Competition Program</Label>
                <Select value={program} onValueChange={setProgram} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Your Date of Birth</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
                <p className="text-sm text-muted-foreground">
                  {hasBirthdate
                    ? "Your birthdate is already on file. You can update it if needed."
                    : "Required for Youth Protection Program compliance. Team creators must be 18 or older and will be designated as a YPP contact."}
                </p>
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !program || (!hasBirthdate && !birthdate)
                  }
                >
                  {isSubmitting ? "Creating..." : "Create Team"}
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
