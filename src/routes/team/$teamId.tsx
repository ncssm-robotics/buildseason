import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShoppingCart,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Convex site URL for Discord linking
const CONVEX_SITE_URL =
  import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") ||
  "https://enchanted-mastiff-533.convex.site";

export const Route = createFileRoute("/team/$teamId")({
  component: TeamLayout,
});

const NAV_ITEMS = [
  { path: "", label: "Overview", icon: LayoutDashboard },
  { path: "/parts", label: "Parts", icon: Package },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/bom", label: "BOM", icon: FileSpreadsheet },
  { path: "/members", label: "Members", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

function TeamLayout() {
  const navigate = useNavigate();
  const { teamId } = useParams({ from: "/team/$teamId" });
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  const team = useQuery(api.teams.get, { teamId: teamId as Id<"teams"> });
  const user = useQuery(api.users.getUser);
  const connectedAccounts = useQuery(api.providers.getConnectedAccounts);
  const completeLinkAccount = useMutation(
    api.discord.linkAccount.completeLinkAccount
  );

  const [linkStatus, setLinkStatus] = useState<
    "idle" | "linking" | "success" | "error"
  >("idle");

  // Get current path for active nav highlighting
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle Discord link callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordLinkToken = params.get("discord_link_token");

    if (discordLinkToken) {
      setLinkStatus("linking");
      completeLinkAccount({ token: discordLinkToken })
        .then(() => {
          setLinkStatus("success");
          const url = new URL(window.location.href);
          url.searchParams.delete("discord_link_token");
          window.history.replaceState({}, "", url.toString());
          setTimeout(() => setLinkStatus("idle"), 3000);
        })
        .catch(() => {
          setLinkStatus("error");
          const url = new URL(window.location.href);
          url.searchParams.delete("discord_link_token");
          window.history.replaceState({}, "", url.toString());
        });
    }
  }, [completeLinkAccount]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleLinkDiscord = () => {
    window.location.href = `${CONVEX_SITE_URL}/discord/link`;
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-background flex flex-col">
        {/* Team Header */}
        <div className="p-4 border-b border-border">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            All Teams
          </Link>
          {team === undefined ? (
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          ) : team ? (
            <div>
              <h2 className="font-semibold truncate">{team.name}</h2>
              <p className="text-sm text-muted-foreground">
                #{team.number} • {team.program.toUpperCase()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-destructive">Team not found</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const fullPath = `/team/${teamId}${item.path}`;
            const isActive =
              item.path === ""
                ? pathname === `/team/${teamId}`
                : pathname.startsWith(fullPath);

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left truncate">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Connected Accounts
              </DropdownMenuLabel>
              {/* GitHub - show connected or link option */}
              {connectedAccounts?.github ? (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <GitHubIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {connectedAccounts.github.username ?? "GitHub"}
                  </span>
                  <Check className="h-3 w-3 text-green-500 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
                  <GitHubIcon className="h-4 w-4" />
                  <span className="text-sm">GitHub</span>
                  <span className="text-xs ml-auto">(login to link)</span>
                </div>
              )}
              {/* Google - show connected or link option */}
              {connectedAccounts?.google ? (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <GoogleIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {connectedAccounts.google.username ??
                      connectedAccounts.google.displayName ??
                      "Google"}
                  </span>
                  <Check className="h-3 w-3 text-green-500 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
                  <GoogleIcon className="h-4 w-4" />
                  <span className="text-sm">Google</span>
                  <span className="text-xs ml-auto">(login to link)</span>
                </div>
              )}
              {/* Discord - show connected or link option */}
              {connectedAccounts?.discord ? (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                  <span className="text-sm">
                    {connectedAccounts.discord.username ?? "Discord"}
                  </span>
                  <Check className="h-3 w-3 text-green-500 ml-auto" />
                </div>
              ) : (
                <DropdownMenuItem
                  onClick={handleLinkDiscord}
                  disabled={linkStatus === "linking"}
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  {linkStatus === "linking"
                    ? "Linking..."
                    : linkStatus === "success"
                      ? "Linked!"
                      : "Link Discord"}
                  {linkStatus !== "linking" && linkStatus !== "success" && (
                    <LinkIcon className="ml-auto h-3 w-3 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              )}
              {/* Debug info - remove in production */}
              {connectedAccounts?._debug && (
                <p className="px-2 py-1 text-xs text-muted-foreground/50">
                  Auth:{" "}
                  {connectedAccounts._debug.authProviders.join(", ") || "none"}
                </p>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
