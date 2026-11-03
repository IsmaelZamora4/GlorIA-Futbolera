"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HomeUserProfile } from "@/features/auth/services/home-user-profile";

const HomeUserContext = createContext<HomeUserProfile | null>(null);

export function HomeUserProvider({ profile, children }: { profile: HomeUserProfile; children: ReactNode }) {
  const parentProfile = useContext(HomeUserContext);
  const resolvedProfile = parentProfile ? { ...profile, ...parentProfile } : profile;
  return <HomeUserContext.Provider value={resolvedProfile}>{children}</HomeUserContext.Provider>;
}

export function useHomeUserProfile() {
  const profile = useContext(HomeUserContext);
  if (!profile) throw new Error("HomeUserProvider is required to render the home profile.");
  return profile;
}
