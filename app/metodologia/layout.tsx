import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function MethodologyLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/metodologia">{children}</RequireAuth>;
}
