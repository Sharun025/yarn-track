"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      collapsed,
      toggle,
      setCollapsed,
    }),
    [collapsed, toggle]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

const baseSidebarClasses =
  "group/sidebar relative flex border-r bg-card text-card-foreground transition-all duration-200 ease-in-out";

export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <aside
        ref={ref}
        data-collapsed={collapsed}
        className={cn(baseSidebarClasses, collapsed ? "w-[80px]" : "w-[280px]", className)}
        {...props}
      >
        <div className="flex h-full w-full flex-col overflow-hidden pb-6" data-collapsed={collapsed}>
          {children}
        </div>
      </aside>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 pb-6 pt-6", className)} {...props} />
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 space-y-4 overflow-y-auto px-5", className)} {...props} />
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-auto px-5", className)} {...props} />
  )
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-h-screen flex-1 flex-col", className)} {...props} />
  )
);
SidebarInset.displayName = "SidebarInset";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { toggle, collapsed } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        toggle();
        props.onClick?.(event);
      }}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarRail = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <button
        ref={ref}
        type="button"
        data-collapsed={collapsed}
        className={cn(
          "inline-flex h-24 w-2 items-center justify-center rounded-full bg-border transition-opacity duration-200 hover:bg-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "opacity-100" : "opacity-0",
          className
        )}
        tabIndex={collapsed ? 0 : -1}
        aria-hidden={!collapsed}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = "SidebarRail";

export const SidebarSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
);
SidebarSection.displayName = "SidebarSection";

export const SidebarSectionLabel = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)} {...props} />
  )
);
SidebarSectionLabel.displayName = "SidebarSectionLabel";

export const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-1", className)} {...props} />
  )
);
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("group/menu-item", className)} {...props} />
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { active?: boolean; collapsed?: boolean }
>(({ className, active, collapsed, children, ...props }, ref) => (
  <a
    ref={ref}
    data-active={active}
    data-collapsed={collapsed}
    className={cn(
      "group/menu-button flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[collapsed=true]:justify-center",
      active && "bg-muted text-foreground shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </a>
));
SidebarMenuButton.displayName = "SidebarMenuButton";
