"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { applyPreferences, defaultPreferences, preferenceKey, preferencesChangedEvent, translations, type Preferences } from "../../lib/preferences";

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

const fixtureCachePrefix = "gloria-fixtures:v2:";

function savePreferences(preferences: Preferences) {
  window.localStorage.setItem(preferenceKey, JSON.stringify(preferences));
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
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(fixtureCachePrefix));
    keys.forEach((key) => window.localStorage.removeItem(key));
    const text = translations[preferences.language].settings;
    setCacheMessage(keys.length ? text.removed.replace("{count}", String(keys.length)) : text.emptyCache);
  };

  return (
    <div className="app-shell settings-page">
      <AppSidebar active="Configuración" />
      <main className="main-area">
      <header className="settings-topbar">
        <Link href="/" className="settings-brand">
          <Image src="/logo-gloria.png" alt="GlorIA Futbolera" width={108} height={66} priority />
        </Link>
        <Link href="/" className="back-link">{translations[preferences.language].backToAnalysis}</Link>
      </header>

      <section className="settings-content">
        <header className="settings-heading">
          <div>
            <p className="eyebrow">{translations[preferences.language].settings.eyebrow}</p>
            <h1>{translations[preferences.language].settings.title}</h1>
            <p>{translations[preferences.language].settings.subtitle}</p>
          </div>
          <span className="settings-beta">BETA · v0.1.0</span>
        </header>

        <div className="settings-grid">
          <section className="settings-card">
            <h2>{translations[preferences.language].settings.interface}</h2>
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

          <section className="settings-card">
            <h2>{translations[preferences.language].settings.matches}</h2>
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

          <section className="settings-card settings-card-wide">
            <h2>{translations[preferences.language].settings.favoriteCompetitions}</h2>
            <p>{translations[preferences.language].settings.favoriteHint}</p>
            <div className="favorite-options">
              {availableCompetitions.map((competition) => <label className="favorite-option" key={competition}>
                <input type="checkbox" checked={preferences.favorites.includes(competition)} onChange={() => toggleFavorite(competition)} />
                <span>{competition}</span>
              </label>)}
            </div>
          </section>

          <section className="settings-card">
            <h2>{translations[preferences.language].settings.dataCache}</h2>
            <p>{translations[preferences.language].settings.cacheHint}</p>
            <label className="choice"><input type="checkbox" checked={preferences.showSourceWarnings} onChange={(event) => update("showSourceWarnings", event.target.checked)} /> {translations[preferences.language].settings.sourceWarnings}</label>
            <button className="settings-danger" type="button" onClick={clearFixtureCache}>{translations[preferences.language].settings.clearCache}</button>
            {cacheMessage && <small className="settings-feedback">{cacheMessage}</small>}
          </section>

          <section className="settings-card about-card">
            <h2>{translations[preferences.language].settings.about}</h2>
            <p><strong>GlorIA Futbolera · Beta v0.1.0</strong></p>
            <p>{translations[preferences.language].settings.aboutText}</p>
            <Link href="/#metodologia">{translations[preferences.language].settings.methodology}</Link>
          </section>
        </div>
      </section>
      </main>
    </div>
  );
}
