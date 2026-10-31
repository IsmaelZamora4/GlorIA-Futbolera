"use client";

import Image from "next/image";
import Link from "next/link";

type IconName = "ball" | "chevron" | "calendar" | "chart" | "users" | "heart" | "tv" | "settings" | "logout";

const leagues = [
  ["Liga 1", "Liga 1 de Perú", "/competitions/liga-1-peru.svg"],
  ["Champions League", "Champions League", "/competitions/champions-league.svg"],
  ["Bundesliga", "Bundesliga de Alemania", "/competitions/bundesliga.svg"],
  ["Premier League", "Premier League", "/competitions/premier-league.svg"],
  ["Ligue 1", "Ligue 1 de Francia", "/competitions/ligue-1.svg"],
  ["Serie A", "Serie A de Italia", "/competitions/serie-a.svg"],
  ["La Liga", "LaLiga de España", "/competitions/laliga.svg"],
] as const;

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    ball: <><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83 4.93 19.07" /><circle cx="12" cy="12" r="4" /></>,
    chevron: <path d="m19 9-7 7-7-7" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    chart: <><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.5M18 14c1.8.8 3 2.6 3 4.5" /></>,
    heart: <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />,
    tv: <><rect width="20" height="15" x="2" y="7" rx="2" /><path d="m17 2-5 5-5-5" /></>,
    settings: <><path d="M10.3 4.3c.4-1.8 3-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.2.8 2.3 2.3a1.7 1.7 0 0 0 1.1 2.6c1.8.4 1.8 3 0 3.4a1.7 1.7 0 0 0-1.1 2.6c.9 1.5-.8 3.2-2.3 2.3a1.7 1.7 0 0 0-2.6 1.1c-.4 1.8-3 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1.1c-1.5.9-3.2-.8-2.3-2.3a1.7 1.7 0 0 0-1.1-2.6c-1.8-.4-1.8-3 0-3.4A1.7 1.7 0 0 0 5.4 7.7c-.9-1.5.8-3.2 2.3-2.3a1.7 1.7 0 0 0 2.6-1.1Z" /><circle cx="12" cy="12" r="3" /></>,
    logout: <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function SportiaSidebar({ active, selectedCompetition, onCompetitionSelect }: { active?: string; selectedCompetition?: string | null; onCompetitionSelect?: (competition: string) => void }) {
  const menu = [
    ["Partidos", "calendar", "/partidos"],
    ["Competiciones", "chart", "/competiciones"],
    ["Metodología", "users", "/metodologia"],
    ["Mi Bank", "heart", "/bank"],
    ["Datos", "tv", "/#datos"],
    ["Configuración", "settings", "/configuracion"],
  ] as const;
  return (
    <aside className="sportia-sidebar" aria-label="Navegación principal">
      <div>
        <Link className="sportia-brand" href="/home"><span className="sportia-brand-mark"><Image src="/brand/gloria-futbolera.svg" alt="" width={32} height={32} /></span><span>GlorIA</span></Link>
        <section className="sportia-sidebar-section">
          <span className="sportia-sidebar-label">Sports</span>
          <div className="sportia-sport-active"><span><Icon name="ball" size={16} />Football</span><Icon name="chevron" size={15} /></div>
          <nav className="sportia-leagues" aria-label="Filtrar partidos por competición">
            {leagues.map(([name, competition, logo]) => <Link href={`/partidos?competicion=${encodeURIComponent(competition)}`} className={`sportia-league-link ${selectedCompetition === competition ? "is-active" : ""}`} key={competition} onClick={() => onCompetitionSelect?.(competition)}><Image className="sportia-league-logo" src={logo} alt="" width={20} height={20} unoptimized /><span>{name}</span></Link>)}
          </nav>
        </section>
        <section className="sportia-sidebar-section sportia-other-menu">
          <span className="sportia-sidebar-label">Other Menu</span>
          {menu.map(([label, icon, href]) => <Link className={active === label ? "is-active" : ""} href={href} key={label}><Icon name={icon} size={16} />{label}</Link>)}
        </section>
      </div>
      <Link className="sportia-logout" href="/login"><Icon name="logout" size={16} />Log Out</Link>
    </aside>
  );
}
