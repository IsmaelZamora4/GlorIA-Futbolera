"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applyPreferences, defaultPreferences, preferenceKey, preferencesChangedEvent, translations, type Preferences } from "@/features/auth/services/preferences";
import { SportiaSidebar } from "@/components/layout/SportiaSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";

const availableCompetitions = [
  "Liga 1",
  "Premier League",
  "Serie A",
  "LaLiga",
  "Ligue 1",
  "Bundesliga",
  "Champions League",
  "Europa League",
];

const fixtureCachePrefixes = ["gloria-fixtures:", "gloria-home-fixtures:"];

function savePreferences(preferences: Preferences) {
  window.localStorage.setItem(preferenceKey, JSON.stringify(preferences));
}

function SettingsIcon({ kind }: { kind: "globe" | "matches" | "leagues" | "favorites" | "data" | "info" | "search" | "bell" | "settings" }) {
  const paths = {
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    matches: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    leagues: <><path d="M5 19V9M12 19V5M19 19v-8" /><path d="M3 19h18" /></>,
    favorites: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    data: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 4.5 12a2 2 0 0 0-1.5-1.9" /></>,
  } as const;
  return <svg className="settings-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [cacheMessage, setCacheMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(preferenceKey);
      if (saved) setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePreferences(preferences);
    applyPreferences(preferences);
    window.dispatchEvent(new Event(preferencesChangedEvent));
  }, [preferences, ready]);

  useEffect(() => {
    if (!ready || preferences.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => applyPreferences(preferences);
    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, [preferences, ready]);

  const update = <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const toggleFavorite = (competition: string) => {
    setPreferences((current) => ({
      ...current,
      favorites: current.favorites.includes(competition)
        ? current.favorites.filter((item) => item !== competition)
        : [...current.favorites, competition],
    }));
  };

  const clearFixtureCache = () => {
    const keys = Object.keys(window.localStorage).filter((key) => fixtureCachePrefixes.some((prefix) => key.startsWith(prefix)));
    keys.forEach((key) => window.localStorage.removeItem(key));
    const text = translations[preferences.language].settings;
    setCacheMessage(keys.length ? text.removed.replace("{count}", String(keys.length)) : text.emptyCache);
  };

  return (
    <div className="app-shell settings-shell">
      <SportiaSidebar active="Configuración" />
      <main className="settings-page">
      <SportiaPageHeader title={translations[preferences.language].settings.title} description={translations[preferences.language].settings.subtitle} />

      <section className="settings-content">
        <div className="settings-toolbar">
          <label className="settings-search"><SettingsIcon kind="search" /><input placeholder={preferences.language === "en" ? "Search team, league or match..." : "Buscar equipo, liga o partido..."} /><kbd>Ctrl K</kbd></label>
          <span className="settings-beta">BETA · v0.1.0</span>
        </div>

        <div className="settings-grid">
          <section className="settings-card settings-interface-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="globe" /></span><div><h2>{translations[preferences.language].settings.interface}</h2><p>Ajusta el idioma y la apariencia de la aplicación.</p></div></div>
            <label>{translations[preferences.language].settings.language}
              <select value={preferences.language} onChange={(event) => update("language", event.target.value as Preferences["language"])}>
                <option value="es">{translations[preferences.language].settings.spanish}</option>
                <option value="en">{translations[preferences.language].settings.english}</option>
              </select>
            </label>
            <label>{translations[preferences.language].settings.appearance}
              <select value={preferences.theme} onChange={(event) => update("theme", event.target.value as Preferences["theme"])}>
                <option value="dark">{translations[preferences.language].settings.dark}</option>
                <option value="light">{translations[preferences.language].settings.light}</option>
                <option value="system">{translations[preferences.language].settings.system}</option>
              </select>
            </label>
          </section>

          <section className="settings-card settings-matches-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="matches" /></span><div><h2>{translations[preferences.language].settings.matches}</h2><p>Configura la zona horaria y el formato de horarios.</p></div></div>
            <label>{translations[preferences.language].settings.timezone}
              <select value={preferences.timezone} onChange={(event) => update("timezone", event.target.value)}>
                <option value="America/Lima">Lima · UTC−5</option>
                <option value="America/Bogota">Bogotá · UTC−5</option>
                <option value="America/Argentina/Buenos_Aires">Buenos Aires · UTC−3</option>
                <option value="Europe/Madrid">Madrid · UTC+1</option>
              </select>
            </label>
            <fieldset>
              <legend>{translations[preferences.language].settings.hourFormat}</legend>
              <label className="choice"><input type="radio" checked={preferences.hourFormat === "24h"} onChange={() => update("hourFormat", "24h")} /> {translations[preferences.language].settings.hours24}</label>
              <label className="choice"><input type="radio" checked={preferences.hourFormat === "12h"} onChange={() => update("hourFormat", "12h")} /> {translations[preferences.language].settings.hours12}</label>
            </fieldset>
          </section>

          <section className="settings-card settings-coverage-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="leagues" /></span><div><h2>Cobertura de ligas</h2><p>Ligas con análisis histórico disponible.</p></div></div>
            <div className="settings-coverage-list">
              {[["Premier League", "PL", "purple"], ["LaLiga", "LL", "red"], ["Serie A", "A", "blue"], ["Bundesliga", "1", "red"], ["Ligue 1", "L1", "yellow"]].map(([name, mark, tone]) => <div key={name}><span className={`settings-coverage-mark ${tone}`}>{mark}</span><strong>{name}</strong><span className="settings-active">● Activa</span><small>2021/22 – 2026/27</small></div>)}
            </div>
          </section>

          <section className="settings-card settings-card-wide settings-favorites-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="favorites" /></span><div><h2>{translations[preferences.language].settings.favoriteCompetitions}</h2><p>{translations[preferences.language].settings.favoriteHint}</p></div></div>
            <div className="favorite-options">
              {availableCompetitions.map((competition) => <label className="favorite-option" key={competition}>
                <input type="checkbox" checked={preferences.favorites.includes(competition)} onChange={() => toggleFavorite(competition)} />
                <span>{competition}</span>
              </label>)}
            </div>
          </section>

          <section className="settings-card settings-cache-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="data" /></span><div><h2>{translations[preferences.language].settings.dataCache}</h2><p>{translations[preferences.language].settings.cacheHint}</p></div></div>
            <div className="settings-cache-layout"><div><label className="choice"><input type="checkbox" checked={preferences.showSourceWarnings} onChange={(event) => update("showSourceWarnings", event.target.checked)} /> {translations[preferences.language].settings.sourceWarnings}</label><button className="settings-danger" type="button" onClick={clearFixtureCache}>{translations[preferences.language].settings.clearCache}</button>{cacheMessage && <small className="settings-feedback">{cacheMessage}</small>}</div><div className="settings-cache-status"><strong>Estado del caché <span>● Activo</span></strong><p>Última actualización<br />28 oct. 2026 · 14:32</p><p>Tamaño<br />12.4 MB</p></div></div>
          </section>

          <section className="settings-card about-card">
            <div className="settings-card-title"><span className="settings-card-icon"><SettingsIcon kind="info" /></span><div><h2>{translations[preferences.language].settings.about}</h2></div></div>
            <p><strong>GlorIA Futbolera · Beta v0.1.0</strong></p><p>{translations[preferences.language].settings.aboutText}</p>
            <div className="settings-about-links"><Link href="/metodologia">Ver metodología ↗</Link><Link href="/metodologia">Ver datasets ↪</Link><Link href="https://github.com/IsmaelZamora4/GlorIA-Futbolera">Ver en GitHub ↗</Link></div>
          </section>
        </div>
      </section>
      </main>
    </div>
  );
}
