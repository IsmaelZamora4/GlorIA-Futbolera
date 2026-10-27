"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { competitions } from "../../data/demo-matches";
import { resolveFixtureVenue } from "../../data/team-venues";
import { AppSidebar } from "../../components/AppSidebar";
import { FixtureState } from "../../components/FixtureState";

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

const footballDataCompetitions: Record<string, string> = {
  "Serie A de Italia": "SA",
  "LaLiga de España": "PD",
  "Ligue 1 de Francia": "FL1",
  "Bundesliga de Alemania": "BL1",
  "Premier League": "PL",
  "Champions League": "CL",
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

const fixtureCachePrefix = "gloria-fixtures:v3:";
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

type SportsDbEvent = {
  idEvent: string;
  dateEvent?: string;
  strTime?: string | null;
  strStatus?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  strVenue?: string | null;
  strLeagueBadge?: string | null;
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
    homeLogo: fixture.homeTeam.crest || "/team-placeholder.svg",
    awayLogo: fixture.awayTeam.crest || "/team-placeholder.svg",
    venue: resolveFixtureVenue(competition, fixture.homeTeam.name, fixture.venue),
    status: fixture.status === "FINISHED" ? "Finalizado" : "Próximo",
    score: fixture.status === "FINISHED" && home != null && away != null ? [home, away] : undefined,
  };
}

