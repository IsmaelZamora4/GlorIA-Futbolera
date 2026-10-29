import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
});

const plexSansCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans-condensed",
  weight: ["400", "500", "600", "700"],
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
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
