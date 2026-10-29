"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { competitions, type HistoricalAnalysis, type Match } from "../data/demo-matches";
import { resolveFixtureVenue } from "../data/team-venues";
import { AppSidebar } from "../components/AppSidebar";
import { FixtureState } from "../components/FixtureState";
import { getLocalDate } from "../lib/local-date";

type IconName = "home" | "matches" | "trophy" | "book" | "database" | "settings" | "search" | "calendar" | "arrow" | "globe" | "ball" | "trend" | "corner" | "target";

const competitionLabels: Record<string, string> = {
  "Todas": "Todas",
  "Liga 1 de Perú": "Liga 1",
  "Serie A de Italia": "Serie A",
  "LaLiga de España": "LaLiga",
  "Ligue 1 de Francia": "Ligue 1",
  "Bundesliga de Alemania": "Bundesliga",
  "Premier League": "Premier League",
  "Champions League": "Champions League",
  "Europa League": "Europa League",
};

const competitionLogos: Record<string, string> = {
  "Liga 1 de Perú": "/competitions/liga-1-peru.svg",
  "Serie A de Italia": "/competitions/serie-a.svg",
  "LaLiga de España": "/competitions/laliga.svg",
  "Ligue 1 de Francia": "/competitions/ligue-1.svg",
  "Bundesliga de Alemania": "/competitions/bundesliga.svg",
  "Premier League": "/competitions/premier-league.svg",
  "Champions League": "/competitions/champions-league.svg",
  "Europa League": "/competitions/europa-league.svg",
};

const localDetailCompetitionSlugs: Record<string, string> = {
  "Serie A de Italia": "serie-a",
  "LaLiga de España": "la-liga",
  "Ligue 1 de Francia": "ligue-1",
  "Bundesliga de Alemania": "bundesliga",
  "Premier League": "premier-league",
};

function getMatchDetailHref(match: Pick<Match, "competition" | "date" | "home" | "away" | "kickoff" | "venue" | "homeLogo" | "awayLogo">) {
  const slug = localDetailCompetitionSlugs[match.competition];
  if (!slug || !match.date || !match.home || !match.away) return null;
  const query = new URLSearchParams({
    fecha: match.date,
    local: match.home,
    visitante: match.away,
    hora: match.kickoff,
    estadio: match.venue,
  });
  if (match.homeLogo && match.homeLogo !== "/team-placeholder.svg") query.set("escudoLocal", match.homeLogo);
  if (match.awayLogo && match.awayLogo !== "/team-placeholder.svg") query.set("escudoVisitante", match.awayLogo);
  return `/partido/${slug}?${query.toString()}`;
}

const inFlightFixtureRequests = new Set<string>();
const fixtureCachePrefix = "gloria-home-fixtures:v3:";
const requestDelayMs = 1_100;

type FootballDataFixture = {
  id: number; utcDate: string; status: string; venue?: string | null;
  homeTeam: { id: number; name: string; crest?: string | null };
  awayTeam: { id: number; name: string; crest?: string | null };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
  historicalAnalysis?: HistoricalAnalysis | null;
};

type FixtureCacheEntry = { matches: Match[]; expiresAt: number; dateFrom: string; dateTo: string };

