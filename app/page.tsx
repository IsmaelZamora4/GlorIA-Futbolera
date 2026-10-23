"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { competitions, type HistoricalAnalysis, type MarketKey, type Match } from "../data/demo-matches";
import { AppSidebar } from "../components/AppSidebar";

type IconName = "home" | "matches" | "trophy" | "book" | "database" | "settings" | "search" | "calendar" | "arrow" | "globe" | "ball" | "trend" | "corner" | "target";

const markets: { key: MarketKey; label: string; shortLabel: string }[] = [
  { key: "winner", label: "Ganador", shortLabel: "1X2" },
  { key: "goals", label: "Goles totales", shortLabel: "Goles" },
  { key: "btts", label: "Ambos anotan", shortLabel: "BTTS" },
  { key: "corners", label: "Córneres", shortLabel: "Córneres" },
  { key: "shots", label: "Tiros a puerta", shortLabel: "Tiros" },
];

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
  "Serie A de Italia": "SA", "LaLiga de España": "PD", "Ligue 1 de Francia": "FL1", "Bundesliga de Alemania": "BL1", "Premier League": "PL", "Champions League": "CL",
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

const inFlightFixtureRequests = new Set<string>();
const fixtureCachePrefix = "gloria-home-fixtures:v1:";
const requestDelayMs = 1_100;

