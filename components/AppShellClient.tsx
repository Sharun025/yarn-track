"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function AppShellClient({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <Sidebar
        className="hidden shrink-0 lg:flex"
        collapsed={collapsed}
        onToggleCollapsed={(next) => setCollapsed(next)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 space-y-6 bg-muted/20 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
