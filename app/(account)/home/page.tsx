"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getLocalDate } from "@/features/fixtures/services/local-date";
import { useHomeUserProfile } from "@/features/auth/components/HomeUserProvider";
import { SportiaSidebar } from "@/components/layout/SportiaSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";

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
  utcDate: string;
  kickoff: string;
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  venue: string | null;
  analysisAvailable: boolean;
  historicalAnalysis: {
    over25Probability: number;
    bttsProbability: number;
  } | null;
};

type FixtureResponse = {
  fixtures?: Array<{
    id: string;
    utcDate: string;
    venue?: string | null;
    homeTeam: { name: string; crest?: string | null };
    awayTeam: { name: string; crest?: string | null };
    historicalAnalysis?: {
      over25Probability: number;
      bttsProbability: number;
    };
  }>;
  analysisAvailable?: boolean;
  status?: string;
  message?: string;
  error?: string;
};

type CompetitionGroup = (typeof homeCompetitions)[number] & { matches: Match[] };

type ParleyPick = {
  match: Match;
  market: "btts" | "over25";
  label: string;
  probability: number;
};

const articles = [
  ["Action football", "/editorial/featured-match.webp", "Ben talking points from the weekend's top-flight action", "July 7, 2020 10:14 AM"],
  ["Stadium relief", "/editorial/stadium-hero.svg", "Spurs' lack of fervour thrown into stark relief by Arsenal", "June 24, 2020 09:55 PM"],
  ["Generational talent", "/editorial/partidos-example.jpg", "Bale was a generational talent. And he was ours", "July 2, 2020 1:04 PM"],
  ["Moves in Europe", "/wallpapers/wallpaper.jpg", "All the latest moves from around Europe", "July 10, 2020 10:22 AM"],
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

function getRecommendedPick(match: Match): ParleyPick | null {
  if (!match.analysisAvailable || !match.historicalAnalysis) return null;

  const markets = [
    { market: "btts" as const, label: "Ambos marcan", probability: match.historicalAnalysis.bttsProbability },
    { market: "over25" as const, label: "Más de 2.5 goles", probability: match.historicalAnalysis.over25Probability },
  ].filter(({ probability }) => Number.isFinite(probability) && probability >= 0 && probability <= 100);
  const bestMarket = markets.sort((a, b) => b.probability - a.probability)[0];
  return bestMarket ? { match, ...bestMarket } : null;
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
    ? <Image className="sportia-team-badge sportia-team-crest" src={crest} alt="" width={134} height={134} />
    : <span className="sportia-team-badge">{code}</span>;
}

function getVectorCrestUrl(crest: string) {
  try {
    const url = new URL(crest);
    if (url.hostname !== "crests.football-data.org" || !url.pathname.endsWith(".png")) return null;
    url.pathname = url.pathname.replace(/\.png$/i, ".svg");
    return url.toString();
  } catch {
    return null;
  }
}

function HeroTeamBadge({ code, crest }: { code: string; crest: string | null }) {
  const vectorCrest = crest ? getVectorCrestUrl(crest) : null;
  const [useOriginal, setUseOriginal] = useState(false);

  if (!crest) return <span className="sportia-team-badge">{code}</span>;

  return <Image
    className="sportia-team-badge sportia-team-crest"
    src={vectorCrest && !useOriginal ? vectorCrest : crest}
    alt=""
    width={134}
    height={134}
    unoptimized={Boolean(vectorCrest && !useOriginal)}
    onError={() => { if (vectorCrest && !useOriginal) setUseOriginal(true); }}
  />;
}

export default function Home() {
  const profile = useHomeUserProfile();
  const [collapsedLeagues, setCollapsedLeagues] = useState<string[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [matchesByCompetition, setMatchesByCompetition] = useState<CompetitionGroup[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [unavailableCompetitions, setUnavailableCompetitions] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let currentDate = getLocalDate();
    const intervalId = window.setInterval(() => {
      const nextDate = getLocalDate();
      if (nextDate !== currentDate) {
        currentDate = nextDate;
        setRefreshKey((current) => current + 1);
      }
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const today = getLocalDate();
    void Promise.all(homeCompetitions.map(async (competition) => {
      try {
        const response = await fetch(`/api/local-fixtures?date=${today}&competition=${encodeURIComponent(competition.competition)}`, { signal: controller.signal });
        const payload = await response.json() as FixtureResponse;
        if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar los partidos.");
        const matches = (payload.fixtures ?? []).map((fixture): Match => ({
          id: `${competition.competition}:${fixture.id}`,
          competition: competition.competition,
          date: today,
          utcDate: fixture.utcDate,
          kickoff: formatKickoff(fixture.utcDate),
          home: fixture.homeTeam.name,
          away: fixture.awayTeam.name,
          homeLogo: fixture.homeTeam.crest ?? null,
          awayLogo: fixture.awayTeam.crest ?? null,
          venue: fixture.venue ?? null,
          analysisAvailable: payload.analysisAvailable ?? false,
          historicalAnalysis: fixture.historicalAnalysis ?? null,
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
  const allMatches = matchesByCompetition.flatMap((group) => group.matches);
  const recommendedParley = allMatches
    .map((match) => getRecommendedPick(match))
    .filter((pick): pick is ParleyPick => pick !== null)
    .sort((a, b) => b.probability - a.probability || a.match.utcDate.localeCompare(b.match.utcDate))
    .slice(0, 3);
  const parleyCompetitions = homeCompetitions.filter((competition) => recommendedParley.some((pick) => pick.match.competition === competition.competition));
  const toggleCompetition = (competition: string) => setSelectedCompetition((current) => current === competition ? null : competition);
  const todayLabel = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${getLocalDate()}T12:00:00-05:00`));
  const detailHref = selectedMatch ? getDetailHref(selectedMatch) : null;
  const toggleLeague = (name: string) => setCollapsedLeagues((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return (
    <div className="sportia-home">
      <SportiaSidebar active="Inicio" selectedCompetition={selectedCompetition} onCompetitionSelect={toggleCompetition} />

      <main className="sportia-main">
        <SportiaPageHeader title={`Welcome, ${profile.firstName}`} description={todayLabel} />

        <div className="sportia-dashboard">
          <section className="sportia-primary-column">
            <section className="sportia-hero" aria-labelledby="sportia-hero-title">
              <Image className="sportia-hero-image" src="/wallpapers/partido-recomendado-home.webp" alt="" fill sizes="(max-width: 720px) 100vw, 70vw" fetchPriority="high" />
              <div className="sportia-hero-overlay" aria-hidden="true" />
              <div className="sportia-hero-copy">
                {selectedMatch && <div className="sportia-hero-league"><Image src={homeCompetitions.find((league) => league.competition === selectedMatch.competition)?.logo ?? "/competitions/competition-placeholder.svg"} alt="" width={22} height={22} unoptimized /><span>{homeCompetitions.find((league) => league.competition === selectedMatch.competition)?.name ?? selectedMatch.competition}</span></div>}
                <h2 id="sportia-hero-title">{selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : "Football, today"}</h2>
                <p><Icon name="calendar" size={14} />{todayLabel} · {selectedMatch?.kickoff ?? "Today's fixtures"}</p>
                <p><Icon name="pin" size={14} />{selectedMatch?.venue ?? (selectedMatch ? "Venue not available" : "Explore today's matches")}</p>
                <Link className="sportia-hero-button" href={detailHref ?? (selectedMatch ? `/partidos?competicion=${encodeURIComponent(selectedMatch.competition)}` : "/partidos")}>{detailHref ? "View match analysis" : "View matches"} <span aria-hidden="true">→</span></Link>
              </div>
              {selectedMatch && <div className="sportia-hero-teams" aria-hidden="true"><div className="sportia-hero-team"><HeroTeamBadge key={`home:${selectedMatch.home}:${selectedMatch.homeLogo}`} code={teamCode(selectedMatch.home)} crest={selectedMatch.homeLogo} /><strong>{selectedMatch.home}</strong></div><span className="sportia-hero-vs">VS</span><div className="sportia-hero-team"><HeroTeamBadge key={`away:${selectedMatch.away}:${selectedMatch.awayLogo}`} code={teamCode(selectedMatch.away)} crest={selectedMatch.awayLogo} /><strong>{selectedMatch.away}</strong></div></div>}
            </section>

            <section className="sportia-card sportia-today-card" aria-labelledby="today-match-title">
              <div className="sportia-today-heading"><h2 id="today-match-title">Today Match</h2><Link href="/partidos">Full schedule <span aria-hidden="true">→</span></Link></div>
              <nav className="sportia-mobile-league-filter" aria-label="Filtrar por competición">
                {homeCompetitions.map((league) => <button type="button" key={league.competition} className={selectedCompetition === league.competition ? "is-active" : ""} aria-pressed={selectedCompetition === league.competition} onClick={() => toggleCompetition(league.competition)}><Image src={league.logo} alt="" width={20} height={20} unoptimized /><span>{league.name}</span></button>)}
              </nav>
              {loadState === "loading" && matchesByCompetition.length === 0 && <p className="sportia-fixture-state" role="status">Loading today&apos;s fixtures…</p>}
              {loadState === "error" && <div className="sportia-fixture-state" role="alert"><p>Today’s fixtures couldn’t be loaded.</p><button type="button" onClick={() => { setLoadState("loading"); setRefreshKey((current) => current + 1); }}>Try again</button></div>}
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
            <section className="sportia-card sportia-parley-card" aria-labelledby="parley-title">
              <div className="sportia-parley-heading"><span className="sportia-parley-title"><Icon name="star" size={19} /><h2 id="parley-title">Parley de hoy</h2></span><span className="sportia-parley-count">{recommendedParley.length || "Hasta 3"} {recommendedParley.length === 1 ? "selección" : "selecciones"}</span></div>
              <p className="sportia-parley-description">Las selecciones con mayor probabilidad estimada entre los partidos disponibles.</p>
              {parleyCompetitions.length > 0 && <ul className="sportia-parley-leagues" aria-label="Competiciones incluidas">{parleyCompetitions.map((league) => <li key={league.competition}><Image src={league.logo} alt="" width={17} height={17} unoptimized /><span>{league.name}</span></li>)}</ul>}
              {loadState === "loading" && recommendedParley.length === 0 && <p className="sportia-parley-state" role="status">Buscando estimaciones para hoy…</p>}
              {loadState === "error" && <p className="sportia-parley-state" role="alert">No se pudieron cargar las estimaciones. Inténtalo de nuevo.</p>}
              {loadState === "ready" && recommendedParley.length === 0 && <p className="sportia-parley-state" role="status">No hay estimaciones disponibles para los partidos de hoy en las competiciones con análisis del modelo.</p>}
              {recommendedParley.length > 0 && <ol className="sportia-parley-list">{recommendedParley.map((pick) => {
                const league = homeCompetitions.find((item) => item.competition === pick.match.competition);
                const href = getDetailHref(pick.match) ?? `/partidos?competicion=${encodeURIComponent(pick.match.competition)}`;
                return <li key={`${pick.match.id}:${pick.market}`}><Link className="sportia-parley-pick" href={href} aria-label={`${pick.match.home} contra ${pick.match.away}: ${pick.label}, probabilidad estimada ${pick.probability} por ciento`}>
                  <span className="sportia-parley-match"><span><TeamBadge code={teamCode(pick.match.home)} crest={pick.match.homeLogo} /><small>{pick.match.home}</small></span><b>VS</b><span><TeamBadge code={teamCode(pick.match.away)} crest={pick.match.awayLogo} /><small>{pick.match.away}</small></span></span>
                  <span className="sportia-parley-market"><strong>{pick.label}</strong><small>{league?.name ?? pick.match.competition}</small></span>
                  <strong className="sportia-parley-probability">{pick.probability}%</strong>
                </Link></li>;
              })}</ol>}
              {loadErrors.length > 0 && <p className="sportia-parley-state">Algunas competiciones no entregaron datos; solo se muestran estimaciones disponibles.</p>}
              {loadState === "error" && <button className="sportia-parley-retry" type="button" onClick={() => { setLoadState("loading"); setRefreshKey((current) => current + 1); }}>Intentar de nuevo</button>}
              <p className="sportia-parley-disclaimer">Estimaciones individuales del modelo; no son una probabilidad combinada ni consejo de apuesta.</p>
              <Link className="sportia-primary-button" href="/partidos">Ver agenda completa <span aria-hidden="true">→</span></Link>
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