function readFixtureCache(cacheKey: string, now: number): FixtureCacheEntry | null {
  try {
    const stored = window.localStorage.getItem(`${fixtureCachePrefix}${cacheKey}`);
    if (!stored) return null;
    const entry = JSON.parse(stored) as FixtureCacheEntry;
    if (!Array.isArray(entry.matches) || entry.expiresAt <= now) {
      window.localStorage.removeItem(`${fixtureCachePrefix}${cacheKey}`);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function saveFixtureCache(cacheKey: string, entry: FixtureCacheEntry) {
  try {
    window.localStorage.setItem(`${fixtureCachePrefix}${cacheKey}`, JSON.stringify(entry));
  } catch {
    // El análisis sigue funcionando si el navegador no permite almacenamiento local.
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function toAgendaMatch(fixture: FootballDataFixture, competition: string): Match {
  const kickoff = new Date(fixture.utcDate);
  const finished = fixture.status === "FINISHED";
  const homeScore = fixture.score?.fullTime?.home;
  const awayScore = fixture.score?.fullTime?.away;
  const analysis = fixture.historicalAnalysis ?? undefined;
  const pending = { label: "Sin dato", confidence: null, note: "Fixture cargado; el análisis aún no está disponible." };
  const candidates: [string, number][] = analysis
    ? [[fixture.homeTeam.name, analysis.probabilities.home], ["Empate", analysis.probabilities.draw], [fixture.awayTeam.name, analysis.probabilities.away]]
    : [];
  const favorite = candidates.reduce<[string, number] | null>((best, current) => !best || current[1] > best[1] ? current : best, null);
  const historicalMetrics = analysis ? {
    winner: { label: favorite![0], confidence: favorite![1], note: analysis.usingLeagueBaseline ? "Uno de los clubes no tiene muestra suficiente: se aplicó la media histórica de la liga." : `Modelo histórico local: ${analysis.homeSample} partidos de local y ${analysis.awaySample} de visita.` },
    goals: { label: analysis.markets.goals.over25 >= 50 ? "Más de 2.5" : "Menos de 2.5", confidence: Math.max(analysis.markets.goals.over25, 100 - analysis.markets.goals.over25), note: `Media ${analysis.expectedGoals.total.toFixed(1)} · +1.5: ${analysis.markets.goals.over15}% · +2.5: ${analysis.markets.goals.over25}% · +3.5: ${analysis.markets.goals.over35}%.` },
    btts: { label: analysis.markets.btts.yes >= 50 ? "Sí" : "No", confidence: Math.max(analysis.markets.btts.yes, analysis.markets.btts.no), note: `Sí: ${analysis.markets.btts.yes}% · No: ${analysis.markets.btts.no}%.` },
    corners: { label: analysis.markets.corners.over85 >= 50 ? "Más de 8.5" : "Menos de 8.5", confidence: Math.max(analysis.markets.corners.over85, 100 - analysis.markets.corners.over85), note: `Media ${analysis.expectedCorners.total.toFixed(1)} · +8.5: ${analysis.markets.corners.over85}% · +9.5: ${analysis.markets.corners.over95}%.` },
    shots: { label: `${fixture.homeTeam.name} · ${analysis.expectedShotsOnTarget.home.toFixed(1)}`, confidence: analysis.markets.shotsOnTarget.homeOver25, note: `+2.5 local: ${analysis.markets.shotsOnTarget.homeOver25}% · +2.5 visita: ${analysis.markets.shotsOnTarget.awayOver25}% · +7.5 total: ${analysis.markets.shotsOnTarget.totalOver75}%.` },
  } : null;
  return {
    id: `football-data-${fixture.id}`, competition, shortCompetition: competitionLabels[competition],
    date: kickoff.toISOString().slice(0, 10),
    kickoff: kickoff.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Lima" }),
    home: fixture.homeTeam.name, away: fixture.awayTeam.name, homeTeamId: fixture.homeTeam.id, awayTeamId: fixture.awayTeam.id,
    homeCode: fixture.homeTeam.name.slice(0, 3).toUpperCase(), awayCode: fixture.awayTeam.name.slice(0, 3).toUpperCase(),
    homeLogo: fixture.homeTeam.crest || "/team-placeholder.svg", awayLogo: fixture.awayTeam.crest || "/team-placeholder.svg",
    venue: resolveFixtureVenue(competition, fixture.homeTeam.name, fixture.venue), status: finished ? "Finalizado" : "En análisis",
    score: finished && homeScore != null && awayScore != null ? [homeScore, awayScore] : undefined,
    probabilities: analysis?.probabilities ?? { home: 0, draw: 0, away: 0 },
    metrics: historicalMetrics ?? { winner: { ...pending, label: "Sin predicción" }, corners: pending, btts: pending, goals: pending, shots: pending },
    stats: analysis ? [
      { label: "Goles esperados", home: analysis.expectedGoals.home.toFixed(1), away: analysis.expectedGoals.away.toFixed(1), available: true },
      { label: "Córneres esperados", home: "—", away: analysis.expectedCorners.total.toFixed(1), available: true },
      { label: "Tiros a puerta", home: analysis.expectedShotsOnTarget.home.toFixed(1), away: analysis.expectedShotsOnTarget.away.toFixed(1), available: true },
      { label: "Muestra histórica", home: `${analysis.homeSample} local`, away: `${analysis.awaySample} visita`, available: true },
    ] : [{ label: "Análisis", home: "Pendiente", away: "Pendiente", available: false }],
    dataSource: "fixture", historicalAnalysis: analysis,
  };
}

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="m3 8 5-5 5 5v5H9v-3H7v3H3V8Zm5-5v2" />,
    matches: <><rect x="3" y="4" width="10" height="9" rx="1.5" /><path d="M5 2v3M11 2v3M3 7h10" /></>,
    trophy: <><path d="M5 3h6v3a3 3 0 0 1-6 0V3ZM8 9v3M5 13h6M3 4H2v1a2 2 0 0 0 2 2M13 4h1v1a2 2 0 0 1-2 2" /></>,
    book: <><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2H7v10H4.5A1.5 1.5 0 0 0 3 13.5v-10Z" /><path d="M13 3.5A1.5 1.5 0 0 0 11.5 2H9v10h2.5a1.5 1.5 0 0 1 1.5 1.5v-10Z" /></>,
    database: <><ellipse cx="8" cy="3.5" rx="5" ry="2" /><path d="M3 3.5v5c0 1.1 2.2 2 5 2s5-.9 5-2v-5M3 8.5v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4" /></>,
    settings: <><circle cx="8" cy="8" r="2.2" /><path d="m13 8 1-1-1-2-1.5.2a5 5 0 0 0-1.2-.7L10 3H6l-.3 1.5a5 5 0 0 0-1.2.7L3 5 2 7l1 1-1 1 1 2 1.5-.2c.4.3.8.5 1.2.7L6 13h4l.3-1.5a5 5 0 0 0 1.2-.7L13 11l1-2-1-1Z" /></>,
    search: <><circle cx="7" cy="7" r="4" /><path d="m10 10 3 3" /></>,
    calendar: <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M5 2v3M11 2v3M2.5 6h11" /></>,
    arrow: <><path d="M3 8h9M9 5l3 3-3 3" /></>,
    globe: <><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" /></>,
    ball: <><circle cx="8" cy="8" r="6" /><path d="m8 5 2 1.5-.7 2.4h-2.6L6 6.5 8 5ZM6 6.5l-2 1M10 6.5l2 1M6.7 8.9 5.5 11M9.3 8.9l1.2 2" /></>,
    trend: <><path d="M3 11 6 8l2 2 4-5" /><path d="M9 5h3v3" /></>,
    corner: <><path d="M4 13V3M4 4h7l-2 2 2 2H4" /></>,
    target: <><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" /><path d="M8 2.5V1M8 15v-1.5M2.5 8H1M15 8h-1.5" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Logo() {
  return <Image className="logo-image" src="/logo-gloria.png" alt="GlorIA Futbolera — Football intelligence" width={136} height={84} priority />;
}

function CompetitionMark({ competition, size = 18 }: { competition: string; size?: number }) {
  const logo = competitionLogos[competition];
  if (!logo) return <Icon name="ball" size={Math.max(12, size - 2)} />;
  return <Image className="competition-mark" src={logo} alt="" width={size} height={size} unoptimized style={{ width: size, height: size, objectFit: "contain" }} />;
}

function Sidebar({ active }: { active: string }) {
  return <AppSidebar active={active} />;
}

function MatchRow({ match, selected, onSelect }: { match: Match; selected: boolean; onSelect: () => void }) {
  const detailHref = getMatchDetailHref(match);
  return <article className={`match-row gloria-reveal interactive-card ${selected ? "selected" : ""}`}>
    <button type="button" onClick={onSelect} className="match-row-select" aria-pressed={selected} aria-label={`Seleccionar ${match.home} contra ${match.away}`}>
      <div className="match-row-top"><span className="match-competition"><CompetitionMark competition={match.competition} /><span>{match.shortCompetition}</span></span><span className={match.status === "Finalizado" ? "status-finished" : "status-upcoming"}>{match.status}</span></div>
      <div className="match-teams"><div className="team-line"><Image className="club-mark" src={match.homeLogo} alt={`Escudo de ${match.home}`} width={22} height={22} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><span>{match.home}</span></div><div className="match-time">{match.kickoff}</div><div className="team-line"><Image className="club-mark away" src={match.awayLogo} alt={`Escudo de ${match.away}`} width={22} height={22} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><span>{match.away}</span></div></div>
      <div className="match-row-foot"><span>{match.venue}</span><Icon name="arrow" size={14} /></div>
    </button>
    {detailHref ? <Link className="match-detail-link" href={detailHref}>Ver detalle <span aria-hidden="true">→</span></Link> : <span className="match-no-detail">Sin dataset local para el detalle estadístico</span>}
  </article>;
}

function formatAgendaDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" }).format(date);
}

function getAgendaDates(date: string) {
  const selected = new Date(`${date}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(selected);
    current.setUTCDate(selected.getUTCDate() + index - 2);
    return current;
  });
}

export default function Home() {
  const [competition, setCompetition] = useState("Todas");
  const [team, setTeam] = useState("");
  const [date, setDate] = useState(getLocalDate);
  const [selectedId, setSelectedId] = useState("");
  const [realDataState, setRealDataState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [realDataMessage, setRealDataMessage] = useState("Pulsa Actualizar datos para cargar el dataset local.");
  const [fixtureCache, setFixtureCache] = useState<Record<string, FixtureCacheEntry>>({});
  const fixtureCacheRef = useRef(fixtureCache);
  const [cacheReferenceTime, setCacheReferenceTime] = useState(0);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const today = date || getLocalDate();
  const requestedDate = date || today;
  const fixtureCacheKey = `${competition}:${requestedDate}:day`;
  const realMatches = competition === "Todas"
    ? Object.entries(fixtureCache)
      .filter(([key, entry]) => key.endsWith(`:${requestedDate}:day`) && entry.expiresAt > cacheReferenceTime)
      .flatMap(([, entry]) => entry.matches)
    : fixtureCache[fixtureCacheKey]?.expiresAt > cacheReferenceTime
      ? fixtureCache[fixtureCacheKey].matches
      : null;
  const filtered = useMemo(() => (realMatches ?? []).filter((match) => {
    const competitionMatch = competition === "Todas" || match.competition === competition;
    const teamMatch = !team || `${match.home} ${match.away}`.toLowerCase().includes(team.toLowerCase());
    const dateMatch = !date || realMatches !== null || match.date === date;
    return competitionMatch && teamMatch && dateMatch;
  }), [competition, team, date, realMatches]);
  const hasOtherCachedFixtures = competition !== "Todas" && Object.entries(fixtureCache).some(([cacheKey, entry]) => (
    cacheKey.endsWith(`:${requestedDate}:day`)
    && entry.expiresAt > cacheReferenceTime
    && entry.matches.some((match) => match.competition !== competition)
  ));
  const matchesByCompetition = useMemo(() => {
    const grouped = new Map<string, Match[]>();
    for (const match of filtered) {
      const matches = grouped.get(match.competition) ?? [];
      matches.push(match);
      grouped.set(match.competition, matches);
    }
    return [...grouped.entries()].sort(([competitionA], [competitionB]) => competitionA.localeCompare(competitionB));
  }, [filtered]);
  const toggleCompetition = (competitionName: string) => {
    setCollapsedDays((current) => {
      const next = new Set(current);
      if (next.has(competitionName)) next.delete(competitionName);
      else next.add(competitionName);
      return next;
    });
  };
  const agendaDates = getAgendaDates(requestedDate);
  const selected = filtered.find((match) => match.id === selectedId) || filtered[0];
  const homeFixtureState = filtered.length
    ? null
    : realDataState === "error"
      ? "error"
      : realDataState === "success"
        ? "empty"
      : "empty";
  const loadRealData = useCallback(async () => {
    const requestKey = `${competition}:${requestedDate}`;
    if (inFlightFixtureRequests.has(requestKey)) return;
    inFlightFixtureRequests.add(requestKey);
    setRealDataState("loading");
    setRealDataMessage("");
    try {
    const requestedCompetitions = competition === "Todas" ? competitions.slice(1) : [competition];
    const now = Date.now();
    const currentCache = fixtureCacheRef.current;
    const getCachedEntry = (item: string) => {
      const cacheKey = `${item}:${requestedDate}:day`;
      const memoryEntry = currentCache[cacheKey];
      return memoryEntry && memoryEntry.expiresAt > now ? memoryEntry : readFixtureCache(cacheKey, now);
    };
    const cachedMatches = requestedCompetitions.flatMap((item) => getCachedEntry(item)?.matches ?? []);
    const missingCompetitions = requestedCompetitions.filter((item) => !getCachedEntry(item));
    const loadedEntries: Record<string, FixtureCacheEntry> = {};
    const failures: string[] = [];
    const fetchedMatches: Match[] = [];
    for (let index = 0; index < missingCompetitions.length; index += 1) {
      const requestedCompetition = missingCompetitions[index];
      const endpoint = `/api/local-fixtures?date=${requestedDate}&competition=${encodeURIComponent(requestedCompetition)}`;
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(`${requestedCompetition}: ${payload.error || "fuente no disponible"}`);
        const rawMatches = (payload.fixtures as FootballDataFixture[]).map((fixture) => toAgendaMatch(fixture, requestedCompetition));
        const matches = rawMatches.filter((match) => match.date === requestedDate);
        const cacheKey = `${requestedCompetition}:${requestedDate}:day`;
        const entry = { matches, dateFrom: requestedDate, dateTo: requestedDate, expiresAt: Date.now() + (Number(payload.cacheTtlSeconds) || 21_600) * 1000 };
        loadedEntries[cacheKey] = entry;
        saveFixtureCache(cacheKey, entry);
        fetchedMatches.push(...matches);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `${requestedCompetition}: fuente no disponible`);
      }
      if (index < missingCompetitions.length - 1) await wait(requestDelayMs);
    }
    const allMatches = [...cachedMatches, ...fetchedMatches];
    setFixtureCache((current) => {
      const next = { ...current, ...loadedEntries };
      fixtureCacheRef.current = next;
      return next;
    });
    setCacheReferenceTime(Date.now());
    if (failures.length === requestedCompetitions.length && !allMatches.length) {
      setRealDataState("error");
      setRealDataMessage(failures.join(" · "));
      return;
    }
    setRealDataState("success");
    setRealDataMessage(`${allMatches.length} partidos del dataset local del ${requestedDate}${cachedMatches.length ? " · reutilizando caché" : ""}${failures.length ? ` · ${failures.length} fuente(s) sin respuesta` : ""}.`);
    } finally {
      inFlightFixtureRequests.delete(requestKey);
    }
  }, [competition, requestedDate]);

  return <div className="app-shell home-dashboard-shell"><Sidebar active="Inicio" /><main className="main-area"><header id="configuracion" className="topbar home-topbar"><div className="mobile-logo"><Logo /></div><label className="search-box"><Icon name="search" size={17} /><input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Buscar equipo o partido..." /><kbd>⌘ K</kbd></label><div className="top-actions"><label className="date-picker"><Icon name="calendar" size={15} /><input aria-label="Elegir fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><span>{date ? formatAgendaDate(date) : "Hoy"}</span></label><button className="home-refresh-button" onClick={() => void loadRealData()} disabled={realDataState === "loading"}>{realDataState === "loading" ? "Consultando…" : "Actualizar"}</button></div></header><div className="content home-dashboard-content"><section id="inicio" className="home-welcome"><div><span className="home-welcome-kicker">GLORIA FUTBOLERA · INTELIGENCIA DEPORTIVA</span><h1>Fútbol con contexto.</h1><p>Datos, análisis y agenda para entender cada partido.</p></div><a href="#partidos" className="home-date-chip"><Icon name="calendar" size={16} />{formatAgendaDate(requestedDate)}<span aria-hidden="true">↓</span></a></section><div className="home-dashboard-grid"><div className="home-primary-column"><section className="home-editorial-hero" aria-label="GlorIA Futbolera"><div className="home-editorial-copy"><span className="home-editorial-kicker">ANÁLISIS DE FÚTBOL, CON DATOS</span><h2>El juego se entiende mejor<br /><em>cuando miras más allá.</em></h2><p>Explora competiciones, consulta la agenda y descubre qué hay detrás de cada encuentro.</p><Link href="/metodologia" className="home-editorial-link">Conoce nuestra metodología <Icon name="arrow" size={15} /></Link></div><div className="home-editorial-mark" aria-hidden="true"><Image src="/logo-gloria.png" alt="" width={180} height={110} /></div></section><section id="partidos" className="home-agenda-panel"><div className="home-section-heading"><div><span className="home-section-kicker">AGENDA DE FÚTBOL</span><h2>{requestedDate === getLocalDate() ? "Partidos de hoy" : formatAgendaDate(requestedDate)}</h2></div><span className="home-match-count">{filtered.length} {filtered.length === 1 ? "partido" : "partidos"}</span></div><nav className="home-date-nav" aria-label="Seleccionar fecha">{agendaDates.map((agendaDate) => { const value = agendaDate.toISOString().slice(0, 10); const isToday = value === getLocalDate(); return <button type="button" key={value} className={requestedDate === value ? "active" : ""} onClick={() => setDate(value)} aria-pressed={requestedDate === value}><b>{isToday ? "Hoy" : new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(agendaDate).replace(".", "")}</b><small>{formatShortDate(agendaDate)}</small></button>; })}</nav><div id="competiciones" className="home-filter-row"><label htmlFor="home-competition">Competición</label><select id="home-competition" value={competition} onChange={(event) => setCompetition(event.target.value)}>{competitions.map((item) => <option key={item} value={item}>{competitionLabels[item]}</option>)}</select><button className="home-load-button" onClick={() => void loadRealData()} disabled={realDataState === "loading"}>{realDataState === "loading" ? "Consultando…" : "Cargar agenda"}</button><span className={`real-data-message ${realDataState}`} role="status">{realDataMessage || "Consultando fuente…"}</span></div><div className="home-match-groups" aria-live="polite">{realDataState === "loading" && !filtered.length ? <FixtureState state="loading" /> : homeFixtureState ? <FixtureState state={homeFixtureState} contextLabel={competitionLabels[competition]} hasOtherFixtures={hasOtherCachedFixtures} dateLabel={formatAgendaDate(requestedDate)} onRetry={() => void loadRealData()} /> : <div className="fixture-list">{realDataState === "success" && realDataMessage.includes("reutilizando caché") && <FixtureState state="stale" />}{matchesByCompetition.map(([competitionName, competitionMatches]) => { const collapsed = collapsedDays.has(competitionName); return <section className="home-competition-group" key={competitionName}><button type="button" className="home-competition-heading" onClick={() => toggleCompetition(competitionName)} aria-expanded={!collapsed}><span className="home-competition-identity"><CompetitionMark competition={competitionName} size={28} /><span><strong>{competitionLabels[competitionName] ?? competitionName}</strong><small>{competitionName}</small></span></span><span className="home-group-count">{competitionMatches.length} {competitionMatches.length === 1 ? "partido" : "partidos"}</span><span className="home-group-chevron" aria-hidden="true">{collapsed ? "+" : "−"}</span></button>{!collapsed && <div className="agenda-day-matches">{competitionMatches.map((match) => <MatchRow key={match.id} match={match} selected={selected?.id === match.id} onSelect={() => setSelectedId(match.id)} />)}</div>}</section>; })}</div>}</div></section></div><aside className="home-secondary-column"><section className="home-recommended-panel"><span className="home-section-kicker">PARA SEGUIR DE CERCA</span><h2>Partido recomendado</h2>{selected ? <><div className="home-recommended-league"><CompetitionMark competition={selected.competition} size={20} />{competitionLabels[selected.competition] ?? selected.competition}</div><div className="home-recommended-teams"><div><Image src={selected.homeLogo} alt="" width={54} height={54} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><strong>{selected.home}</strong></div><span>VS</span><div><Image src={selected.awayLogo} alt="" width={54} height={54} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><strong>{selected.away}</strong></div></div><div className="home-recommended-meta"><span><Icon name="calendar" size={14} />{formatAgendaDate(selected.date)}</span><span>{selected.kickoff} · {selected.venue}</span></div>{getMatchDetailHref(selected) ? <Link className="home-recommended-cta" href={getMatchDetailHref(selected)!}>Ver análisis del partido <Icon name="arrow" size={15} /></Link> : <p className="home-no-analysis">El análisis detallado aún no está disponible para este encuentro.</p>}</> : <div className="home-recommended-empty"><p>Selecciona un partido de la agenda para ver aquí sus datos.</p></div>}</section><section className="home-article-panel"><div className="home-article-heading"><span className="home-section-kicker">ACTUALIDAD</span><h2>Latest Article</h2></div><div className="home-article-placeholder"><span className="home-article-symbol" aria-hidden="true">✳</span><strong>Próximamente</strong><p>Estamos preparando una selección de noticias de fútbol. Esta sección se conectará a una fuente editorial cuando esté disponible.</p></div></section><section className="home-coverage-panel"><span className="home-section-kicker">DATOS DISPONIBLES</span><h2>Cobertura histórica</h2><p>El modelo local ofrece análisis para estas ligas:</p><div className="home-coverage-list">{["Serie A de Italia", "LaLiga de España", "Ligue 1 de Francia", "Bundesliga de Alemania", "Premier League"].map((item) => <span key={item}><CompetitionMark competition={item} size={17} />{competitionLabels[item]}</span>)}</div></section></aside></div></div><footer className="home-footer">GlorIA Futbolera <span>·</span> Datos deportivos consultados desde fuentes reales.</footer></main></div>;
}
