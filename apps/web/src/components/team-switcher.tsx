import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LAST_TEAM_KEY = "buildseason:lastTeam";

export interface Team {
  id: string;
  program: string;
  name: string;
  number: string;
  season: string;
  role: string;
}

interface TeamSwitcherProps {
  currentTeamId?: string;
  teams: Team[];
  className?: string;
}

export function TeamSwitcher({
  currentTeamId,
  teams,
  className,
}: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const currentTeam = teams.find((t) => t.id === currentTeamId);

  // Persist last selected team to localStorage
  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem(LAST_TEAM_KEY, currentTeamId);
    }
  }, [currentTeamId]);

  const handleTeamChange = (team: Team) => {
    setOpen(false);
    // Navigate using program and number (no UUID in URL)
    window.location.href = `/team/${team.program}/${team.number}`;
  };

  const handleJoinTeam = () => {
    setOpen(false);
    navigate({ to: "/teams/join" });
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select team"
          className={cn("w-[200px] justify-between", className)}
        >
          {currentTeam ? (
            <span className="truncate">
              <span className="font-bold">#{currentTeam.number}</span>{" "}
              {currentTeam.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select team...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList>
            <CommandEmpty>No teams found.</CommandEmpty>
            <CommandGroup heading="Your Teams">
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={`${team.number} ${team.name}`}
                  onSelect={() => handleTeamChange(team)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentTeamId === team.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>
                      <span className="font-bold">#{team.number}</span>{" "}
                      {team.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {team.season} · {team.role}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleJoinTeam} className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Join another team
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Get the last selected team ID from localStorage
 */
export function getLastTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_TEAM_KEY);
}
