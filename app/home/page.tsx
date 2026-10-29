"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getLocalDate } from "../../lib/local-date";
import { SportiaSidebar } from "../../components/SportiaSidebar";

type IconName =
  | "ball"
  | "chevron"
  | "heart"
  | "users"
  | "logout"
  | "bell"
  | "settings"
  | "calendar"
  | "pin"
  | "chart"
  | "tv"
  | "star";

type Match = {
  id: string;
  competition: string;
  date: string;
  kickoff: string;
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  venue: string | null;
  analysisAvailable: boolean;
};

type FixtureResponse = {
  fixtures?: Array<{
    id: string;
    utcDate: string;
    venue?: string | null;
    homeTeam: { name: string; crest?: string | null };
    awayTeam: { name: string; crest?: string | null };
  }>;
  analysisAvailable?: boolean;
  status?: string;
  message?: string;
  error?: string;
};

type CompetitionGroup = (typeof homeCompetitions)[number] & { matches: Match[] };

const articles = [
  ["Action football", "/home-screenshot.jpg", "Ben talking points from the weekend's top-flight action", "July 7, 2020 10:14 AM"],
  ["Stadium relief", "/stadium-hero.svg", "Spurs' lack of fervour thrown into stark relief by Arsenal", "June 24, 2020 09:55 PM"],
  ["Generational talent", "/match-info-screenshot.jpg", "Bale was a generational talent. And he was ours", "July 2, 2020 1:04 PM"],
  ["Moves in Europe", "/wallpaper.jpg", "All the latest moves from around Europe", "July 10, 2020 10:22 AM"],
] as const;

const homeCompetitions = [
  { name: "Liga 1", competition: "Liga 1 de Perú", logo: "/competitions/liga-1-peru.svg" },
  { name: "Champions League", competition: "Champions League", logo: "/competitions/champions-league.svg" },
  { name: "Bundesliga", competition: "Bundesliga de Alemania", logo: "/competitions/bundesliga.svg" },
  { name: "Premier League", competition: "Premier League", logo: "/competitions/premier-league.svg" },
  { name: "Ligue 1", competition: "Ligue 1 de Francia", logo: "/competitions/ligue-1.svg" },
  { name: "Serie A", competition: "Serie A de Italia", logo: "/competitions/serie-a.svg" },
  { name: "La Liga", competition: "LaLiga de España", logo: "/competitions/laliga.svg" },
] as const;

const competitionDetails: Record<string, string> = {
  "Liga 1 de Perú": "Liga 1 de Perú",
  "Champions League": "UEFA Champions League",
  "Bundesliga de Alemania": "Bundesliga",
  "Premier League": "Premier League",
  "Ligue 1 de Francia": "Ligue 1",
  "Serie A de Italia": "Serie A",
  "LaLiga de España": "LaLiga",
};

