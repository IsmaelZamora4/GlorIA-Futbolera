import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";

export default function MatchLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/partido">{children}</RequireAuth>;
}
