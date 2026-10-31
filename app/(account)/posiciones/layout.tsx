import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";

export default function StandingsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/posiciones">{children}</RequireAuth>;
}
