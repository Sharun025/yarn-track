"use client";

import { useMemo } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Box,
  ClipboardList,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSection,
  SidebarSectionLabel,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      { label: "Masters", href: "/masters", icon: Box },
      { label: "Transactions", href: "/transactions", icon: Repeat },
      { label: "Stock Audit", href: "/stock-audit", icon: ClipboardList },
      { label: "Job Cards", href: "/job-cards", icon: Workflow },
    ],
  },
  {
    title: "Analytics",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3 }],
  },
];

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();

  const sections = useMemo(() => navSections, []);
  const showLabels = !collapsed;

  return (
    <SidebarRoot className={className}>
      <SidebarHeader className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary transition-all duration-200",
            showLabels && "w-12 text-base"
          )}
        >
          {showLabels ? "Y" : "YT"}
        </div>
        {showLabels ? (
          <div className="flex-1 space-y-1 overflow-hidden">
            <Link href="/dashboard" className="block whitespace-nowrap text-lg font-semibold">
              Yarn Tracker
            </Link>
            <p className="text-sm text-muted-foreground">Factory production control</p>
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarSection key={section.title}>
            {showLabels ? <SidebarSectionLabel>{section.title}</SidebarSectionLabel> : null}
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      href={item.href}
                      active={isActive}
                      collapsed={!showLabels}
                      className={cn(
                        "gap-3",
                        showLabels ? "justify-start" : "justify-center px-2"
                      )}
                      title={!showLabels ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {showLabels ? <span className="flex-1 truncate text-sm">{item.label}</span> : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarSection>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarTrigger
          className={cn(
            "mt-4 w-full justify-center gap-2 border-dashed",
            collapsed && "h-10 w-10 self-center rounded-xl px-0"
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">Collapse sidebar</span>}
        </SidebarTrigger>
      </SidebarFooter>

      <SidebarRail
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:flex"
        onClick={() => setCollapsed(false)}
        aria-label="Expand sidebar"
      />
    </SidebarRoot>
  );
}

export function AppSidebarProvider({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

export { SidebarInset } from "@/components/ui/sidebar";
