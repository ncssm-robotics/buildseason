import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export const Route = createFileRoute("/team/$teamId/profile-setup")({
  component: ProfileSetupPage,
});

const COMMON_DIETARY_NEEDS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Kosher",
  "Halal",
];

const COMMON_OBSERVANCES = [
  "Shabbat",
  "Sunday worship",
  "Ramadan fasting",
  "No Friday evening",
  "No Sunday morning",
];

function ProfileSetupPage() {
  const navigate = useNavigate();
  const { teamId } = useParams({ from: "/team/$teamId/profile-setup" });
  const team = useQuery(api.teams.get, { teamId: teamId as Id<"teams"> });
  const membership = useQuery(api.members.getMyMembership, {
    teamId: teamId as Id<"teams">,
  });
  const updateProfile = useMutation(api.members.updateMyProfile);

  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [customDietary, setCustomDietary] = useState("");
  const [observances, setObservances] = useState<string[]>([]);
  const [customObservance, setCustomObservance] = useState("");
  const [anythingElse, setAnythingElse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDietary = (item: string) => {
    if (item && !dietaryNeeds.includes(item)) {
      setDietaryNeeds([...dietaryNeeds, item]);
    }
  };

  const handleRemoveDietary = (item: string) => {
    setDietaryNeeds(dietaryNeeds.filter((d) => d !== item));
  };

  const handleAddCustomDietary = () => {
    if (customDietary.trim()) {
      handleAddDietary(customDietary.trim());
      setCustomDietary("");
    }
  };

  const handleAddObservance = (item: string) => {
    if (item && !observances.includes(item)) {
      setObservances([...observances, item]);
    }
  };

  const handleRemoveObservance = (item: string) => {
    setObservances(observances.filter((o) => o !== item));
  };

  const handleAddCustomObservance = () => {
    if (customObservance.trim()) {
      handleAddObservance(customObservance.trim());
      setCustomObservance("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile({
        teamId: teamId as Id<"teams">,
        dietaryNeeds: dietaryNeeds.length > 0 ? dietaryNeeds : undefined,
        observances: observances.length > 0 ? observances : undefined,
        anythingElse: anythingElse.trim() || undefined,
      });
      navigate({ to: "/team/$teamId", params: { teamId } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate({ to: "/team/$teamId", params: { teamId } });
  };

  if (!team || !membership) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to {team.name}!</CardTitle>
          <CardDescription>
            Help your mentors support you better by sharing some optional
            information. This helps GLaDOS (our team assistant) personalize
            interactions and helps mentors plan events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dietary Needs */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">Dietary Needs</Label>
                <p className="text-sm text-muted-foreground">
                  Any food allergies, restrictions, or preferences?
                </p>
              </div>

              {dietaryNeeds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dietaryNeeds.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveDietary(item)}
                    >
                      {item}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {COMMON_DIETARY_NEEDS.filter(
                  (d) => !dietaryNeeds.includes(d)
                ).map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => handleAddDietary(item)}
                  >
                    + {item}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Other dietary need..."
                  value={customDietary}
                  onChange={(e) => setCustomDietary(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDietary();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomDietary}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Religious/Cultural Observances */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">Scheduling Considerations</Label>
                <p className="text-sm text-muted-foreground">
                  Any religious or cultural observances that affect your
                  availability?
                </p>
              </div>

              {observances.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {observances.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveObservance(item)}
                    >
                      {item}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {COMMON_OBSERVANCES.filter((o) => !observances.includes(o)).map(
                  (item) => (
                    <Badge
                      key={item}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => handleAddObservance(item)}
                    >
                      + {item}
                    </Badge>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Other scheduling consideration..."
                  value={customObservance}
                  onChange={(e) => setCustomObservance(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomObservance();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomObservance}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Anything Else */}
            <div className="space-y-2">
              <Label htmlFor="anythingElse" className="text-base">
                Anything Else?
              </Label>
              <p className="text-sm text-muted-foreground">
                Anything else you'd like your mentors to know?
              </p>
              <Textarea
                id="anythingElse"
                placeholder="E.g., transportation needs, learning style preferences, accessibility needs..."
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-4">
        You can update this information anytime from your profile settings.
      </p>
    </div>
  );
}
