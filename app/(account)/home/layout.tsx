import type { ReactNode } from "react";
import { HomeUserProvider } from "@/features/auth/components/HomeUserProvider";
import { getHomeUserProfile } from "@/features/auth/services/home-user-profile";
import { createAvatarSignedUrl } from "@/features/auth/services/avatar-url";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser("/home");
  const profile = getHomeUserProfile(user);
  const supabase = await createClient();
  const storedProfile = await supabase.from("user_profiles")
    .select("display_name, avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const avatarUrl = storedProfile.data
    ? await createAvatarSignedUrl(supabase, user.id, storedProfile.data.avatar_path)
    : profile.avatarUrl;
  const displayName = storedProfile.data?.display_name ?? profile.displayName;
  const accountProfile = {
    ...profile,
    displayName,
    firstName: displayName.split(/\s+/u)[0] || profile.firstName,
    avatarUrl,
  };

  return <HomeUserProvider profile={accountProfile}>{children}</HomeUserProvider>;
}
