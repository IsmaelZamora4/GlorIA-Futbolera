import type { ReactNode } from "react";
import { HomeUserProvider } from "@/features/auth/components/HomeUserProvider";
import { getHomeUserProfile } from "@/features/auth/services/home-user-profile";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export async function RequireAuth({ children, nextPath = "/home" }: { children: ReactNode; nextPath?: string }) {
  const user = await requireAuthenticatedUser(nextPath);
  return <HomeUserProvider profile={getHomeUserProfile(user)}>{children}</HomeUserProvider>;
}