type FootballDataFixture = {
  id: number; utcDate: string; status: string; venue?: string | null;
  homeTeam: { id: number; name: string; crest?: string | null };
  awayTeam: { id: number; name: string; crest?: string | null };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
  historicalAnalysis?: HistoricalAnalysis | null;
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
  idHomeTeam?: string | null;
  idAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  strVenue?: string | null;
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
  const pending = { label: "Sin dato", confidence: 0, note: "Fixture real cargado; el análisis aún no está disponible." };
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
    venue: fixture.venue || "Estadio por confirmar", status: finished ? "Finalizado" : "En análisis",
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

function toSportsDbMatch(event: SportsDbEvent, competition: string): Match {
  const date = event.dateEvent ?? new Date().toISOString().slice(0, 10);
  const kickoff = event.strTime?.slice(0, 5) || "Hora por confirmar";
  const homeScore = event.intHomeScore != null ? Number(event.intHomeScore) : NaN;
  const awayScore = event.intAwayScore != null ? Number(event.intAwayScore) : NaN;
  const finished = /finished|ended|finalizado/i.test(event.strStatus ?? "") || (Number.isFinite(homeScore) && Number.isFinite(awayScore));
  const pending = { label: "Sin dato", confidence: 0, note: "Partido real cargado; no hay un modelo disponible para este encuentro." };
  return {
    id: `sportsdb-${event.idEvent}`,
    competition,
    shortCompetition: competitionLabels[competition],
    date,
    kickoff,
    home: event.strHomeTeam,
    away: event.strAwayTeam,
    homeTeamId: Number(event.idHomeTeam) || 0,
    awayTeamId: Number(event.idAwayTeam) || 0,
    homeCode: event.strHomeTeam.slice(0, 3).toUpperCase(),
    awayCode: event.strAwayTeam.slice(0, 3).toUpperCase(),
    homeLogo: event.strHomeTeamBadge || "/team-placeholder.svg",
    awayLogo: event.strAwayTeamBadge || "/team-placeholder.svg",
    venue: event.strVenue || "Estadio por confirmar",
    status: finished ? "Finalizado" : "En análisis",
    score: finished && Number.isFinite(homeScore) && Number.isFinite(awayScore) ? [homeScore, awayScore] : undefined,
    probabilities: { home: 0, draw: 0, away: 0 },
    metrics: { winner: pending, corners: pending, btts: pending, goals: pending, shots: pending },
    stats: [{ label: "Análisis", home: "No disponible", away: "No disponible", available: false }],
    dataSource: "fixture",
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
  return <Image className="competition-mark" src={logo} alt="" width={size} height={size} unoptimized />;
}

function Sidebar({ active }: { active: string }) {
  return <AppSidebar active={active} />;
}

function MatchRow({ match, selected, onSelect }: { match: Match; selected: boolean; onSelect: () => void }) {
  return <button onClick={onSelect} className={`match-row ${selected ? "selected" : ""}`}><div className="match-row-top"><span className="match-competition"><CompetitionMark competition={match.competition} /><span>{match.shortCompetition}</span></span><span className={match.status === "Finalizado" ? "status-finished" : "status-upcoming"}>{match.status}</span></div><div className="match-teams"><div className="team-line"><Image className="club-mark" src={match.homeLogo} alt={`Escudo de ${match.home}`} width={22} height={22} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><span>{match.home}</span></div><div className="match-time">{match.score ? `${match.score[0]} — ${match.score[1]}` : match.kickoff}</div><div className="team-line"><Image className="club-mark away" src={match.awayLogo} alt={`Escudo de ${match.away}`} width={22} height={22} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><span>{match.away}</span></div></div><div className="match-row-foot"><span>{match.date}</span><span>{match.venue}</span><Icon name="arrow" size={14} /></div></button>;
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

function ProbabilityPanel({ match }: { match: Match }) {
  const values = [["1", match.home, match.probabilities.home], ["X", "Empate", match.probabilities.draw], ["2", match.away, match.probabilities.away]];
  return <div className="subpanel probability-panel"><div className="subpanel-title">Probabilidad de resultado <span className="info-dot">i</span></div><div className="space-y-3">{values.map(([key, label, value]) => <div key={key} className="prob-row"><span className="prob-label"><b>{key}</b>{label}</span><div className="prob-track"><div className="prob-fill" style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>)}</div></div>;
}

function MarketCard({ label, value, confidence, icon, detail }: { label: string; value: string; confidence: number; icon: IconName; detail: string }) {
  return <div className="market-card"><div className="market-card-label"><Icon name={icon} size={14} /><span>{label}</span><span className="market-arrow">↗</span></div><div className="market-card-value">{value}</div><div className="market-meter"><span style={{ width: `${confidence}%` }} /></div><div className="market-card-foot"><span>{detail}</span><b>{confidence}%</b></div></div>;
}

function ModelTransparency({ analysis }: { analysis: HistoricalAnalysis | undefined }) {
  if (!analysis) return <div className="model-transparency empty"><span>Sin modelo estadístico para este fixture.</span></div>;
  const sample = Math.min(analysis.homeSample, analysis.awaySample);
  const currentSample = Math.min(analysis.currentSeasonHomeSample, analysis.currentSeasonAwaySample);
  const confidence = analysis.usingLeagueBaseline ? "Limitada" : sample >= 30 ? "Sólida" : "Moderada";
  const warnings = [
    analysis.usingLeagueBaseline ? "Uno o ambos equipos no tienen historial suficiente; se aplicó la media de la liga." : null,
    analysis.teamIdentity?.home === "unmatched" || analysis.teamIdentity?.away === "unmatched" ? "No se pudo conciliar exactamente el nombre de uno de los equipos." : null,
    analysis.teamIdentity?.home === "alias" || analysis.teamIdentity?.away === "alias" ? "Se conciliaron variantes de nombre de equipo con el historial local." : null,
  ].filter(Boolean);
  return <aside className="model-transparency" aria-label="Calidad del modelo"><div className="model-transparency-head"><div><span className="eyebrow">Calidad del análisis</span><strong>Confianza {confidence}</strong></div><span className={`confidence-badge ${confidence.toLowerCase()}`}>{confidence}</span></div><div className="model-stat-grid"><div><span>Historial local</span><b>{analysis.homeSample}</b><small>partidos del local</small></div><div><span>Historial visita</span><b>{analysis.awaySample}</b><small>partidos del visitante</small></div><div><span>Temporada actual</span><b>{currentSample}</b><small>partidos por condición</small></div><div><span>Probabilidades</span><b>{analysis.calibration?.applied ? "Ajustadas" : "Base"}</b><small>{analysis.calibration?.applied ? "calibradas con backtest" : "sin calibración"}</small></div></div>{warnings.length > 0 ? <div className="model-warnings">{warnings.map((warning) => <p key={warning}>⚠ {warning}</p>)}</div> : <p className="model-method">Estimación local con cinco temporadas históricas, partidos actuales anteriores al fixture y calibración temporal.</p>}</aside>;
}

function AnalysisPanel({ match, activeMarket, onMarket }: { match: Match; activeMarket: MarketKey; onMarket: (market: MarketKey) => void }) {
  const result = match.metrics[activeMarket];
  const analysis = match.historicalAnalysis;
  const sourceLabel = analysis ? "Fixture real · modelo histórico local" : match.dataSource === "fixture" ? "Fixture real" : "Demo local";
  return <section id="datos" className="analysis-panel">
    <div className="analysis-header"><div><div className="competition-line"><span className="mini-crest"><Icon name="ball" size={14} /></span>{match.competition} · {sourceLabel}</div><h2>{match.home} <em>vs</em> {match.away}</h2><div className="match-meta"><span>{match.date}</span><span>·</span><span>{match.kickoff}</span><span>·</span><span>{match.venue}</span></div></div></div>
    <div className="analysis-main"><div className="versus-card"><div className="versus-team"><Image className="large-crest" src={match.homeLogo} alt={`Escudo de ${match.home}`} width={46} height={46} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><strong>{match.home}</strong><small>Local</small></div><div className="versus-mark">VS</div><div className="versus-team"><Image className="large-crest away" src={match.awayLogo} alt={`Escudo de ${match.away}`} width={46} height={46} onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} /><strong>{match.away}</strong><small>Visitante</small></div></div><ProbabilityPanel match={match} /></div>
    <div className="market-grid"><MarketCard label="Goles totales" value={match.metrics.goals.label} confidence={match.metrics.goals.confidence} icon="trend" detail={analysis ? `Media ${analysis.expectedGoals.total.toFixed(1)} · +2.5 ${analysis.markets.goals.over25}%` : "Sin dato real"} /><MarketCard label="Ambos anotan" value={match.metrics.btts.label} confidence={match.metrics.btts.confidence} icon="target" detail={analysis ? `Sí ${analysis.markets.btts.yes}% · No ${analysis.markets.btts.no}%` : "Sin dato real"} /><MarketCard label="Córneres totales" value={match.metrics.corners.label} confidence={match.metrics.corners.confidence} icon="corner" detail={analysis ? `Media ${analysis.expectedCorners.total.toFixed(1)} · +8.5 ${analysis.markets.corners.over85}%` : "Sin dato real"} /><MarketCard label={`Tiros a puerta (${match.homeCode})`} value={match.metrics.shots.label} confidence={match.metrics.shots.confidence} icon="target" detail={analysis ? `+2.5: ${analysis.markets.shotsOnTarget.homeOver25}%` : "Sin dato real"} /><MarketCard label={`Tiros a puerta (${match.awayCode})`} value={analysis ? analysis.expectedShotsOnTarget.away.toFixed(1) : "Sin dato"} confidence={analysis ? analysis.markets.shotsOnTarget.awayOver25 : 0} icon="target" detail={analysis ? `+2.5: ${analysis.markets.shotsOnTarget.awayOver25}%` : "Sin dato real"} /></div>
    <ModelTransparency analysis={analysis} />
    <div className="analysis-tabs">{markets.map((market) => <button key={market.key} onClick={() => onMarket(market.key)} className={activeMarket === market.key ? "active" : ""}>{market.label}</button>)}</div>
    <div id="metodologia" className="analysis-detail"><div><div className="eyebrow">Resumen del mercado</div><h3>{result.label}</h3><p>{result.note}</p></div><div className="available-note"><span className="available-dot" />{analysis ? "Modelo histórico local" : "Fixture real"}<br /><small>{analysis ? analysis.usingLeagueBaseline ? "Muestra insuficiente de un club · media de liga" : `5 temporadas + ${analysis.currentSeasonHomeSample}/${analysis.currentSeasonAwaySample} partidos actuales` : "No hay predicción ni estadísticas avanzadas disponibles para esta fuente."}</small></div></div>
  </section>;
}

export default function Home() {
  const [competition, setCompetition] = useState("Premier League");
  const [team, setTeam] = useState("");
  const [date, setDate] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [activeMarket, setActiveMarket] = useState<MarketKey>("winner");
  const [realDataState, setRealDataState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [realDataMessage, setRealDataMessage] = useState("");
  const [fixtureCache, setFixtureCache] = useState<Record<string, FixtureCacheEntry>>({});
  const fixtureCacheRef = useRef(fixtureCache);
  const [cacheReferenceTime, setCacheReferenceTime] = useState(0);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().slice(0, 10);
  const requestedDate = competition === "Todas" ? today : date || today;
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
  const matchesByDay = useMemo(() => {
    const grouped = new Map<string, Match[]>();
    for (const match of filtered) {
      const matches = grouped.get(match.date) ?? [];
      matches.push(match);
      grouped.set(match.date, matches);
    }
    return [...grouped.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [filtered]);
  const toggleDay = (matchDate: string) => {
    setCollapsedDays((current) => {
      const next = new Set(current);
      if (next.has(matchDate)) next.delete(matchDate);
      else next.add(matchDate);
      return next;
    });
  };
  const agendaDates = getAgendaDates(requestedDate);
  const selected = filtered.find((match) => match.id === selectedId) || filtered[0];
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
      const endpoint = footballDataCompetitions[requestedCompetition]
        ? `/api/football-data/fixtures?date=${requestedDate}&competition=${encodeURIComponent(requestedCompetition)}`
        : `/api/sportsdb/fixtures?date=${requestedDate}&league=${encodeURIComponent(requestedCompetition)}`;
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(`${requestedCompetition}: ${payload.error || "fuente no disponible"}`);
        const rawMatches = footballDataCompetitions[requestedCompetition]
          ? (payload.fixtures as FootballDataFixture[]).map((fixture) => toAgendaMatch(fixture, requestedCompetition))
          : (payload.events as SportsDbEvent[]).map((event) => toSportsDbMatch(event, requestedCompetition));
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
    setRealDataMessage(`${allMatches.length} partidos reales del ${requestedDate}${cachedMatches.length ? " · reutilizando caché" : ""}${failures.length ? ` · ${failures.length} fuente(s) sin respuesta` : ""}.`);
    } finally {
      inFlightFixtureRequests.delete(requestKey);
    }
  }, [competition, requestedDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRealData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [competition, loadRealData, requestedDate]);

  return <div className="app-shell"><Sidebar active="Inicio" /><main className="main-area"><header id="configuracion" className="topbar"><div className="mobile-logo"><Logo /></div><label className="search-box"><Icon name="search" size={17} /><input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Buscar equipo, liga o partido..." /><kbd>⌘ K</kbd></label><div className="top-actions"><label className="date-picker"><Icon name="calendar" size={15} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><span>{date ? date : "Hoy"}</span></label><span className="demo-status"><i /> Datos reales</span></div></header><div className="content"><section id="inicio" className="hero"><div className="hero-image" /><div className="hero-shade" /><div className="hero-copy"><div className="eyebrow light">GlorIA Futbolera</div><h1>Analiza.<br />Comprende.<br /><span>Decide mejor.</span></h1><p>Estadísticas, contexto y probabilidades para entender el fútbol de una manera más clara.</p></div><div className="hero-note"><span><Icon name="database" size={14} /> Datos en directo</span><p>Los partidos se consultan desde fuentes externas.</p></div></section><div id="competiciones" className="competition-strip"><div className="competition-scroll">{competitions.map((item, index) => <button key={item} onClick={() => { setCompetition(item); if (item === "Todas") setDate(today); }} className={competition === item ? "active" : ""}><span className="competition-icon">{index === 0 ? <Icon name="globe" size={15} /> : <Icon name="ball" size={14} />}</span>{competitionLabels[item]}</button>)}</div><div className="real-data-controls"><button className="load-real-button" onClick={loadRealData} disabled={realDataState === "loading"}>{realDataState === "loading" ? "Consultando…" : "Actualizar datos"}</button><span className={`real-data-message ${realDataState}`}>{realDataMessage || "Consultando fuente real…"}</span></div></div><section className="fixtures-intro"><div><div className="eyebrow">Agenda en tiempo real</div><h1>Partidos</h1><p>Consulta los partidos por día y competición. Selecciona un encuentro para ver su lectura estadística.</p></div><span className="fixtures-source"><i /> Fuente real<br /><small>Actualizada automáticamente</small></span></section><nav className="agenda-date-nav" aria-label="Seleccionar día">{agendaDates.map((agendaDate) => { const value = agendaDate.toISOString().slice(0, 10); const isToday = value === new Date().toISOString().slice(0, 10); return <button key={value} className={requestedDate === value ? "active" : ""} onClick={() => setDate(value)}><b>{isToday ? "Hoy" : new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(agendaDate).replace(".", "")}</b><small>{formatShortDate(agendaDate)}</small></button>; })}</nav><div className="dashboard-grid"><aside id="partidos" className="fixtures-column"><div className="section-heading"><div><div className="eyebrow">Agenda</div><h2>Próximos partidos</h2></div><span>{filtered.length} visibles</span></div><div className="fixture-list">{filtered.length ? matchesByDay.map(([matchDate, dayMatches]) => { const collapsed = collapsedDays.has(matchDate); return <section className="agenda-day" key={matchDate}><button className="agenda-day-toggle" onClick={() => toggleDay(matchDate)} aria-expanded={!collapsed}><h3><span><Icon name="calendar" size={13} />{formatAgendaDate(matchDate)}</span><b>{dayMatches.length} {dayMatches.length === 1 ? "partido" : "partidos"}</b><strong aria-hidden="true">{collapsed ? "+" : "−"}</strong></h3></button>{!collapsed && <div className="agenda-day-matches">{dayMatches.map((match) => <MatchRow key={match.id} match={match} selected={selected?.id === match.id} onSelect={() => setSelectedId(match.id)} />)}</div>}</section>; }) : <div className="empty-state">{realDataState === "error" ? realDataMessage : "Consultando partidos reales…"}</div>}</div></aside><div className="analysis-column"><div className="section-heading"><div><div className="eyebrow">Análisis seleccionado</div><h2>Lectura de partido</h2></div><span className="desktop-only">Actualización automática · fuente real</span></div>{selected ? <AnalysisPanel match={selected} activeMarket={activeMarket} onMarket={setActiveMarket} /> : <div className="empty-state">Selecciona una competición con partidos disponibles para mostrar su análisis.</div>}</div></div></div><footer>GlorIA Futbolera <span>·</span> Datos consultados desde fuentes reales</footer></main></div>;
}
