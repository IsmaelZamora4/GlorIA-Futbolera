import type { ReactNode } from "react";
import { HomeUserProvider } from "../../components/HomeUserProvider";
import { getHomeUserProfile } from "../../lib/auth/home-user-profile";
import { requireAuthenticatedUser } from "../../lib/supabase/auth";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser("/home");
  const profile = getHomeUserProfile(user);

  return <HomeUserProvider profile={profile}>{children}</HomeUserProvider>;
}
