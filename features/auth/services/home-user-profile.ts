import type { User } from "@supabase/supabase-js";

export type HomeUserProfile = {
  firstName: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstWord(value: string | null) {
  return value?.split(/\s+/u)[0] ?? null;
}

function getGoogleAvatarUrl(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const isGoogleHost = url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com");
    return url.protocol === "https:" && isGoogleHost ? url.href : null;
  } catch {
    return null;
  }
}

export function getHomeUserProfile(user: User): HomeUserProfile {
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  const googleLinked = [
    appMetadata.provider,
    ...(Array.isArray(appMetadata.providers) ? appMetadata.providers : []),
    ...(user.identities ?? []).map((identity) => identity.provider),
  ].includes("google");

  const email = user.email ?? null;
  const emailName = email?.split("@")[0]?.split(/[._+-]/u)[0] ?? null;
  const emailFirstName = emailName ? `${emailName.charAt(0).toLocaleUpperCase("es-PE")}${emailName.slice(1)}` : null;
  const givenName = firstString(metadata.given_name, metadata.first_name);
  const fullName = firstString(metadata.full_name, metadata.name);
  const combinedName = [givenName, firstString(metadata.family_name, metadata.last_name)].filter(Boolean).join(" ") || null;
  const displayName = fullName ?? combinedName ?? email ?? "Cuenta";
  const firstName = firstWord(givenName ?? fullName ?? combinedName) ?? emailFirstName ?? "there";
  const avatarUrl = googleLinked
    ? getGoogleAvatarUrl(firstString(metadata.avatar_url, metadata.picture))
    : null;

  return { firstName, displayName, email, avatarUrl };
}

export function getHomeUserInitials(displayName: string) {
  const initials = displayName.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("");
  return initials.toLocaleUpperCase("es-PE") || "U";
}
