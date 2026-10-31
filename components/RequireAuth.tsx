import type { ReactNode } from "react";
import { HomeUserProvider } from "./HomeUserProvider";
import { getHomeUserProfile } from "../lib/auth/home-user-profile";
import { requireAuthenticatedUser } from "../lib/supabase/auth";

export async function RequireAuth({ children, nextPath = "/home" }: { children: ReactNode; nextPath?: string }) {
  const user = await requireAuthenticatedUser(nextPath);
  return <HomeUserProvider profile={getHomeUserProfile(user)}>{children}</HomeUserProvider>;
}
