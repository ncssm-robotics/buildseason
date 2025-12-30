import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Package,
  FileText,
  ShoppingCart,
  Store,
  Users,
  Settings,
  ChevronUp,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Dashboard", icon: Home, path: "" },
  { title: "Parts", icon: Package, path: "/parts" },
  { title: "BOM", icon: FileText, path: "/bom" },
  { title: "Orders", icon: ShoppingCart, path: "/orders" },
  { title: "Vendors", icon: Store, path: "/vendors" },
];

const teamNavItems = [
  { title: "Members", icon: Users, path: "/members" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

interface AppSidebarProps {
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const params = useParams({ strict: false });
  const teamId = params.teamId as string | undefined;
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const getTeamPath = (path: string) => {
    if (!teamId) return "/dashboard";
    return `/teams/${teamId}${path}`;
  };

  const isActive = (path: string) => {
    const fullPath = getTeamPath(path);
    if (path === "") {
      // Dashboard - exact match for team root
      return (
        currentPath === `/teams/${teamId}` ||
        currentPath === `/teams/${teamId}/`
      );
    }
    return currentPath.startsWith(fullPath);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">BS</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">BuildSeason</span>
                  <span className="text-xs text-muted-foreground">
                    Team Hub
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                  >
                    <a href={getTeamPath(item.path)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                  >
                    <a href={getTeamPath(item.path)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.image || undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Switch Team
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/auth/sign-out">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