function Icon({ name, size = 16, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, React.ReactNode> = {
    ball: <><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83 4.93 19.07" /><circle cx="12" cy="12" r="4" /></>,
    chevron: <path d="m19 9-7 7-7-7" />,
    heart: <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />,
    users: <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72M6 18.72a6.062 6.062 0 0 1 11.058-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
    logout: <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />,
    bell: <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />,
    settings: <><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></>,
    calendar: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    pin: <><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></>,
    chart: <><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></>,
    tv: <><rect width="20" height="15" x="2" y="7" rx="2" /><path d="m17 2-5 5-5-5" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function teamCode(name: string) {
  return name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
}

function formatKickoff(date: string) {
  return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

function getDetailHref(match: Match) {
  const slugs: Record<string, string> = {
    "Serie A de Italia": "serie-a",
    "LaLiga de España": "la-liga",
    "Ligue 1 de Francia": "ligue-1",
    "Bundesliga de Alemania": "bundesliga",
    "Premier League": "premier-league",
  };
  const slug = slugs[match.competition];
  if (!match.analysisAvailable || !slug) return null;
  const query = new URLSearchParams({ fecha: match.date, local: match.home, visitante: match.away, hora: match.kickoff, estadio: match.venue ?? "Por confirmar" });
  if (match.homeLogo) query.set("escudoLocal", match.homeLogo);
  if (match.awayLogo) query.set("escudoVisitante", match.awayLogo);
  return `/partido/${slug}?${query.toString()}`;
}

function MatchRow({ match, onSelect, selected }: { match: Match; onSelect: () => void; selected: boolean }) {
  const detailHref = getDetailHref(match);
  return (
    <div className={`sportia-match-row ${selected ? "is-selected" : ""}`}>
      <div className="sportia-match-side">
        <button className="sportia-icon-button" type="button" aria-label={`Seleccionar ${match.home} contra ${match.away}`} aria-pressed={selected} onClick={onSelect}><Icon name="star" size={14} filled={selected} /></button>
        <span className="sportia-kickoff">{match.kickoff}</span>
        <button className="sportia-team-name sportia-match-select" type="button" onClick={onSelect}><TeamBadge code={teamCode(match.home)} crest={match.homeLogo} />{match.home}</button>
      </div>
      <strong className="sportia-score" aria-label={`Hora de inicio ${match.kickoff}`}>VS</strong>
      <div className="sportia-match-side away">
        <button className="sportia-team-name sportia-match-select" type="button" onClick={onSelect}>{match.away}<TeamBadge code={teamCode(match.away)} crest={match.awayLogo} /></button>
        <span className="sportia-match-actions">{detailHref ? <Link href={detailHref} aria-label={`Ver análisis de ${match.home} y ${match.away}`}><Icon name="chart" size={14} /></Link> : <Link href={`/partidos?competicion=${encodeURIComponent(match.competition)}`} aria-label={`Ver agenda de ${match.competition}`}><Icon name="calendar" size={14} /></Link>}</span>
      </div>
    </div>
  );
}

function TeamBadge({ code, crest }: { code: string; crest: string | null }) {
  return crest
    ? <Image className="sportia-team-badge sportia-team-crest" src={crest} alt="" width={20} height={20} unoptimized />
    : <span className="sportia-team-badge">{code}</span>;
}

export default function Home() {
  const [collapsedLeagues, setCollapsedLeagues] = useState<string[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [matchesByCompetition, setMatchesByCompetition] = useState<CompetitionGroup[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [unavailableCompetitions, setUnavailableCompetitions] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState(4);

  useEffect(() => {
    const controller = new AbortController();
    const today = getLocalDate();
    setLoadState("loading");
    void Promise.all(homeCompetitions.map(async (competition) => {
      try {
        const response = await fetch(`/api/local-fixtures?date=${today}&competition=${encodeURIComponent(competition.competition)}`, { signal: controller.signal });
        const payload = await response.json() as FixtureResponse;
        if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar los partidos.");
        const matches = (payload.fixtures ?? []).map((fixture): Match => ({
          id: `${competition.competition}:${fixture.id}`,
          competition: competition.competition,
          date: today,
          kickoff: formatKickoff(fixture.utcDate),
          home: fixture.homeTeam.name,
          away: fixture.awayTeam.name,
          homeLogo: fixture.homeTeam.crest ?? null,
          awayLogo: fixture.awayTeam.crest ?? null,
          venue: fixture.venue ?? null,
          analysisAvailable: payload.analysisAvailable ?? false,
        }));
        return { competition, matches, error: null as string | null, unavailable: payload.status === "unavailable" };
      } catch (error) {
        if (controller.signal.aborted) return { competition, matches: [], error: null, unavailable: false };
        return { competition, matches: [], error: error instanceof Error ? error.message : "Error al cargar partidos.", unavailable: false };
      }
    })).then((results) => {
      if (controller.signal.aborted) return;
      const groups = results.map(({ competition, matches }) => ({ ...competition, matches }));
      setMatchesByCompetition(groups);
      setLoadErrors(results.flatMap(({ competition, error }) => error ? [`${competition.name}: ${error}`] : []));
      setUnavailableCompetitions(results.filter((result) => result.unavailable).map(({ competition }) => competition.name));
      setLoadState(results.every((result) => result.error) ? "error" : "ready");
    });
    return () => controller.abort();
  }, [refreshKey]);

  const visibleGroups = matchesByCompetition.filter((group) => (!selectedCompetition || group.competition === selectedCompetition) && group.matches.length > 0);
  const visibleMatches = visibleGroups.flatMap((group) => group.matches);
  const selectedMatch = visibleMatches.find((match) => match.id === selectedMatchId) ?? visibleMatches[0] ?? null;
  const toggleCompetition = (competition: string) => setSelectedCompetition((current) => current === competition ? null : competition);
  const todayLabel = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${getLocalDate()}T12:00:00-05:00`));
  const detailHref = selectedMatch ? getDetailHref(selectedMatch) : null;
  const toggleLeague = (name: string) => setCollapsedLeagues((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return (
    <div className="sportia-home">
      <SportiaSidebar active="Inicio" selectedCompetition={selectedCompetition} onCompetitionSelect={toggleCompetition} />

      <main className="sportia-main">
        <header className="sportia-topbar">
          <div><h1>Welcome to GlorIA</h1><p>{todayLabel}</p></div>
          <div className="sportia-top-actions">
            <button className="sportia-round-button notification" type="button" aria-label={`${notifications} notificaciones`} onClick={() => setNotifications(0)}><Icon name="bell" size={16} />{notifications > 0 && <span>{notifications}</span>}</button>
            <Link className="sportia-round-button" href="/configuracion" aria-label="Configuración"><Icon name="settings" size={16} /></Link>
            <button className="sportia-profile" type="button"><span className="sportia-avatar">TS</span><span><strong>Terry Stacia</strong><small>MU Bwoey</small></span><Icon name="chevron" size={14} /></button>
          </div>
        </header>

        <div className="sportia-dashboard">
          <section className="sportia-primary-column">
            <section className="sportia-hero" aria-labelledby="sportia-hero-title">
              <div className="sportia-hero-copy">
                <h2 id="sportia-hero-title">{selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : "Football, today"}</h2>
                <p><Icon name="calendar" size={14} />{todayLabel} · {selectedMatch?.kickoff ?? "Today's fixtures"}</p>
                <p><Icon name="pin" size={14} />{selectedMatch?.venue ?? (selectedMatch ? "Venue not available" : "Explore today's matches")}</p>
                <Link className="sportia-hero-button" href={detailHref ?? (selectedMatch ? `/partidos?competicion=${encodeURIComponent(selectedMatch.competition)}` : "/partidos")}>{detailHref ? "View match analysis" : "View matches"} <span aria-hidden="true">→</span></Link>
              </div>
              <div className="sportia-hero-teams" aria-hidden="true"><div className="sportia-player city"><span>{selectedMatch ? teamCode(selectedMatch.home) : "GF"}</span><b>{selectedMatch?.home ?? "GLORIA"}</b></div><div className="sportia-player arsenal"><span>{selectedMatch ? teamCode(selectedMatch.away) : "GF"}</span><b>{selectedMatch?.away ?? "FUTBOL"}</b></div></div>
            </section>

            <section className="sportia-card sportia-today-card" aria-labelledby="today-match-title">
              <div className="sportia-today-heading"><h2 id="today-match-title">Today Match</h2><Link href="/partidos">Full schedule <span aria-hidden="true">→</span></Link></div>
              <nav className="sportia-mobile-league-filter" aria-label="Filtrar por competición">
                {homeCompetitions.map((league) => <button type="button" key={league.competition} className={selectedCompetition === league.competition ? "is-active" : ""} aria-pressed={selectedCompetition === league.competition} onClick={() => toggleCompetition(league.competition)}><Image src={league.logo} alt="" width={20} height={20} unoptimized /><span>{league.name}</span></button>)}
              </nav>
              {loadState === "loading" && matchesByCompetition.length === 0 && <p className="sportia-fixture-state" role="status">Loading today's fixtures…</p>}
              {loadState === "error" && <div className="sportia-fixture-state" role="alert"><p>Today’s fixtures couldn’t be loaded.</p><button type="button" onClick={() => setRefreshKey((current) => current + 1)}>Try again</button></div>}
              {loadErrors.length > 0 && loadState === "ready" && <p className="sportia-fixture-note" role="status">Some competitions could not be updated. Other available fixtures are shown.</p>}
              {unavailableCompetitions.length > 0 && !selectedCompetition && <p className="sportia-fixture-note">Current fixtures aren’t configured for {unavailableCompetitions.join(", ")} yet.</p>}
              {loadState === "ready" && visibleGroups.length === 0 && <div className="sportia-fixture-state" role="status"><p>{selectedCompetition ? `No ${homeCompetitions.find((league) => league.competition === selectedCompetition)?.name} matches available today.` : "No matches available today."}</p>{selectedCompetition && unavailableCompetitions.includes(homeCompetitions.find((league) => league.competition === selectedCompetition)?.name ?? "") && <small>A current fixture source for this competition is not configured yet.</small>}<Link href="/partidos">Open the full schedule <span aria-hidden="true">→</span></Link></div>}
              {visibleGroups.map((league) => {
                const collapsed = collapsedLeagues.includes(league.name);
                return <div className="sportia-league-group" key={league.name}>
                  <div className="sportia-league-heading"><Image className="sportia-league-logo" src={league.logo} alt="" width={24} height={24} unoptimized /><span><strong>{league.name}</strong><small>{competitionDetails[league.competition]} · {league.matches.length} {league.matches.length === 1 ? "Match" : "Matches"}</small></span><button type="button" aria-expanded={!collapsed} aria-label={`${collapsed ? "Show" : "Hide"} ${league.name} matches`} onClick={() => toggleLeague(league.name)}><Icon name="chevron" size={15} /></button></div>
                  {!collapsed && <div className="sportia-match-list">{league.matches.map((match) => <MatchRow key={match.id} match={match} selected={selectedMatch?.id === match.id} onSelect={() => setSelectedMatchId(match.id)} />)}</div>}
                </div>;
              })}
            </section>
          </section>

          <aside className="sportia-secondary-column">
            <section className="sportia-card sportia-live-card" aria-labelledby="live-title">
              <h2 id="live-title">Recommended Match</h2><p>{selectedMatch ? `${homeCompetitions.find((league) => league.competition === selectedMatch.competition)?.name} · ${selectedMatch.kickoff}` : "Select a match from today's schedule"}</p>
              {selectedMatch ? <div className="sportia-live-teams"><div><TeamBadge code={teamCode(selectedMatch.home)} crest={selectedMatch.homeLogo} /><strong>{selectedMatch.home}</strong></div><b>VS</b><div><TeamBadge code={teamCode(selectedMatch.away)} crest={selectedMatch.awayLogo} /><strong>{selectedMatch.away}</strong></div></div> : <div className="sportia-fixture-state"><p>When matches are available, select one to see it here.</p></div>}
              <Link className="sportia-primary-button" href={detailHref ?? (selectedMatch ? `/partidos?competicion=${encodeURIComponent(selectedMatch.competition)}` : "/partidos")}>{detailHref ? "View match analysis" : "Open matches"}</Link>
            </section>
            <section className="sportia-card sportia-articles-card" aria-labelledby="articles-title">
              <h2 id="articles-title">Latest Article</h2>
              <div className="sportia-articles">{articles.map(([alt, image, title, date]) => <article key={title}><Image src={image} alt={alt} width={56} height={56} /><div><h3>{title}</h3><time>{date}</time></div></article>)}</div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
