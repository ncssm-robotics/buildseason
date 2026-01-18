import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Plus } from "lucide-react";

export const Route = createFileRoute("/team/$program/$number/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { program, number } = useParams({ from: "/team/$program/$number" });

  const team = useQuery(api.teams.getByProgramAndNumber, { program, number });
  const teamId = team?._id;
  const seasons = useQuery(api.seasons.list, teamId ? { teamId } : "skip");
  const members = useQuery(api.members.list, teamId ? { teamId } : "skip");
  const user = useQuery(api.users.getUser);

  const yppContacts = useQuery(
    api.teams.yppContacts.getYppContacts,
    teamId ? { teamId } : "skip"
  );

  const updateTeam = useMutation(api.teams.update);
  const createSeason = useMutation(api.seasons.create);
  const setActiveSeason = useMutation(api.seasons.setActive);
  const addYppContact = useMutation(api.teams.addYppContact);
  const removeYppContact = useMutation(api.teams.removeYppContact);

  const [teamName, setTeamName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonYear, setNewSeasonYear] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");

  // Check if current user is lead_mentor (admin maps to lead_mentor for backwards compat)
  const currentMember = members?.find((m) => m.userId === user?._id);
  const isAdmin =
    currentMember?.role === "admin" || currentMember?.role === "lead_mentor";

  // Initialize team name when data loads
  if (team && !teamName && team.name) {
    setTeamName(team.name);
  }

  const handleSaveTeam = async () => {
    if (!teamId || !teamName.trim()) return;

    setIsSaving(true);
    try {
      await updateTeam({
        teamId,
        name: teamName,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!teamId || !newSeasonName.trim() || !newSeasonYear.trim()) return;

    await createSeason({
      teamId,
      name: newSeasonName,
      year: newSeasonYear,
    });

    setNewSeasonName("");
    setNewSeasonYear("");
  };

  const handleSetActiveSeason = async (seasonId: string) => {
    if (!teamId) return;
    await setActiveSeason({
      teamId,
      seasonId: seasonId as Id<"seasons">,
    });
  };

  const handleAddYppContact = async () => {
    if (!teamId || !selectedMentorId) return;
    await addYppContact({
      teamId,
      userId: selectedMentorId as Id<"users">,
    });
    setSelectedMentorId("");
  };

  const handleRemoveYppContact = async (userId: Id<"users">) => {
    if (!teamId) return;
    await removeYppContact({ teamId, userId });
  };

  // Get mentors who aren't already YPP contacts for the dropdown
  const availableMentors =
    members?.filter(
      (m) =>
        (m.role === "mentor" || m.role === "lead_mentor") &&
        !yppContacts?.some((c) => c.userId === m.userId)
    ) ?? [];

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You don't have permission to view team settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Team Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team configuration
        </p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Basic information about your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              {team === undefined ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Number</Label>
                <Input value={team?.number ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Input value={team?.program?.toUpperCase() ?? ""} disabled />
              </div>
            </div>
            <Button
              onClick={handleSaveTeam}
              disabled={isSaving || !teamName.trim()}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Seasons */}
        <Card>
          <CardHeader>
            <CardTitle>Seasons</CardTitle>
            <CardDescription>
              Manage competition seasons for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Season */}
            <div className="space-y-2">
              <Label>Active Season</Label>
              {seasons === undefined ? (
                <Skeleton className="h-10 w-full" />
              ) : seasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No seasons created yet
                </p>
              ) : (
                <Select
                  value={team?.activeSeasonId ?? ""}
                  onValueChange={handleSetActiveSeason}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select active season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons
                      .filter((s) => !s.isArchived)
                      .map((season) => (
                        <SelectItem key={season._id} value={season._id}>
                          {season.name} ({season.year})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Season List */}
            {seasons && seasons.length > 0 && (
              <div className="space-y-2">
                <Label>All Seasons</Label>
                <div className="space-y-2">
                  {seasons.map((season) => (
                    <div
                      key={season._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{season.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {season.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {team?.activeSeasonId === season._id && (
                          <Badge>Active</Badge>
                        )}
                        {season.isArchived && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Season */}
            <div className="pt-4 border-t border-border">
              <Label className="mb-4 block">Create New Season</Label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonName">Season Name</Label>
                  <Input
                    id="seasonName"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    placeholder="e.g., Into The Deep"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonYear">Year</Label>
                  <Input
                    id="seasonYear"
                    value={newSeasonYear}
                    onChange={(e) => setNewSeasonYear(e.target.value)}
                    placeholder="e.g., 2024-2025"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateSeason}
                disabled={!newSeasonName.trim() || !newSeasonYear.trim()}
                variant="outline"
              >
                Create Season
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* YPP Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              YPP Contacts
            </CardTitle>
            <CardDescription>
              Adult mentors designated to receive safety alerts and manage youth
              protection compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current YPP Contacts */}
            {yppContacts === undefined ? (
              <Skeleton className="h-20 w-full" />
            ) : yppContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No YPP contacts assigned yet
              </p>
            ) : (
              <div className="space-y-2">
                {yppContacts.map((contact) => (
                  <div
                    key={contact.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact.email}
                        {contact.discordUsername && (
                          <span className="ml-2">
                            @{contact.discordUsername}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{contact.role}</Badge>
                      {yppContacts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveYppContact(contact.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add YPP Contact */}
            {availableMentors.length > 0 && (
              <div className="pt-4 border-t border-border">
                <Label className="mb-4 block">Add YPP Contact</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedMentorId}
                    onValueChange={setSelectedMentorId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMentors.map((mentor) => (
                        <SelectItem key={mentor.userId} value={mentor.userId}>
                          {mentor.name} ({mentor.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddYppContact}
                    disabled={!selectedMentorId}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
