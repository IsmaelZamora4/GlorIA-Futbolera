import type { SupabaseClient } from "@supabase/supabase-js";

export const avatarSignedUrlTtlSeconds = 60 * 60;
export const avatarCacheControlSeconds = 5 * 60;

export function getAvatarUrlIdentity(url: string | null) {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.delete("token");
    return parsedUrl.href;
  } catch {
    return url;
  }
}

export type AvatarRefreshAttempt = { identity: string | null; attempted: boolean };

export function claimAvatarUrlRefresh(url: string | null, attempt: AvatarRefreshAttempt) {
  const identity = getAvatarUrlIdentity(url);
  if (!identity) return false;
  if (attempt.identity !== identity) {
    attempt.identity = identity;
    attempt.attempted = false;
  }
  if (attempt.attempted) return false;
  attempt.attempted = true;
  return true;
}

export function resolveAvatarUrlOverride(
  initialUrl: string | null,
  override: { baseUrl: string | null; url: string | null } | null,
) {
  return override?.baseUrl === initialUrl ? override.url : initialUrl;
}

export function isAvatarPathOwnedByUser(
  userId: string,
  avatarPath: string | null | undefined,
): avatarPath is string {
  if (!avatarPath || !avatarPath.startsWith(`${userId}/avatar-`)) return false;
  return /^[0-9a-f-]+\.(jpg|png|webp)$/i.test(avatarPath.slice(`${userId}/avatar-`.length));
}

export async function createAvatarSignedUrl(
  supabase: Pick<SupabaseClient, "storage">,
  userId: string,
  avatarPath: string | null | undefined,
) {
  if (!isAvatarPathOwnedByUser(userId, avatarPath)) return null;
  try {
    const { data, error } = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(avatarPath, avatarSignedUrlTtlSeconds);
    return error ? null : data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
