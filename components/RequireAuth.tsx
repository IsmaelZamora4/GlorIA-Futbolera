import type { ReactNode } from "react";
import { requireAuthenticatedUser } from "../lib/supabase/auth";

export async function RequireAuth({ children, nextPath = "/home" }: { children: ReactNode; nextPath?: string }) {
  await requireAuthenticatedUser(nextPath);
  return children;
}
