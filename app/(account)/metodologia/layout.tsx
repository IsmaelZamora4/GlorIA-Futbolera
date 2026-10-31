import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";

export default function MethodologyLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/metodologia">{children}</RequireAuth>;
}
