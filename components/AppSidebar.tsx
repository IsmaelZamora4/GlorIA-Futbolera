"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredPreferences, preferencesChangedEvent, translations, type AppLanguage } from "../lib/preferences";

type SidebarIconName = "home" | "matches" | "trophy" | "book" | "database" | "settings";

const items: [string, SidebarIconName, string][] = [
  ["Inicio", "home", "/"],
  ["Partidos", "matches", "/partidos"],
  ["Competiciones", "trophy", "/competiciones"],
  ["Metodología", "book", "/#metodologia"],
  ["Datos", "database", "/#datos"],
  ["Configuración", "settings", "/configuracion"],
];

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const paths: Record<SidebarIconName, React.ReactNode> = {
    home: <path d="m3 8 5-5 5 5v5H9v-3H7v3H3V8Zm5-5v2" />,
    matches: <><rect x="3" y="4" width="10" height="9" rx="1.5" /><path d="M5 2v3M11 2v3M3 7h10" /></>,
    trophy: <><path d="M5 3h6v3a3 3 0 0 1-6 0V3ZM8 9v3M5 13h6M3 4H2v1a2 2 0 0 0 2 2M13 4h1v1a2 2 0 0 1-2 2" /></>,
    book: <><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2H7v10H4.5A1.5 1.5 0 0 0 3 13.5v-10Z" /><path d="M13 3.5A1.5 1.5 0 0 0 11.5 2H9v10h2.5a1.5 1.5 0 0 1 1.5 1.5v-10Z" /></>,
    database: <><ellipse cx="8" cy="3.5" rx="5" ry="2" /><path d="M3 3.5v5c0 1.1 2.2 2 5 2s5-.9 5-2v-5M3 8.5v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4" /></>,
    settings: <><circle cx="8" cy="8" r="2.2" /><path d="m13 8 1-1-1-2-1.5.2a5 5 0 0 0-1.2-.7L10 3H6l-.3 1.5a5 5 0 0 0-1.2.7L3 5 2 7l1 1-1 1 1 2 1.5-.2c.4.3.8.5 1.2.7L6 13h4l.3-1.5a5 5 0 0 0 1.2-.7L13 11l1-2-1-1Z" /></>,
  };
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function AppSidebar({ active }: { active: string }) {
  const [language, setLanguage] = useState<AppLanguage>("es");
  useEffect(() => {
    const sync = () => setLanguage(getStoredPreferences().language);
    sync();
    window.addEventListener(preferencesChangedEvent, sync);
    return () => window.removeEventListener(preferencesChangedEvent, sync);
  }, []);
  const text = translations[language];
  const labels: Record<string, string> = {
    Inicio: text.nav.home, Partidos: text.nav.matches, Competiciones: text.nav.competitions,
    Metodología: text.nav.methodology, Datos: text.nav.data, Configuración: text.nav.settings,
  };
  return <aside className="sidebar">
    <div className="px-5 pb-8 pt-6"><Link href="/"><Image className="logo-image" src="/logo-gloria.png" alt="GlorIA Futbolera" width={136} height={84} priority /></Link></div>
    <nav className="space-y-1 px-3">{items.map(([label, icon, href]) => <Link className={`nav-item ${active === label ? "active" : ""}`} href={href} key={label}><SidebarIcon name={icon} /><span>{labels[label]}</span></Link>)}</nav>
    <div className="demo-box"><div className="flex items-center gap-3"><span className="demo-icon"><SidebarIcon name="database" /></span><div><div className="text-xs font-medium text-[#f5f2ec]">{text.sources}</div><div className="mt-1 text-[10px] text-[#8c8b87]">{text.onlineData}</div></div></div><span className="mt-3 block text-[10px] text-[#777773]">{text.cacheSixHours}</span></div>
  </aside>;
}
