"use client";

import { Menu } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0" side="left">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
        <Sidebar className="h-[calc(100vh-4.5rem)] border-0" />
          </SheetContent>
        </Sheet>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operations command center
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Daily production snapshot
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="hidden md:flex">
          View shift plan
        </Button>
        <Button size="sm" className="hidden md:flex">
          Log production
        </Button>
        <div className="flex items-center gap-3 rounded-full border bg-card px-3 py-1.5">
          <Avatar className="h-9 w-9">
            <AvatarFallback>SS</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-sm font-medium">Sharun Supervisor</p>
            <p className="text-xs text-muted-foreground">
              Shift A · Spinning Line
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
