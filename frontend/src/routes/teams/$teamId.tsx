import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { AppLayout } from "@/components/layout/app-layout";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/teams/$teamId")({
  component: TeamLayout,
});

function TeamLayout() {
  const { teamId } = Route.useParams();
  const { isAuthenticated, isPending } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isPending, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // TODO: Fetch team data from API
  const teamName = `Team ${teamId}`;

  return (
    <AppLayout
      teamName={teamName}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: teamName },
      ]}
    >
      <Outlet />
    </AppLayout>
  );
}
