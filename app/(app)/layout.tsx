import type { ReactNode } from "react";

import AppShellClient from "@/components/AppShellClient";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShellClient>{children}</AppShellClient>;
}
