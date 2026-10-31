"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getHomeUserInitials, type HomeUserProfile } from "@/features/auth/services/home-user-profile";
import { createClient } from "@/lib/supabase/browser";

export function UserProfile({ profile }: { profile: HomeUserProfile }) {
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [signOutPending, setSignOutPending] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const showAvatar = profile.avatarUrl !== null && failedAvatarUrl !== profile.avatarUrl;

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        if (menuRef.current) menuRef.current.open = false;
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  async function signOut() {
    setSignOutPending(true);
    setSignOutError(null);

    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setSignOutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        return;
      }

      if (menuRef.current) menuRef.current.open = false;
      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setSignOutPending(false);
    }
  }

  return (
    <details
      className="sportia-profile-menu"
      ref={menuRef}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (menuRef.current) menuRef.current.open = false;
          summaryRef.current?.focus();
        }
      }}
    >
      <summary className="sportia-profile" ref={summaryRef} aria-label={`Perfil de ${profile.displayName}`}>
        <span className="sportia-avatar" aria-hidden="true">
          {showAvatar ? (
            <Image
              src={profile.avatarUrl!}
              alt=""
              width={36}
              height={36}
              sizes="36px"
              onError={() => setFailedAvatarUrl(profile.avatarUrl)}
            />
          ) : getHomeUserInitials(profile.displayName)}
        </span>
        <span>
          <strong>{profile.displayName}</strong>
          <small>{profile.email ?? "Cuenta de GlorIA"}</small>
        </span>
        <svg className="sportia-profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="sportia-profile-dropdown" aria-label="Opciones de cuenta">
        <div className="sportia-profile-dropdown-identity">
          <strong>{profile.displayName}</strong>
          <small>{profile.email ?? "Cuenta de GlorIA"}</small>
        </div>
        <div className="sportia-profile-dropdown-divider" />
        <Link className="sportia-profile-dropdown-item" href="/home/configuración" onClick={() => { if (menuRef.current) menuRef.current.open = false; }}>
          Configuración
        </Link>
        <button className="sportia-profile-dropdown-item" type="button" onClick={signOut} disabled={signOutPending}>
          {signOutPending ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
        {signOutError && <p className="sportia-profile-dropdown-error" role="alert">{signOutError}</p>}
      </div>
    </details>
  );
}
