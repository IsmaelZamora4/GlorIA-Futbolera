import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/home">{children}</RequireAuth>;
}
