"use client";

import { useState } from "react";

import { usePathname } from "next/navigation";

import {
  BarChart3,
  Box,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  LayoutDashboard,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollapsibleNavButton } from "@/components/ui/collapsible-nav-button";
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

type SidebarProps = {
  className?: string;
  collapsed?: boolean;
  onToggleCollapsed?: (next: boolean) => void;
};

export function Sidebar({ className, collapsed: collapsedProp, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;

  const toggleCollapsed = () => {
    if (onToggleCollapsed) {
      onToggleCollapsed(!collapsed);
    } else {
      setCollapsedInternal((prev) => !prev);
    }
  };

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "group/sidebar flex h-full flex-col overflow-hidden border-r bg-card px-5 py-6 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-20 px-3" : "w-72",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="space-y-6">
          <div className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary transition-all duration-200",
                !collapsed && "w-12 text-base"
              )}
            >
              {collapsed ? "YT" : "Y"}
            </div>
            <div
              className="overflow-hidden pl-3 transition-[max-width,opacity] duration-200"
              style={{ maxWidth: collapsed ? 0 : 200, opacity: collapsed ? 0 : 1 }}
            >
              <div className="space-y-1">
                <h1 className="text-lg font-semibold leading-none">Yarn Tracker</h1>
                <p className="text-sm text-muted-foreground">Factory production control</p>
              </div>
            </div>
          </div>

          <nav className="space-y-4">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!collapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </span>
                )}
                <div className="grid gap-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <CollapsibleNavButton
                        key={item.href}
                        href={item.href}
                        icon={Icon}
                        label={item.label}
                        active={isActive}
                        collapsed={collapsed}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "mt-auto w-full justify-center gap-2 border-dashed transition-all duration-200",
            collapsed && "h-10 w-10 self-center rounded-xl px-0"
          )}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">Collapse sidebar</span>}
        </Button>
      </div>
    </aside>
  );
}
