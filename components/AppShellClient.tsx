"use client";

import type { ReactNode } from "react";

import { AppSidebar, AppSidebarProvider, SidebarInset } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function AppShellClient({ children }: { children: ReactNode }) {
  return (
    <AppSidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar className="hidden shrink-0 lg:flex" />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 space-y-6 bg-muted/20 px-4 py-6 lg:px-8">{children}</main>
        </SidebarInset>
      </div>
    </AppSidebarProvider>
  );
}
