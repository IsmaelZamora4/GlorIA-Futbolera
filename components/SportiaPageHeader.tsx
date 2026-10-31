"use client";

import Link from "next/link";
import { useState } from "react";
import { useHomeUserProfile } from "./HomeUserProvider";
import { UserProfile } from "./UserProfile";

export function SportiaPageHeader({ title, description }: { title: string; description: string }) {
  const profile = useHomeUserProfile();
  const [notifications, setNotifications] = useState(4);

  return (
    <header className="sportia-topbar">
      <div className="sportia-topbar-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="sportia-top-actions">
        <button
          className="sportia-round-button notification"
          type="button"
          aria-label={`${notifications} notificaciones`}
          onClick={() => setNotifications(0)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          {notifications > 0 && <span aria-hidden="true">{notifications}</span>}
        </button>
        <Link className="sportia-round-button" href="/configuracion" aria-label="Configuración">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
        <UserProfile profile={profile} />
      </div>
    </header>
  );
}
