import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type RobotStatus } from "@/components/ui/status-badge";
import { ArrowLeft, Loader2, Bot, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/team/$program/$number/robots/$robotId/")(
  {
    component: EditRobotPage,
  }
);

type Robot = {
  id: string;
  name: string;
  description: string | null;
  status: RobotStatus;
  seasonId: string;
};

const statusOptions: {
  value: RobotStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "planning",
    label: "Planning",
    description: "Robot is in the design and planning phase",
  },
  {
    value: "building",
    label: "Building",
    description: "Robot is actively being built",
  },
  {
    value: "competition_ready",
    label: "Competition Ready",
    description: "Robot is complete and ready for competition",
  },
];

function EditRobotPage() {
  const { program, number, robotId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning" as RobotStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get team info
  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<
        Array<{ id: string; program: string; number: string; role: string }>
      >;
    },
  });

  const currentTeam = teams?.find(
    (t) => t.program === program && t.number === number
  );
  const teamId = currentTeam?.id;

  // Fetch robot data
  const { data: robot, isLoading } = useQuery({
    queryKey: ["teams", teamId, "robots", robotId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/robots/${robotId}`);
      if (!res.ok) throw new Error("Failed to fetch robot");
      return res.json() as Promise<Robot>;
    },
    enabled: !!teamId,
  });

  // Populate form when robot data loads
  useEffect(() => {
    if (robot) {
      setFormData({
        name: robot.name,
        description: robot.description || "",
        status: robot.status,
      });
    }
  }, [robot]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/teams/${teamId}/robots/${robotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          status: data.status,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update robot");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Robot updated");
      queryClient.invalidateQueries({
        queryKey: ["teams", teamId, "robots"],
      });
      navigate({
        to: "/team/$program/$number/robots",
        params: { program, number },
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Robot name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="text-center py-12">
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Robot not found</h2>
        <p className="text-muted-foreground mb-4">
          This robot may have been deleted or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/team/$program/$number/robots" params={{ program, number }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Robots
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link
          to="/team/$program/$number/robots"
          params={{ program, number }}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Robots
        </Link>
        <Button variant="outline" asChild>
          <Link
            to="/team/$program/$number/robots/$robotId/bom"
            params={{ program, number, robotId }}
          >
            <Layers className="mr-2 h-4 w-4" />
            View BOM
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Robot</CardTitle>
          <CardDescription>Update robot information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Robot Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Cheddar, V1, Competition Bot"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional notes about this robot..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid gap-3">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.status === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          status: option.value,
                        }))
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <StatusBadge status={option.value} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Disassembled and Archived statuses are set through
                specific workflows.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link
                  to="/team/$program/$number/robots"
                  params={{ program, number }}
                >
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
