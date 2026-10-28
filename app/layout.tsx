import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  title: "GlorIA Futbolera — lectura de partido",
  description: "Agenda y análisis futbolístico con datos consultados desde fuentes reales.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${plexSans.variable} ${plexSansCondensed.variable}`}>
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
