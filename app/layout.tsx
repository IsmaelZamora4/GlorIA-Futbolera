import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";

const plexSans = localFont({
  src: "./fonts/ibm-plex-sans-latin-variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-plex-sans",
  declarations: [{ prop: "font-stretch", value: "100%" }],
});

const plexSansCondensed = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-condensed-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-condensed-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-condensed-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-condensed-latin-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-plex-sans-condensed",
});

const jakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-latin-variable.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-jakarta-sans",
});

export const metadata: Metadata = {
  title: "GlorIA Futbolera | Fútbol con contexto",
  description: "Consulta partidos, competiciones y análisis estadístico del fútbol con GlorIA Futbolera.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${plexSans.variable} ${plexSansCondensed.variable} ${jakartaSans.variable}`}>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `(() => {
          try {
            const saved = localStorage.getItem("gloria-preferences:v1");
            const preferences = saved ? JSON.parse(saved) : {};
            const theme = preferences.theme === "light" ? "light" : "dark";
            document.documentElement.dataset.theme = theme;
            document.documentElement.lang = preferences.language === "en" ? "en" : "es";
          } catch {}
        })();` }} />
        {children}
      </body>
    </html>
  );
}

