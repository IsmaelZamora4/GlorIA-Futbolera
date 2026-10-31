"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HomeUserProfile } from "../lib/auth/home-user-profile";

const HomeUserContext = createContext<HomeUserProfile | null>(null);

export function HomeUserProvider({ profile, children }: { profile: HomeUserProfile; children: ReactNode }) {
  return <HomeUserContext.Provider value={profile}>{children}</HomeUserContext.Provider>;
}

export function useHomeUserProfile() {
  const profile = useContext(HomeUserContext);
  if (!profile) throw new Error("HomeUserProvider is required to render the home profile.");
  return profile;
}
