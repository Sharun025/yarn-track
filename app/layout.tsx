import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Yarn Tracker",
  description: "Track your projects with Supabase auth",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("min-h-full bg-background text-foreground antialiased font-sans")}> 
        {children}
      </body>
    </html>
  );
}
