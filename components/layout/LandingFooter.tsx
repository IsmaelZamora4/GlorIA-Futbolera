import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const repository = "https://github.com/IsmaelZamora4/GlorIA-Futbolera";

const groups = [
  {
    id: "explorar",
    title: "Explorar",
    items: [
      { label: "Partidos", href: "/partidos", icon: "calendar" },
      { label: "Competiciones", href: "/competitions", icon: "trophy" },
      { label: "Posiciones", href: "/posiciones", icon: "table" },
    ],
  },
  {
    id: "plataforma",
    title: "Plataforma",
    items: [
      { label: "Análisis", href: "/home", icon: "chart" },
      { label: "Metodología", href: "/metodologia#proceso", icon: "book" },
      { label: "Fuentes y límites", href: "/metodologia#limites", icon: "database" },
      { label: "Mi Bank", href: "/bank", icon: "wallet" },
      { label: "Iniciar sesión", href: "/login", icon: "user" },
    ],
  },
  {
    id: "informacion",
    title: "Información",
    items: [
      { label: "Privacidad", href: "/privacidad", icon: "shield" },
      { label: "Cookies y almacenamiento", href: "/privacidad#cookies", icon: "cookie" },
      { label: "Términos de uso", href: "/terminos", icon: "file" },
      { label: "Contacto", href: "/contacto", icon: "mail" },
    ],
  },
] as const;

function FooterIcon({ name }: { name: (typeof groups)[number]["items"][number]["icon"] }) {
  const icons = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11m6-11v11M3 14h18" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 14 4-4 3 2 5-6m-4 0h4v4" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" /><path d="M4 7h14a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5v2" /><path d="M15 13h.01" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    cookie: <><path d="M20.8 13A8.9 8.9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" /><path d="M13 3.3a3 3 0 0 0 4 4 3 3 0 0 0 3 3 9 9 0 0 0-7-7Z" /><path d="M8 12h.01M11 17h.01M6 16h.01" /></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3v7h7m-11 4h6m-6 4h6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

export function LandingFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        {children}
        <div className="landing-footer-main">
          <div className="landing-footer-brand-column">
            <Link className="landing-footer-brand" href="/" aria-label="GlorIA Futbolera, inicio">
              <Image src="/brand/gloria-futbolera.svg" alt="" width={40} height={40} />
              <span>GlorIA Futbolera</span>
            </Link>
            <p className="landing-footer-tagline">El fútbol, con contexto.</p>
            <p className="landing-footer-description">Datos, estadísticas y análisis para entender qué hay detrás de cada encuentro.</p>
            <a className="landing-footer-project" href={repository} target="_blank" rel="noopener noreferrer">
              Ver proyecto en GitHub
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14 14 6M7 6h7v7" /></svg>
            </a>
          </div>

          {groups.map((group) => (
            <section className={`landing-footer-group landing-footer-group--${group.id}`} key={group.title} aria-labelledby={`landing-footer-${group.id}`}>
              <h2 id={`landing-footer-${group.id}`}>{group.title}</h2>
              <nav aria-label={`Enlaces: ${group.title}`}>
                {group.items.map((item) => (
                  item.href.startsWith("mailto:") ? (
                    <a href={item.href} key={item.label}>
                      <FooterIcon name={item.icon} />
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <Link href={item.href} key={item.label}>
                      <FooterIcon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  )
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} GlorIA Futbolera. Proyecto de portafolio; textos legales de muestra.</p>
          <p>Estimaciones informativas. No garantizan resultados ni son recomendaciones de apuesta.</p>
        </div>
      </div>
    </footer>
  );
}