function toSportsDbFixture(event: SportsDbEvent, competition: string): Fixture {
  const home = event.intHomeScore == null ? NaN : Number(event.intHomeScore);
  const away = event.intAwayScore == null ? NaN : Number(event.intAwayScore);
  const finished = /finished|ended|finalizado/i.test(event.strStatus ?? "") || (Number.isFinite(home) && Number.isFinite(away));
  return {
    id: `sportsdb-${event.idEvent}`,
    competition,
    competitionLogo: getCompetitionLogo(competition, event.strLeagueBadge),
    date: event.dateEvent || "",
    kickoff: event.strTime?.slice(0, 5) || "Por confirmar",
    home: event.strHomeTeam,
    away: event.strAwayTeam,
    homeLogo: event.strHomeTeamBadge || "/team-placeholder.svg",
    awayLogo: event.strAwayTeamBadge || "/team-placeholder.svg",
    venue: resolveFixtureVenue(competition, event.strHomeTeam, event.strVenue),
    status: finished ? "Finalizado" : "Próximo",
    score: finished && Number.isFinite(home) && Number.isFinite(away) ? [home, away] : undefined,
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
  return fallback || "/competition-placeholder.svg";
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
  if (fixture.homeLogo && fixture.homeLogo !== "/team-placeholder.svg") query.set("escudoLocal", fixture.homeLogo);
  if (fixture.awayLogo && fixture.awayLogo !== "/team-placeholder.svg") query.set("escudoVisitante", fixture.awayLogo);
  return `/partido/${slug}?${query.toString()}`;
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const detailHref = getFixtureDetailHref(fixture);
  return <div className="professional-fixture">
    <div className="professional-fixture-time">{fixture.score ? `${fixture.score[0]} — ${fixture.score[1]}` : fixture.kickoff}</div>
    <div className="professional-team"><span>{fixture.home}</span><Image src={fixture.homeLogo} alt={`Escudo de ${fixture.home}`} width={28} height={28} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /></div>
    <div className="professional-vs">VS</div>
    <div className="professional-team away"><Image src={fixture.awayLogo} alt={`Escudo de ${fixture.away}`} width={28} height={28} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><span>{fixture.away}</span></div>
    <div className="professional-venue">{fixture.venue}</div>
    <span className={`professional-status ${fixture.status === "Finalizado" ? "finished" : ""}`}>{fixture.status}</span>
    {detailHref ? <Link className="professional-detail-link" href={detailHref}>Ver detalle <span aria-hidden="true">→</span></Link> : <span className="professional-no-detail">Sin dataset local</span>}
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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const loadFixtures = useCallback(async () => {
    setState("loading");
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
      const endpoint = footballDataCompetitions[requestedCompetition]
        ? `/api/football-data/fixtures?date=${date}&competition=${encodeURIComponent(requestedCompetition)}`
        : `/api/sportsdb/fixtures?date=${date}&league=${encodeURIComponent(requestedCompetition)}`;
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Fuente no disponible.");
      const loaded = footballDataCompetitions[requestedCompetition]
        ? (payload.fixtures as FootballDataFixture[]).map((fixture) => toFootballDataFixture(fixture, requestedCompetition))
        : (payload.events as SportsDbEvent[]).map((event) => toSportsDbFixture(event, requestedCompetition));
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

    setMessage(`${loadedFixtures.length} partidos reales disponibles desde la caché y consultas controladas.${failures.length ? ` · ${failures.length} competición(es) no respondió` : ""}`);
    setState("success");
  }, [competition, date]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadFixtures(); }, 0);
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
  const dates = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(`${date}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() + index - 2);
    return current;
  });

  const fixtureState = state === "loading" ? "loading" : state === "error" ? "error" : grouped.length ? null : "empty";
  return <div className="app-shell"><PartidosNavigation /><main className="main-area"><header className="topbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipo o liga..." /></label><div className="top-actions"><label className="date-picker"><span>◷</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><span>{date}</span></label><span className="demo-status"><i /> Datos reales</span></div></header><div className="matches-page"><div className="matches-heading"><div><div className="eyebrow">Fixture · {competitionLabels[competition]}</div><h1>Partidos</h1><p>Consulta todos los partidos reales del día y filtra por competición cuando quieras.</p></div><span className="fixtures-source"><i /> Fuente real<br /><small>{state === "loading" ? "Actualizando…" : message}</small></span></div><div className="matches-mode"><button className="active">Partidos</button><button disabled>Ligas</button><button disabled>Equipos</button><button disabled>Rachas</button></div><div className="matches-competitions"><button className={competition === "Todas" ? "active" : ""} onClick={() => setCompetition("Todas")}>{competitionLabels.Todas}</button>{competitions.slice(1).map((item) => <button key={item} className={competition === item ? "active" : ""} onClick={() => setCompetition(item)}>{competitionLabels[item]}</button>)}</div><div className="agenda-date-nav">{dates.map((current) => { const value = current.toISOString().slice(0, 10); return <button key={value} className={value === date ? "active" : ""} onClick={() => setDate(value)}><b>{value === new Date().toISOString().slice(0, 10) ? "Hoy" : new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(current).replace(".", "")}</b><small>{dateLabel(current)}</small></button>; })}</div><div className="professional-fixtures">{fixtureState ? <FixtureState state={fixtureState} onRetry={() => { void loadFixtures(); }} /> : grouped.map(([fixtureDate, dayCompetitions]) => <section key={fixtureDate} className="professional-day"><h2>{formatDate(fixtureDate)} <span>{dayCompetitions.reduce((total, [, dayFixtures]) => total + dayFixtures.length, 0)} partidos</span></h2>{dayCompetitions.map(([fixtureCompetition, competitionFixtures]) => <div className="professional-competition" key={fixtureCompetition}>  <header className="professional-competition-header"><span className={`professional-competition-logo ${fixtureCompetition === "Premier League" ? "premier" : fixtureCompetition === "Ligue 1 de Francia" ? "ligue" : ""}`}><Image src={competitionFixtures[0].competitionLogo} alt={`Logo de ${competitionLabels[fixtureCompetition] || fixtureCompetition}`} width={26} height={26} unoptimized onError={(event) => { event.currentTarget.src = "/competition-placeholder.svg"; }} /></span><strong>{competitionLabels[fixtureCompetition] || fixtureCompetition}</strong><small>Partidos del día</small><span aria-hidden="true">⌄</span></header>{competitionFixtures.map((fixture) => <FixtureRow key={fixture.id} fixture={fixture} />)}</div>)}</section>)}</div></div></main></div>;
}

export default function PartidosPage() {
  return <Suspense fallback={<div className="empty-state">Cargando partidos…</div>}><PartidosContent /></Suspense>;
}
