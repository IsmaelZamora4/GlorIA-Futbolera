"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedTimezones = new Set([
  "America/Lima",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "Europe/Madrid",
]);
const allowedCompetitions = new Set([
  "Liga 1",
  "Premier League",
  "Serie A",
  "LaLiga",
  "Ligue 1",
  "Bundesliga",
  "Champions League",
  "Europa League",
]);

async function getUserAndClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

function refreshProfile() {
  revalidatePath("/home/profile");
  revalidatePath("/home");
}

export async function saveProfileDetails(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "");
  const rawFavorites = formData.getAll("favorites").map(String);
  const favorites = [...new Set(rawFavorites)];
  if (displayName.length < 1 || displayName.length > 80) return { error: "El nombre debe tener entre 1 y 80 caracteres." };
  if (!allowedTimezones.has(timezone)) return { error: "Selecciona una zona horaria válida." };
  if (favorites.some((item) => !allowedCompetitions.has(item))) return { error: "Hay una competición no válida." };

  const { supabase, user } = await getUserAndClient();
  if (!user) return { error: "Tu sesión ha caducado. Inicia sesión de nuevo." };

  const { data: currentProfile } = await supabase.from("user_profiles").select("avatar_path").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: displayName,
    timezone,
    favorite_competitions: favorites,
    avatar_path: currentProfile?.avatar_path ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: "No se pudieron guardar tus cambios. Inténtalo de nuevo." };

  refreshProfile();
  return { success: "Perfil actualizado." };
}

export async function saveAvatarPath(path: string) {
  const { supabase, user } = await getUserAndClient();
  if (!user) return { error: "Tu sesión ha caducado. Inicia sesión de nuevo." };
  const validPath = new RegExp(`^${user.id}/avatar-[0-9a-f-]+\\.(jpg|png|webp)$`, "i");
  if (!validPath.test(path)) return { error: "La ruta de imagen no es válida." };

  const { data: currentProfile } = await supabase.from("user_profiles").select("display_name, timezone, favorite_competitions, avatar_path").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: currentProfile?.display_name ?? String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Cuenta").slice(0, 80),
    timezone: currentProfile?.timezone ?? "America/Lima",
    favorite_competitions: currentProfile?.favorite_competitions ?? ["Premier League"],
    avatar_path: path,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: "No se pudo actualizar la foto de perfil." };

  if (currentProfile?.avatar_path && currentProfile.avatar_path !== path) {
    await supabase.storage.from("profile-avatars").remove([currentProfile.avatar_path]);
  }
  refreshProfile();
  return { success: true };
}

export async function removeAvatar() {
  const { supabase, user } = await getUserAndClient();
  if (!user) return { error: "Tu sesión ha caducado. Inicia sesión de nuevo." };
  const { data: profile } = await supabase.from("user_profiles").select("avatar_path, display_name, timezone, favorite_competitions").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: String(profile?.display_name ?? user.email ?? "Cuenta").slice(0, 80),
    timezone: profile?.timezone ?? "America/Lima",
    favorite_competitions: profile?.favorite_competitions ?? ["Premier League"],
    avatar_path: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: "No se pudo quitar la foto de perfil." };
  if (profile?.avatar_path) await supabase.storage.from("profile-avatars").remove([profile.avatar_path]);
  refreshProfile();
  return { success: true };
}
