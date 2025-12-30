import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, handleResponse } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { AppLayout } from "@/components/layout/app-layout";

export const Route = createFileRoute("/team/$program/$number")({
  component: TeamLayout,
});

function TeamLayout() {
  const { program, number } = Route.useParams();

  const { data: user } = useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: async () => {
      const res = await api.api.user.$get();
      return handleResponse<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      }>(res);
    },
  });

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const res = await api.api.teams.$get();
      return handleResponse<
        Array<{
          id: string;
          program: string;
          name: string;
          number: string;
          season: string;
          role: string;
          stats: {
            partsCount: number;
            lowStockCount: number;
            pendingOrdersCount: number;
            activeOrdersCount: number;
          };
        }>
      >(res);
    },
  });

  const currentTeam = teams?.find(
    (t) => t.program === program && t.number === number
  );

  return (
    <AppLayout
      user={user}
      teams={teams}
      currentTeamId={currentTeam?.id}
      currentProgram={program}
      currentTeamNumber={number}
      teamName={
        currentTeam ? `#${currentTeam.number} ${currentTeam.name}` : undefined
      }
    >
      <Outlet />
    </AppLayout>
  );
}
