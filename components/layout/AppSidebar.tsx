"use client";

import { SportiaSidebar } from "@/components/layout/SportiaSidebar";

export function AppSidebar({ active }: { active: string }) {
  return <SportiaSidebar active={active} />;
}
