"use client";

import { SportiaSidebar } from "./SportiaSidebar";

export function AppSidebar({ active }: { active: string }) {
  return <SportiaSidebar active={active} />;
}
