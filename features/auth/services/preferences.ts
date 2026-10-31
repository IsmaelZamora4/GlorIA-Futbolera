export type AppLanguage = "es" | "en";
export type AppTheme = "dark" | "light" | "system";

export type Preferences = {
  language: AppLanguage;
  theme: AppTheme;
  timezone: string;
  hourFormat: "24h" | "12h";
  favorites: string[];
  showSourceWarnings: boolean;
};

export const preferenceKey = "gloria-preferences:v1";
export const preferencesChangedEvent = "gloria-preferences-changed";

export const defaultPreferences: Preferences = {
  language: "es",
  theme: "dark",
  timezone: "America/Lima",
  hourFormat: "24h",
  favorites: ["Premier League"],
  showSourceWarnings: true,
};

export function getStoredPreferences(): Preferences {
  try {
    const value = window.localStorage.getItem(preferenceKey);
    if (!value) return defaultPreferences;
    const parsed = JSON.parse(value) as Partial<Preferences>;
    return {
      ...defaultPreferences,
      ...parsed,
      language: parsed.language === "en" ? "en" : "es",
      theme: parsed.theme === "light" || parsed.theme === "system" ? parsed.theme : "dark",
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : defaultPreferences.favorites,
    };
  } catch {
    return defaultPreferences;
  }
}

export function getEffectiveTheme(theme: AppTheme): "dark" | "light" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyPreferences(preferences: Preferences) {
  document.documentElement.dataset.theme = getEffectiveTheme(preferences.theme);
  document.documentElement.lang = preferences.language;
}

export const translations = {
  es: {
    nav: { home: "Inicio", matches: "Partidos", competitions: "Competiciones", methodology: "Metodología", data: "Datos", settings: "Configuración" },
    sources: "Dataset local",
    onlineData: "Datos históricos procesados",
    cacheSixHours: "Actualización manual",
    backToAnalysis: "← Volver al análisis",
    settings: {
      eyebrow: "Preferencias personales", title: "Configuración", subtitle: "Personaliza tu experiencia sin aumentar las consultas a las fuentes de datos.",
      interface: "Interfaz", language: "Idioma", spanish: "Español", english: "English", appearance: "Apariencia",
      dark: "Modo oscuro", light: "Modo claro", system: "Usar sistema", matches: "Partidos", timezone: "Zona horaria",
      hourFormat: "Formato horario", hours24: "24 horas · 18:30", hours12: "12 horas · 6:30 PM",
      favoriteCompetitions: "Competiciones favoritas", favoriteHint: "Se usarán para priorizar futuras vistas personalizadas.",
      dataCache: "Datos y caché", cacheHint: "Los fixtures locales se reutilizan durante la sesión.",
      sourceWarnings: "Mostrar avisos si una fuente no responde", clearCache: "Limpiar caché de partidos", about: "Acerca de GlorIA",
      aboutText: "Proyecto personal de análisis deportivo con datasets históricos locales.",
      methodology: "Ver metodología →", removed: "Se eliminaron {count} entradas de caché de GlorIA.", emptyCache: "No había datos de partidos guardados en la caché.",
    },
  },
  en: {
    nav: { home: "Home", matches: "Matches", competitions: "Competitions", methodology: "Methodology", data: "Data", settings: "Settings" },
    sources: "Real sources",
    onlineData: "Data queried online",
    cacheSixHours: "Cached for 6 hours",
    backToAnalysis: "← Back to analysis",
    settings: {
      eyebrow: "Personal preferences", title: "Settings", subtitle: "Customize your experience without increasing requests to data sources.",
      interface: "Interface", language: "Language", spanish: "Español", english: "English", appearance: "Appearance",
      dark: "Dark mode", light: "Light mode", system: "Use system setting", matches: "Matches", timezone: "Time zone",
      hourFormat: "Time format", hours24: "24 hours · 18:30", hours12: "12 hours · 6:30 PM",
      favoriteCompetitions: "Favorite competitions", favoriteHint: "They will be used to prioritize future personalized views.",
      dataCache: "Data and cache", cacheHint: "Fixtures are stored for 6 hours to avoid repeated API calls.",
      sourceWarnings: "Show warnings when a source does not respond", clearCache: "Clear match cache", about: "About GlorIA",
      aboutText: "Personal sports analysis project. Data is queried from football-data.org and TheSportsDB.",
      methodology: "View methodology →", removed: "Removed {count} GlorIA cache entries.", emptyCache: "There were no saved match data in the cache.",
    },
  },
} as const;
