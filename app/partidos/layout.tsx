import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function MatchesLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/partidos">{children}</RequireAuth>;
}
