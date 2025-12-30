import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useRouterState } from "@tanstack/react-router";

interface AppHeaderProps {
  teamName?: string;
}

export function AppHeader({ teamName }: AppHeaderProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Build breadcrumb from pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href?: string }[] = [];

    if (parts.includes("teams") && teamName) {
      breadcrumbs.push({ label: teamName });

      // Find the section after teamId
      const teamIdIndex = parts.indexOf("teams") + 1;
      const section = parts[teamIdIndex + 1];

      if (section) {
        const sectionLabels: Record<string, string> = {
          parts: "Parts",
          bom: "BOM",
          orders: "Orders",
          vendors: "Vendors",
          members: "Members",
          settings: "Settings",
        };
        const label = sectionLabels[section] || section;
        breadcrumbs.push({ label });
      }
    } else if (parts.includes("dashboard")) {
      breadcrumbs.push({ label: "Dashboard" });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
