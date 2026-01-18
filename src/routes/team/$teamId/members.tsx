import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Copy, Check, User } from "lucide-react";

export const Route = createFileRoute("/team/$teamId/members")({
  component: MembersPage,
});

const ROLES = [
  {
    value: "lead_mentor",
    label: "Lead Mentor",
    description: "Full team management, YPP contact eligible",
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Can manage members and approve orders",
  },
  { value: "student", label: "Student", description: "Can view and request" },
];

function MembersPage() {
  const { teamId } = useParams({ from: "/team/$teamId" });
  const members = useQuery(api.members.list, { teamId: teamId as Id<"teams"> });
  const invites = useQuery(api.invites.list, { teamId: teamId as Id<"teams"> });
  const user = useQuery(api.users.getUser);

  const createInvite = useMutation(api.invites.create);
  const revokeInvite = useMutation(api.invites.revoke);
  const updateRole = useMutation(api.members.updateRole);
  const removeMember = useMutation(api.members.remove);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("student");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if current user is a mentor (can manage members)
  const currentMember = members?.find((m) => m.userId === user?._id);
  const isMentor =
    currentMember?.role === "lead_mentor" ||
    currentMember?.role === "mentor" ||
    currentMember?.role === "admin"; // backwards compat

  const handleCreateInvite = async () => {
    const { token } = await createInvite({
      teamId: teamId as Id<"teams">,
      role: inviteRole,
    });
    setGeneratedToken(token);
  };

  const handleCopyToken = async () => {
    if (generatedToken) {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeInvite = async (inviteId: Id<"teamInvites">) => {
    await revokeInvite({ inviteId });
  };

  const handleUpdateRole = async (
    memberId: Id<"teamMembers">,
    role: string
  ) => {
    await updateRole({ teamId: teamId as Id<"teams">, memberId, role });
  };

  const handleRemoveMember = async (memberId: Id<"teamMembers">) => {
    if (confirm("Remove this member from the team?")) {
      await removeMember({ teamId: teamId as Id<"teams">, memberId });
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and invites
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/team/$teamId/profile-setup" params={{ teamId }}>
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              Edit My Profile
            </Button>
          </Link>
          {isMentor && (
            <Dialog
              open={isInviteOpen}
              onOpenChange={(open) => {
                setIsInviteOpen(open);
                if (!open) {
                  setGeneratedToken(null);
                  setInviteRole("student");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Generate an invite code to share with a new team member
                  </DialogDescription>
                </DialogHeader>
                {generatedToken ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Invite Code</Label>
                      <div className="flex gap-2">
                        <Input
                          value={generatedToken}
                          readOnly
                          className="font-mono"
                        />
                        <Button onClick={handleCopyToken} variant="outline">
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this code with the person you want to invite. It
                        expires in 7 days.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setIsInviteOpen(false);
                        setGeneratedToken(null);
                      }}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <span className="font-medium">
                                  {role.label}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  - {role.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateInvite} className="w-full">
                      Generate Invite Code
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Members List */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members?.length ?? 0} member{members?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {isMentor && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members === undefined
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                : members.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.image ?? undefined} />
                            <AvatarFallback>
                              {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      {isMentor && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ROLES.map((role) => (
                                <DropdownMenuItem
                                  key={role.value}
                                  onClick={() =>
                                    handleUpdateRole(member._id, role.value)
                                  }
                                  disabled={member.role === role.value}
                                >
                                  Set as {role.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member._id)}
                                className="text-destructive"
                              >
                                Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {isMentor && invites && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>
              {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite._id}>
                    <TableCell className="font-mono">{invite.token}</TableCell>
                    <TableCell className="capitalize">{invite.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite._id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
