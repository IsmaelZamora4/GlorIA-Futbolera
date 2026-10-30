import type { ReactNode } from "react";
import { RequireAuth } from "../../components/RequireAuth";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth nextPath="/configuracion">{children}</RequireAuth>;
}
