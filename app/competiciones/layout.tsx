import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function CompetitionsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/competiciones">{children}</RequireAuth>;
}
