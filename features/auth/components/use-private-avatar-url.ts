"use client";

import { useCallback, useRef, useState } from "react";
import { refreshAvatarUrl } from "@/features/auth/actions";
import { claimAvatarUrlRefresh, resolveAvatarUrlOverride } from "@/features/auth/services/avatar-url";

export function usePrivateAvatarUrl(initialUrl: string | null) {
  const [override, setOverride] = useState<{ baseUrl: string | null; url: string | null } | null>(null);
  const attemptedAvatarRefresh = useRef<{ identity: string | null; attempted: boolean }>({ identity: null, attempted: false });
  const avatarUrl = resolveAvatarUrlOverride(initialUrl, override);

  const refreshAfterLoadError = useCallback(() => {
    const expiredUrl = avatarUrl;
    if (!expiredUrl) return;
    setOverride({ baseUrl: initialUrl, url: null });
    if (!claimAvatarUrlRefresh(expiredUrl, attemptedAvatarRefresh.current)) return;
    void refreshAvatarUrl().then((freshUrl) => {
      if (freshUrl && freshUrl !== expiredUrl) setOverride({ baseUrl: initialUrl, url: freshUrl });
    }).catch(() => {});
  }, [avatarUrl, initialUrl]);

  const setAvatarUrl = useCallback((url: string | null) => setOverride({ baseUrl: initialUrl, url }), [initialUrl]);

  return { avatarUrl, setAvatarUrl, refreshAfterLoadError };
}
