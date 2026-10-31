import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";
import { ProfileSettings } from "@/features/auth/components/ProfileSettings";
import { getHomeUserProfile } from "@/features/auth/services/home-user-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=%2Fhome%2Fprofile");

  const profileQuery = await supabase.from("user_profiles")
    .select("display_name, timezone, favorite_competitions, avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const fallback = getHomeUserProfile(user);
  const avatarUrl = profileQuery.data
    ? profileQuery.data.avatar_path
      ? supabase.storage.from("profile-avatars").getPublicUrl(profileQuery.data.avatar_path).data.publicUrl
      : null
    : fallback.avatarUrl;
  const profile = {
    displayName: profileQuery.data?.display_name ?? fallback.displayName,
    email: user.email ?? "",
    avatarUrl,
    createdAt: user.created_at,
    timezone: profileQuery.data?.timezone ?? "America/Lima",
    favorites: profileQuery.data?.favorite_competitions ?? ["Premier League"],
    loadError: profileQuery.error?.code === "42P01"
      ? "Debes aplicar la migración de perfiles en Supabase antes de guardar cambios."
      : profileQuery.error ? "No se pudo cargar tu perfil guardado." : null,
  };

  return <div className="app-shell profile-shell"><AppSidebar active="Perfil" /><main className="main-area"><SportiaPageHeader title="Mi perfil" description="Consulta y actualiza los datos de tu cuenta." /><ProfileSettings profile={profile} /></main></div>;
}
