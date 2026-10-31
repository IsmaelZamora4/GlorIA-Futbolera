"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { competitions } from "@/data/metadata/demo-matches";
import { resolveFixtureVenue } from "@/data/metadata/team-venues";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";
import { FixtureState } from "@/features/fixtures/components/FixtureState";
import { getLocalDate } from "@/features/fixtures/services/local-date";
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

type Fixture = {
  id: string;
  competition: string;
  competitionLogo: string;
  date: string;
  kickoff: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  venue: string;
  status: string;
  score?: [number, number];
};

type FixtureCacheEntry = {
  fixtures: Fixture[];
  expiresAt: number;
};

const fixtureCachePrefix = "gloria-fixtures:v4:";
// Dos solicitudes en paralelo reducen el tiempo de arranque sin disparar una
// ráfaga que pueda agotar el límite de la fuente gratuita.
const maxConcurrentFixtureRequests = 2;

const localDetailCompetitionSlugs: Record<string, string> = {
  "Serie A de Italia": "serie-a",
  "LaLiga de España": "la-liga",
  "Ligue 1 de Francia": "ligue-1",
  "Bundesliga de Alemania": "bundesliga",
  "Premier League": "premier-league",
};

const featuredMatch: Fixture = {
  id: "featured-villarreal-espanyol",
  competition: "LaLiga de España",
  competitionLogo: "/competitions/laliga.svg",
  date: "2026-10-30",
  kickoff: "15:00",
  home: "Villarreal CF",
  away: "RCD Espanyol de Barcelona",
  homeLogo: "https://crests.football-data.org/94.png",
  awayLogo: "https://crests.football-data.org/80.png",
  venue: "Estadio de la Cerámica",
  status: "Próximo",
};

