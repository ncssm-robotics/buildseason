import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

interface AppLayoutProps {
  children: ReactNode;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
  teamName?: string;
}

export function AppLayout({ children, user, teamName }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader teamName={teamName} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
