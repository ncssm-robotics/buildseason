import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  UserPlus,
  Copy,
  Check,
  Trash2,
  LogOut,
  Shield,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teams/$teamId/members")({
  component: MembersPage,
});

type Role = "admin" | "mentor" | "student";

interface Member {
  id: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  inviteCode: string | null;
}

const roleColors: Record<Role, string> = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  mentor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  student: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  mentor: "Mentor",
  student: "Student",
};

function MembersPage() {
  const { teamId } = Route.useParams();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch team details
  const { data: team } = useQuery({
    queryKey: ["teams", teamId],
    queryFn: () => api.get<Team>(`/api/teams/${teamId}`),
  });

  // Fetch members
  const { data: members, isLoading } = useQuery({
    queryKey: ["teams", teamId, "members"],
    queryFn: () => api.get<Member[]>(`/api/teams/${teamId}/members`),
  });

  // Current user's membership
  const currentMembership = members?.find((m) => m.user.id === currentUser?.id);
  const isAdmin = currentMembership?.role === "admin";
  const isMentorOrAbove =
    currentMembership?.role === "admin" || currentMembership?.role === "mentor";

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      api.put(`/api/teams/${teamId}/members/${memberId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "members"] });
      toast.success("Role updated");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/api/teams/${teamId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "members"] });
      toast.success("Member removed");
      setRemoveMemberId(null);
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  // Leave team mutation
  const leaveMutation = useMutation({
    mutationFn: () =>
      api.delete(`/api/teams/${teamId}/members/${currentMembership?.id}`),
    onSuccess: () => {
      toast.success("Left team");
      window.location.href = "/dashboard";
    },
    onError: () => {
      toast.error("Failed to leave team");
    },
  });

  // Generate invite link mutation
  const generateInviteMutation = useMutation({
    mutationFn: () =>
      api.post<{ inviteCode: string }>(`/api/teams/${teamId}/invite`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId] });
      toast.success("Invite link generated");
    },
    onError: () => {
      toast.error("Failed to generate invite link");
    },
  });

  const inviteUrl = team?.inviteCode
    ? `${window.location.origin}/join/${team.inviteCode}`
    : null;

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">
            {members?.length || 0} members
          </p>
        </div>
      </div>

      {/* Invite Section */}
      {isMentorOrAbove && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Invite Members</h3>
                <p className="text-sm text-muted-foreground">
                  Share this link to invite new members
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {inviteUrl ? (
                <>
                  <Button variant="outline" size="sm" onClick={copyInviteLink}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateInviteMutation.mutate()}
                      disabled={generateInviteMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => generateInviteMutation.mutate()}
                  disabled={generateInviteMutation.isPending}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Generate Invite Link
                </Button>
              )}
            </div>
          </div>
          {inviteUrl && (
            <div className="mt-3 p-2 bg-muted rounded text-sm font-mono truncate">
              {inviteUrl}
            </div>
          )}
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => {
              const isCurrentUser = member.user.id === currentUser?.id;
              const canManage = isAdmin && !isCurrentUser;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.user.image || undefined}
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="text-muted-foreground ml-2">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({
                            memberId: member.id,
                            role: value as Role,
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={roleColors[member.role]}
                      >
                        {roleLabels[member.role]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(canManage || isCurrentUser) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isCurrentUser && members.length > 1 && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setLeaveDialogOpen(true)}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Leave Team
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setRemoveMemberId(member.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from Team
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Remove member dialog */}
      <Dialog
        open={!!removeMemberId}
        onOpenChange={() => setRemoveMemberId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the team? They
              will lose access to all team resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                removeMemberId && removeMutation.mutate(removeMemberId)
              }
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave team dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this team? You will lose access to
              all team resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
