import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function MatchLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/partido">{children}</RequireAuth>;
}
