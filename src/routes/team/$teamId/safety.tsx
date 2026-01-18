import { createFileRoute, useParams } from "@tanstack/react-router";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/team/$teamId/safety")({
  component: SafetyDashboardPage,
});

type AlertStatus = "pending" | "reviewed" | "resolved" | "all";

function SafetyDashboardPage() {
  const { teamId } = useParams({ from: "/team/$teamId" });
  const [statusFilter, setStatusFilter] = useState<AlertStatus>("pending");
  const [selectedAlertId, setSelectedAlertId] =
    useState<Id<"safetyAlerts"> | null>(null);

  const alerts = useQuery(api.safetyAlerts.listByTeam, {
    teamId: teamId as Id<"teams">,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const stats = useQuery(api.safetyAlerts.getStats, {
    teamId: teamId as Id<"teams">,
  });

  const selectedAlert = useQuery(
    api.safetyAlerts.get,
    selectedAlertId ? { alertId: selectedAlertId } : "skip"
  );

  const relatedLogs = useQuery(
    api.safetyAlerts.getRelatedLogs,
    selectedAlertId ? { alertId: selectedAlertId } : "skip"
  );

  const markReviewed = useMutation(api.safetyAlerts.markReviewed);
  const resolveAlert = useMutation(api.safetyAlerts.resolve);

  const [resolveNotes, setResolveNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const handleMarkReviewed = async (alertId: Id<"safetyAlerts">) => {
    await markReviewed({ alertId });
  };

  const handleResolve = async () => {
    if (!selectedAlertId) return;
    setIsResolving(true);
    try {
      await resolveAlert({
        alertId: selectedAlertId,
        notes: resolveNotes || undefined,
      });
      setSelectedAlertId(null);
      setResolveNotes("");
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-orange-500 border-orange-500"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <Eye className="mr-1 h-3 w-3" />
            Reviewed
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "crisis":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "escalation":
        return <Shield className="h-4 w-4 text-orange-500" />;
      case "review":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Safety Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Review flagged conversations and manage safety alerts
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending ?? <Skeleton className="h-8 w-12" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500">
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reviewed ?? <Skeleton className="h-8 w-12" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.resolved ?? <Skeleton className="h-8 w-12" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total ?? <Skeleton className="h-8 w-12" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      {stats && (stats.bySeverity.high > 0 || stats.bySeverity.medium > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">High</Badge>
                <span>{stats.bySeverity.high}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Medium</Badge>
                <span>{stats.bySeverity.medium}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Low</Badge>
                <span>{stats.bySeverity.low}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>
                Review and manage safety alerts from GLaDOS
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as AlertStatus)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts === undefined ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No alerts to review
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedAlertId(alert._id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAlertTypeIcon(alert.alertType)}
                        <span className="capitalize">{alert.alertType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {alert.triggerReason}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {alert.userId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(alert.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      {alert.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkReviewed(alert._id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog
        open={selectedAlertId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAlertId(null);
            setResolveNotes("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getAlertTypeIcon(selectedAlert.alertType)}
              Safety Alert Details
            </DialogTitle>
            <DialogDescription>
              Review the flagged content and related conversation history
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Type</Label>
                  <p className="capitalize">{selectedAlert.alertType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Severity
                  </Label>
                  <div>{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Status
                  </Label>
                  <div>{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Created
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedAlert.createdAt)}
                  </p>
                </div>
              </div>

              {/* Trigger Reason */}
              <div>
                <Label className="text-muted-foreground text-xs">
                  Trigger Reason
                </Label>
                <p className="mt-1">{selectedAlert.triggerReason}</p>
              </div>

              {/* Message Content */}
              <div>
                <Label className="text-muted-foreground text-xs">
                  Flagged Message
                </Label>
                <Card className="mt-1">
                  <CardContent className="p-4 bg-muted/50">
                    <p className="whitespace-pre-wrap">
                      {selectedAlert.messageContent}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Related Logs */}
              {relatedLogs && relatedLogs.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Recent Conversation History
                  </Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {relatedLogs.map((log) => (
                      <Card key={log._id} className="p-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>User</span>
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm mb-2">{log.userMessage}</p>
                        <div className="text-xs text-muted-foreground mb-1">
                          GLaDOS
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.agentResponse.slice(0, 200)}
                          {log.agentResponse.length > 200 ? "..." : ""}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes (if resolved) */}
              {selectedAlert.reviewNotes && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Review Notes
                  </Label>
                  <p className="mt-1 text-sm">{selectedAlert.reviewNotes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedAlert.status !== "resolved" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Resolution Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about how this was handled..."
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleResolve} disabled={isResolving}>
                      {isResolving ? "Resolving..." : "Mark as Resolved"}
                    </Button>
                    {selectedAlert.status === "pending" && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkReviewed(selectedAlert._id)}
                      >
                        Mark as Reviewed
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
