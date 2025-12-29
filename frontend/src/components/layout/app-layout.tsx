import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { useAuth } from "@/components/auth-provider";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  teamName?: string;
}

export function AppLayout({ children, breadcrumbs, teamName }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <AppSidebar
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                image: user.image ?? undefined,
              }
            : undefined
        }
        teamName={teamName}
      />
      <SidebarInset>
        <AppHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