function readFixtureCache(cacheKey: string, now: number): FixtureCacheEntry | null {
  try {
    const stored = window.localStorage.getItem(`${fixtureCachePrefix}${cacheKey}`);
    if (!stored) return null;
    const entry = JSON.parse(stored) as FixtureCacheEntry;
    if (!Array.isArray(entry.fixtures) || entry.expiresAt <= now) {
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
    // La página sigue funcionando si el navegador no permite almacenamiento local.
  }
}

type FootballDataFixture = {
  id: number;
  utcDate: string;
  status: string;
  venue?: string | null;
  homeTeam: { name: string; crest?: string | null };
  awayTeam: { name: string; crest?: string | null };
  competition?: { emblem?: string | null };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
};

function toFootballDataFixture(fixture: FootballDataFixture, competition: string): Fixture {
  const kickoff = new Date(fixture.utcDate);
  const home = fixture.score?.fullTime?.home;
  const away = fixture.score?.fullTime?.away;
  return {
    id: `football-data-${fixture.id}`,
    competition,
    competitionLogo: getCompetitionLogo(competition, fixture.competition?.emblem),
    date: kickoff.toISOString().slice(0, 10),
    kickoff: kickoff.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Lima" }),
    home: fixture.homeTeam.name,
    away: fixture.awayTeam.name,
    homeLogo: fixture.homeTeam.crest || "/teams/team-placeholder.svg",
    awayLogo: fixture.awayTeam.crest || "/teams/team-placeholder.svg",
    venue: resolveFixtureVenue(competition, fixture.homeTeam.name, fixture.venue),
    status: fixture.status === "FINISHED" ? "Finalizado" : "Próximo",
    score: fixture.status === "FINISHED" && home != null && away != null ? [home, away] : undefined,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" }).format(date);
}

function getCompetitionLogo(competition: string, fallback?: string | null) {
  const localLogos: Record<string, string> = {
    "Serie A de Italia": "/competitions/serie-a.svg",
    "LaLiga de España": "/competitions/laliga.svg",
    "Ligue 1 de Francia": "/competitions/ligue-1.svg",
    "Bundesliga de Alemania": "/competitions/bundesliga.svg",
    "Premier League": "/competitions/premier-league.svg",
  };
  if (localLogos[competition]) return localLogos[competition];
  return fallback || "/competitions/competition-placeholder.svg";
}

function getFixtureDetailHref(fixture: Fixture) {
  const slug = localDetailCompetitionSlugs[fixture.competition];
  if (!slug || !fixture.date || !fixture.home || !fixture.away) return null;
  const query = new URLSearchParams({
    fecha: fixture.date,
    local: fixture.home,
    visitante: fixture.away,
    hora: fixture.kickoff,
    estadio: fixture.venue,
  });
  if (fixture.homeLogo && fixture.homeLogo !== "/teams/team-placeholder.svg") query.set("escudoLocal", fixture.homeLogo);
  if (fixture.awayLogo && fixture.awayLogo !== "/teams/team-placeholder.svg") query.set("escudoVisitante", fixture.awayLogo);
  return `/partido/${slug}?${query.toString()}`;
}

type MatchesIconName = "calendar" | "football" | "trophy" | "teams" | "form" | "competitions" | "star" | "pin" | "chevron";

function MatchesIcon({ name, size = 16 }: { name: MatchesIconName; size?: number }) {
  const paths: Record<MatchesIconName, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    football: <><circle cx="12" cy="12" r="9" /><path d="m9 9 3-2 3 2v4l-3 2-3-2zM3.5 9.5l5.5-.5M15 9l5.5.5M9 13l-2 5M15 13l2 5" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
    teams: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 5v1" /></>,
    form: <><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6" /></>,
    competitions: <><path d="M4 19h16M6 16V7l6-3 6 3v9M9 16v-5h6v5M3 8l9 5 9-5" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    chevron: <path d="m19 9-7 7-7-7" />,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const detailHref = getFixtureDetailHref(fixture);
  return <div className="sportia-match-row matches-schedule-row">
    <div className="sportia-match-side">
      <span className="sportia-kickoff">{fixture.score ? `${fixture.score[0]} — ${fixture.score[1]}` : fixture.kickoff}</span>
      <span className="sportia-team-name"><Image className="sportia-team-badge sportia-team-crest" src={fixture.homeLogo} alt={`Escudo de ${fixture.home}`} width={20} height={20} onError={(event) => { event.currentTarget.src = "/teams/team-placeholder.svg"; }} /><span>{fixture.home}</span></span>
    </div>
    <strong className="sportia-score">VS</strong>
    <div className="sportia-match-side away"><span className="sportia-team-name"><span>{fixture.away}</span><Image className="sportia-team-badge sportia-team-crest" src={fixture.awayLogo} alt={`Escudo de ${fixture.away}`} width={20} height={20} onError={(event) => { event.currentTarget.src = "/teams/team-placeholder.svg"; }} /></span></div>
    <div className="matches-fixture-meta">
      <span className="matches-fixture-venue"><MatchesIcon name="pin" size={13} />{fixture.venue || "Estadio por confirmar"}</span>
      {detailHref ? <Link className="matches-fixture-detail" href={detailHref}>Ver detalle <span aria-hidden="true">→</span></Link> : <span className="matches-fixture-unavailable">Sin dataset local</span>}
    </div>
  </div>;
}

function PartidosNavigation() {
  return <AppSidebar active="Partidos" />;
}

function PartidosContent() {
  const searchParams = useSearchParams();
  const requestedCompetition = searchParams.get("competicion");
  const initialCompetition = requestedCompetition && (requestedCompetition === "Todas" || competitions.includes(requestedCompetition as (typeof competitions)[number]))
    ? requestedCompetition
    : "Todas";
  const [competition, setCompetition] = useState(initialCompetition);
  const [date, setDate] = useState(getLocalDate);
  const [search, setSearch] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [collapsedCompetitions, setCollapsedCompetitions] = useState<Set<string>>(new Set());
  const loadFixtures = useCallback(async () => {
    setState("loading");
    setMessage("");
    const now = Date.now();
    const requestedCompetitions = competition === "Todas" ? competitions.slice(1) : [competition];
    const cachedFixtures = requestedCompetitions.flatMap((item) => (
      readFixtureCache(`${date}:${item}`, now)?.fixtures ?? []
    ));
    const missingCompetitions = requestedCompetitions.filter((item) => (
      !readFixtureCache(`${date}:${item}`, now)
    ));
    let loadedFixtures = cachedFixtures;
    const failures: string[] = [];
    setFixtures(loadedFixtures);

    const loadCompetition = async (requestedCompetition: string) => {
      const endpoint = `/api/local-fixtures?date=${date}&competition=${encodeURIComponent(requestedCompetition)}`;
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Fuente no disponible.");
      const loaded = (payload.fixtures as FootballDataFixture[]).map((fixture) => toFootballDataFixture(fixture, requestedCompetition));
      const fixtures = loaded.filter((fixture) => fixture.date === date);
      const ttlSeconds = Number(payload.cacheTtlSeconds) || 21_600;
      return { requestedCompetition, fixtures, expiresAt: Date.now() + ttlSeconds * 1000 };
    };

    for (let start = 0; start < missingCompetitions.length; start += maxConcurrentFixtureRequests) {
      const batch = missingCompetitions.slice(start, start + maxConcurrentFixtureRequests);
      const results = await Promise.allSettled(batch.map(loadCompetition));

      results.forEach((result, index) => {
        const requestedCompetition = batch[index];
        if (result.status === "fulfilled") {
          saveFixtureCache(`${date}:${requestedCompetition}`, {
            fixtures: result.value.fixtures,
            expiresAt: result.value.expiresAt,
          });
          loadedFixtures = [...loadedFixtures, ...result.value.fixtures];
          return;
        }
        failures.push(`${competitionLabels[requestedCompetition]}: ${result.reason instanceof Error ? result.reason.message : "sin respuesta"}`);
      });

      setFixtures(loadedFixtures);
      const completed = Math.min(start + batch.length, missingCompetitions.length);
      if (completed < missingCompetitions.length) {
        setMessage(`Mostrando ${loadedFixtures.length} partidos. Consultando ${completed} de ${missingCompetitions.length} competiciones nuevas…`);
      }
    }

    if (failures.length === requestedCompetitions.length && !loadedFixtures.length) {
      setMessage(failures.join(" · "));
      setState("error");
      return;
    }

    setMessage(`Agenda actualizada.${failures.length ? ` ${failures.length} competición(es) no respondieron.` : ""}`);
    setState("success");
  }, [competition, date]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFixtures();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFixtures]);

  const filtered = useMemo(() => fixtures.filter((fixture) => `${fixture.home} ${fixture.away}`.toLowerCase().includes(search.toLowerCase())), [fixtures, search]);
  const grouped = useMemo(() => {
    const days = new Map<string, Map<string, Fixture[]>>();
    filtered.forEach((fixture) => {
      const competitionsForDay = days.get(fixture.date) || new Map<string, Fixture[]>();
      competitionsForDay.set(fixture.competition, [...(competitionsForDay.get(fixture.competition) || []), fixture]);
      days.set(fixture.date, competitionsForDay);
    });
    return [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fixtureDate, competitionsForDay]) => [fixtureDate, [...competitionsForDay.entries()]] as const);
  }, [filtered]);
  const today = getLocalDate();
  const toggleCompetition = (competitionName: string) => {
    setCollapsedCompetitions((current) => {
      const next = new Set(current);
      if (next.has(competitionName)) next.delete(competitionName);
      else next.add(competitionName);
      return next;
    });
  };
  const dates = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(`${date}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() + index - 2);
    return current;
  });

  const activeCompetitions = [...new Set(fixtures.map((fixture) => fixture.competition))];
  const recommendedDetailHref = getFixtureDetailHref(featuredMatch);
  const fixtureState = state === "loading" ? "loading" : state === "error" ? "error" : grouped.length ? null : "empty";
  return (
    <div className="app-shell matches-shell">
      <PartidosNavigation />
      <main className="main-area">
        <SportiaPageHeader title="Partidos" description="Consulta la agenda de fútbol y encuentra los partidos de la fecha que elijas." />
        <header className="topbar matches-topbar">
          <label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Buscar equipo" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipo..." /><kbd>Ctrl K</kbd></label>
          <div className="top-actions"><label className="date-picker"><MatchesIcon name="calendar" /><input aria-label="Elegir fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><span>{date}</span></label><span className="demo-status"><i /> Agenda</span></div>
        </header>
        <div className="matches-layout">
          <section className="matches-page">
            <div className="matches-filters" aria-label="Filtros de partidos">
              <div className="matches-mode" aria-label="Secciones de agenda"><button className="active" type="button" aria-pressed="true"><MatchesIcon name="calendar" size={14} />Partidos</button><button type="button" disabled><MatchesIcon name="trophy" size={14} />Ligas</button><button type="button" disabled><MatchesIcon name="teams" size={14} />Equipos</button><button type="button" disabled><MatchesIcon name="form" size={14} />Rachas</button></div>
              <div className="matches-competitions" aria-label="Filtrar por competición"><button aria-pressed={competition === "Todas"} className={competition === "Todas" ? "active" : ""} onClick={() => setCompetition("Todas")}>Todas</button>{competitions.slice(1).map((item) => <button key={item} aria-pressed={competition === item} className={competition === item ? "active" : ""} onClick={() => setCompetition(item)}>{competitionLabels[item]}</button>)}</div>
            </div>
            <div className="agenda-date-nav" aria-label="Elegir día">{dates.map((current) => { const value = current.toISOString().slice(0, 10); return <button key={value} aria-pressed={value === date} className={value === date ? "active" : ""} onClick={() => setDate(value)}><b>{value === today ? "Hoy" : new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(current).replace(".", "")}</b><small>{dateLabel(current)}</small></button>; })}</div>
            {message && <p className="matches-feed-status" role="status">{message}</p>}
            <div className="professional-fixtures">{fixtureState ? <FixtureState state={fixtureState} onRetry={() => { void loadFixtures(); }} /> : grouped.map(([fixtureDate, dayCompetitions]) => <section key={fixtureDate} className="professional-day"><h2>{formatDate(fixtureDate)} <span>{dayCompetitions.reduce((total, [, dayFixtures]) => total + dayFixtures.length, 0)} partidos</span></h2>{dayCompetitions.map(([fixtureCompetition, competitionFixtures]) => { const collapsed = collapsedCompetitions.has(fixtureCompetition); return <div className="professional-competition" key={fixtureCompetition}><header className="professional-competition-header"><div className="professional-competition-info"><span className="professional-competition-logo"><Image src={competitionFixtures[0].competitionLogo} alt={`Logo de ${competitionLabels[fixtureCompetition] || fixtureCompetition}`} width={26} height={26} unoptimized onError={(event) => { event.currentTarget.src = "/competitions/competition-placeholder.svg"; }} /></span><strong>{competitionLabels[fixtureCompetition] || fixtureCompetition}</strong><small>{competitionLabels[fixtureCompetition] || fixtureCompetition} · {competitionFixtures.length} {competitionFixtures.length === 1 ? "partido" : "partidos"}</small></div><button type="button" className="professional-competition-toggle" onClick={() => toggleCompetition(fixtureCompetition)} aria-expanded={!collapsed} aria-label={`${collapsed ? "Mostrar" : "Ocultar"} ${competitionLabels[fixtureCompetition] || fixtureCompetition} partidos`}><MatchesIcon name="chevron" size={15} /></button></header>{!collapsed && competitionFixtures.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)}</div>; })}</section>)}</div>
          </section>
          <aside className="matches-aside">
            <section className="matches-summary-card"><div className="matches-aside-title"><span className="matches-aside-icon"><MatchesIcon name="football" /></span><div><h2>Resumen del día</h2><p>{formatDate(date)}</p></div></div><div className="matches-summary-stats"><div><strong>{filtered.length}</strong><span>Partidos</span></div><div><strong>{activeCompetitions.length}</strong><span>Ligas</span></div><div><strong className="summary-green">●</strong><span>Fuente real</span><small>Agenda actualizada</small></div></div></section>
            <section className="matches-active-card"><div className="matches-aside-title"><span className="matches-aside-icon"><MatchesIcon name="competitions" /></span><div><h2>Competiciones del día</h2></div><small>{activeCompetitions.length} {activeCompetitions.length === 1 ? "liga" : "ligas"}</small></div><div className="active-competition-list">{activeCompetitions.length ? activeCompetitions.map((item) => <div key={item}><Image src={getCompetitionLogo(item)} alt="" width={24} height={24} unoptimized /><strong>{competitionLabels[item]}</strong><span>Con partidos</span></div>) : <p className="matches-aside-empty">Todavía no hay partidos para esta fecha.</p>}</div></section>
            <section className="matches-recommended-card"><div className="recommended-card-header"><span className="matches-aside-icon"><MatchesIcon name="star" /></span><div><h2>Partido recomendado</h2><p>Destacado del día</p></div><span className="recommended-league">LaLiga</span></div><div className="recommended-match"><div><Image src={featuredMatch.homeLogo} alt="" width={42} height={42} unoptimized /><strong>{featuredMatch.home}</strong></div><span>VS</span><div><Image src={featuredMatch.awayLogo} alt="" width={42} height={42} unoptimized /><strong>{featuredMatch.away}</strong></div></div><p className="recommended-venue"><MatchesIcon name="pin" size={13} /> {featuredMatch.venue}</p><Link className="recommended-action" href={recommendedDetailHref ?? "/partidos"}>Ver análisis <span aria-hidden="true">→</span></Link></section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function PartidosPage() {
  return <Suspense fallback={<div className="empty-state">Cargando partidos…</div>}><PartidosContent /></Suspense>;
}
