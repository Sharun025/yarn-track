"use client";

import { forwardRef } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CollapsibleNavButtonProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  className?: string;
};

const CollapsibleNavButton = forwardRef<HTMLAnchorElement, CollapsibleNavButtonProps>(
  ({ href, icon: Icon, label, active, collapsed = false, className }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          "grid w-full grid-cols-[auto_1fr] items-center rounded-lg py-2 text-sm transition-colors duration-200",
          active ? "bg-secondary text-secondary-foreground shadow-sm" : "hover:bg-accent hover:text-accent-foreground",
          collapsed ? "px-0 justify-items-center" : "gap-3 px-3",
          className
        )}
        title={collapsed ? label : undefined}
        style={{
          gridTemplateColumns: collapsed ? "auto" : "auto 1fr",
          columnGap: collapsed ? "0rem" : "0.75rem",
        }}
      >
        <Icon className="h-4 w-4" />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap text-left leading-none transition-[max-width,opacity] duration-200 ease-in-out",
            collapsed ? "opacity-0" : "opacity-100"
          )}
          style={{ maxWidth: collapsed ? 0 : 160 }}
          aria-hidden={collapsed}
        >
          {label}
        </span>
      </Link>
    );
  }
);
CollapsibleNavButton.displayName = "CollapsibleNavButton";

export { CollapsibleNavButton };
