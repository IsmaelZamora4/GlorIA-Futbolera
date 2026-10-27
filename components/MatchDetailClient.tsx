"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type {
  HeadToHeadSummary,
  LocalMatchDetailContext,
  LocalStanding,
  MatchRecentForms,
  MatchSeasonStatistics,
  VenueSeasonRecord,
} from "../lib/match-detail";
import type { LocalLeagueAnalysis } from "../lib/league-analysis";
import { getKnownTeamCrest } from "../data/team-crests";
import { ModelConfidence } from "./ModelConfidence";
import { FormTimeline } from "./FormTimeline";
import type { VenuePhoto } from "../lib/venue-photos";

type DetailTab = "resumen" | "forma" | "estadisticas" | "posiciones" | "h2h";
type LocalVote = "home" | "draw" | "away";

type MatchDetailClientProps = {
  context: Pick<LocalMatchDetailContext, "fixture" | "coverage">;
  analysis: LocalLeagueAnalysis | null;
  forms: MatchRecentForms;
  statistics: MatchSeasonStatistics;
  standings: { rows: LocalStanding[]; dataThrough: string | null; tieBreakRule: string };
  h2h: HeadToHeadSummary;
  homeCrest?: string;
  awayCrest?: string;
  kickoff: string;
  venue: string;
  venueCity?: string;
  venuePhoto?: VenuePhoto | null;
  transparency: {
    home: { historicalMatches: number; currentMatches: number };
    away: { historicalMatches: number; currentMatches: number };
  };
};

const tabs: Array<[DetailTab, string]> = [
  ["resumen", "Resumen"],
  ["forma", "Forma"],
  ["estadisticas", "Estadísticas"],
  ["posiciones", "Posiciones"],
  ["h2h", "H2H"],
];

const competitionLogos: Record<string, string> = {
  "Premier League": "/competitions/premier-league.svg",
  "Serie A de Italia": "/competitions/serie-a.svg",
  "LaLiga de España": "/competitions/laliga.svg",
  "Ligue 1 de Francia": "/competitions/ligue-1.svg",
  "Bundesliga de Alemania": "/competitions/bundesliga.svg",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function metric(value: { average: number } | null, suffix = "") {
  return value ? `${value.average.toFixed(1)}${suffix}` : "Sin dato";
}

function FormBadge({ outcome }: { outcome: "W" | "D" | "L" }) {
  return <span className={`detail-form-badge ${outcome.toLowerCase()}`}>{outcome === "W" ? "G" : outcome === "D" ? "E" : "P"}</span>;
}

function TeamFormStrip({ form }: { form: MatchRecentForms["home"] }) {
  const recentResults = form.matches.slice(0, 5);
  if (!recentResults.length) return <small className="detail-team-form-empty">Sin forma reciente</small>;

  const readableResults = recentResults.map((match) => match.outcome === "W" ? "ganado" : match.outcome === "D" ? "empatado" : "perdido").join(", ");
  return <span className="detail-team-form" aria-label={`Últimos ${recentResults.length} resultados: ${readableResults}`}>
    {recentResults.map((match) => <FormBadge key={match.id} outcome={match.outcome} />)}
  </span>;
}

function ProbabilityBar({ home, draw, away, homeTeam, awayTeam }: { home: number; draw: number; away: number; homeTeam: string; awayTeam: string }) {
  return <div className="detail-probability-bar" role="img" aria-label={`Probabilidades: ${homeTeam} ${home}%, empate ${draw}%, ${awayTeam} ${away}%`}>
    <span className="home" style={{ width: `${home}%` }}><b>{home}%</b></span>
    <span className="draw" style={{ width: `${draw}%` }}><b>{draw}%</b></span>
    <span className="away" style={{ width: `${away}%` }}><b>{away}%</b></span>
  </div>;
}

function TeamMark({ team, side, crest, compact = false }: { team: string; side?: "home" | "away"; crest?: string; compact?: boolean }) {
  const source = crest ?? getKnownTeamCrest(team);
  const className = `detail-team-mark${side ? ` ${side}` : ""}${compact ? " compact" : ""}`;
  return <span className={className} title={`Escudo de ${team}`}>
    {source ? <Image src={source} alt={`Escudo de ${team}`} width={compact ? 24 : 58} height={compact ? 24 : 58} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <em>{initials(team)}</em>}
  </span>;
}

function FormPanel({ title, crest, form, fixtureDate }: { title: string; crest?: string; form: MatchRecentForms["home"]; fixtureDate: string }) {
  return <section className="detail-section-card form-panel gloria-reveal interactive-card">
    <header><div><span className="detail-kicker">Últimos resultados</span><h3><TeamMark team={title} crest={crest} compact />{title}</h3></div><div className="detail-form-summary">{form.record.points} <small>pts / {form.record.played}</small></div></header>
    <FormTimeline matches={form.matches} fixtureDate={fixtureDate} />
    <footer>{form.coverage === "current-only" ? "Temporada actual" : "Temporada actual + historial"} · {form.record.goalsFor} GF · {form.record.goalsAgainst} GC</footer>
  </section>;
}

function ComparisonRow({ label, home, away }: { label: string; home: string | number; away: string | number }) {
  return <div className="detail-comparison-row"><strong>{home}</strong><span>{label}</span><strong>{away}</strong></div>;
}

function StandingsTable({ rows }: { rows: LocalStanding[] }) {
  const zoneLabels: Array<[LocalStanding["zone"], string]> = [
    ["champions", "Champions"],
    ["europa", "Europa"],
    ["conference", "Conference"],
    ["relegation", "Descenso"],
  ];
  const visibleZones = zoneLabels.filter(([zone]) => rows.some((row) => row.zone === zone));
  return <><div className="detail-table-legend" aria-label="Leyenda de zonas de clasificación">{visibleZones.map(([zone, label]) => <span key={zone}><i className={`zone-key zone-key-${zone}`} />{label}</span>)}<span><i className="fixture-key" />Este partido</span></div><div className="detail-table-wrap"><table className="detail-standings-table"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Forma reciente</th><th>Pts</th></tr></thead><tbody>{rows.map((row) => <tr key={row.team} className={`${row.isFixtureTeam ? "fixture-team" : ""} zone-${row.zone}`}><td>{row.position}</td><td><span className="detail-table-team"><TeamMark team={row.team} compact />{row.team}{row.isFixtureTeam && <em>Este partido</em>}</span></td><td>{row.played}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><span className="detail-table-form" aria-label={`Forma reciente: ${row.form.map((outcome) => outcome === "W" ? "ganado" : outcome === "D" ? "empate" : "perdido").join(", ")}`}>{row.form.map((outcome, index) => <FormBadge key={`${row.team}-${index}`} outcome={outcome} />)}</span></td><td><b>{row.points}</b></td></tr>)}</tbody></table></div></>;
}

function StandingDistance({ home, away }: { home?: LocalStanding; away?: LocalStanding }) {
  if (!home || !away) return <p className="detail-rank-distance">Distancia al rival: sin datos suficientes.</p>;
  const pointDistance = Math.abs(home.points - away.points);
  const positionDistance = Math.abs(home.position - away.position);
  return <p className="detail-rank-distance"><span>Distancia al rival</span><strong>{pointDistance} {pointDistance === 1 ? "pto" : "pts"}</strong><small>{positionDistance} {positionDistance === 1 ? "puesto" : "puestos"} de diferencia</small></p>;
}

function VenueMatchList({ record }: { record: VenueSeasonRecord }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMatches = expanded ? record.matches : record.matches.slice(0, 5);
  const venueLabel = record.venue === "home" ? "en casa" : "fuera de casa";
  if (!record.played) return <p>Sin encuentros terminados {venueLabel} antes del partido.</p>;

  return <div className="venue-match-list">
    <div className="venue-match-list-heading"><span>Partidos {venueLabel}</span><small>{record.played} {record.played === 1 ? "partido" : "partidos"}</small></div>
    <ol>{visibleMatches.map((match) => <li key={match.id}>
      <time dateTime={match.date}>{formatDate(match.date)}</time>
      <span>{record.venue === "home" ? "vs" : "@"}</span>
      <TeamMark team={match.opponent} compact />
      <strong>{match.opponent}</strong>
      <b>{match.goalsFor}–{match.goalsAgainst}</b>
      <FormBadge outcome={match.outcome} />
    </li>)}</ol>
    {record.played > 5 && <button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Ver menos" : `Ver ${record.played - 5} partidos más`}</button>}
  </div>;
}

function VenuePerformance({ home, away, homeCrest, awayCrest }: { home: VenueSeasonRecord; away: VenueSeasonRecord; homeCrest?: string; awayCrest?: string }) {
  const cards = [
    { record: home, label: "Como local", team: home.team, crest: homeCrest },
    { record: away, label: "Como visitante", team: away.team, crest: awayCrest },
  ];
  return <section className="detail-section-card detail-venue-performance">
    <header><div><span className="detail-kicker">Rendimiento según condición</span><h2>Local vs. visitante</h2></div><small>Temporada actual · antes del partido</small></header>
    <div className="venue-performance-grid">{cards.map(({ record, label, team, crest }) => <article key={label}>
      <header><span><TeamMark team={team} crest={crest} compact /><strong>{team}</strong><small>{label}</small></span><b>{record.played ? `${record.points} pts` : "—"}</b></header>
      {record.played ? <><dl><div><dt>PJ</dt><dd>{record.played}</dd></div><div><dt>G/E/P</dt><dd>{record.wins}/{record.draws}/{record.losses}</dd></div><div><dt>GF–GC</dt><dd>{record.goalsFor}–{record.goalsAgainst}</dd></div><div><dt>Pts/PJ</dt><dd>{record.pointsPerGame?.toFixed(2) ?? "—"}</dd></div></dl><VenueMatchList record={record} /></> : <p>Sin encuentros terminados en esta condición antes del partido.</p>}
    </article>)}</div>
  </section>;
}

function HeadToHeadTimeline({ h2h, home, away, homeCrest, awayCrest }: { h2h: HeadToHeadSummary; home: string; away: string; homeCrest?: string; awayCrest?: string }) {
  const editorialNote = h2h.recentMatches.length === 0
    ? "No hay enfrentamientos directos suficientes en los datasets locales para dibujar una tendencia."
    : h2h.recentMatches.length < 3
      ? "Hay pocos antecedentes directos; la historia entre ambos equipos todavía ofrece un contexto limitado."
      : null;

  return <section className="detail-section-card detail-h2h gloria-reveal interactive-card">
    <header><span className="detail-kicker">Cronología local</span><h2>Historial cara a cara</h2><p>{h2h.totalMatches} enfrentamientos de liga registrados · {h2h.homeGoals}–{h2h.awayGoals} en goles totales.</p></header>
    <div className="detail-h2h-numbers" aria-label="Balance histórico"><div><b>{h2h.homeWins}</b><span><TeamMark team={home} crest={homeCrest} compact />Victorias {home}</span></div><div><b>{h2h.draws}</b><span>Empates</span></div><div><b>{h2h.awayWins}</b><span><TeamMark team={away} crest={awayCrest} compact />Victorias {away}</span></div></div>
    {editorialNote && <p className="detail-h2h-note">{editorialNote}</p>}
    {h2h.recentMatches.length > 0 && <ol className="detail-h2h-timeline" aria-label="Últimos enfrentamientos directos">{h2h.recentMatches.map((match) => <li key={match.id}><time dateTime={match.date}>{match.date.slice(0, 4)}</time><span className="detail-h2h-dot" aria-hidden="true" /><div className="detail-h2h-match"><div><span><TeamMark team={match.homeTeam} crest={match.homeTeam === home ? homeCrest : awayCrest} compact />{match.homeTeam}</span><strong>{match.homeGoals}</strong></div><div><span><TeamMark team={match.awayTeam} crest={match.awayTeam === away ? awayCrest : homeCrest} compact />{match.awayTeam}</span><strong>{match.awayGoals}</strong></div></div></li>)}</ol>}
  </section>;
}

function LocalPredictionPoll({ home, away, homeCrest, awayCrest, storageKey }: { home: string; away: string; homeCrest?: string; awayCrest?: string; storageKey: string }) {
  const [vote, setVote] = useState<LocalVote | null>(null);
  const options: Array<{ id: LocalVote; label: string; short: string; crest?: string }> = [
    { id: "home", label: home, short: "1", crest: homeCrest },
    { id: "draw", label: "Empate", short: "X" },
    { id: "away", label: away, short: "2", crest: awayCrest },
  ];

  useEffect(() => {
    try {
      const storedVote = window.localStorage.getItem(storageKey);
      if (storedVote === "home" || storedVote === "draw" || storedVote === "away") {
        const timer = window.setTimeout(() => setVote(storedVote), 0);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // La encuesta sigue disponible mientras el navegador permita guardar la elección.
    }
  }, [storageKey]);

  function selectVote(nextVote: LocalVote) {
    setVote(nextVote);
    try {
      window.localStorage.setItem(storageKey, nextVote);
    } catch {
      // No enviamos ni persistimos el voto fuera del navegador.
    }
  }

  const selectedLabel = options.find((option) => option.id === vote)?.label;
  return <section className="detail-local-poll" aria-labelledby="local-poll-title">
    <div><span className="detail-kicker">Encuesta local</span><h2 id="local-poll-title">¿Quién crees que ganará?</h2><p>Tu elección se guarda solo en este navegador.</p></div>
    <div className="detail-vote-options" role="group" aria-label="Elige el resultado que esperas">
      {options.map((option) => <button key={option.id} type="button" className={vote === option.id ? "active" : ""} aria-pressed={vote === option.id} onClick={() => selectVote(option.id)}><b>{option.short}</b>{option.id === "draw" ? <i className="detail-draw-mark">X</i> : <TeamMark team={option.label} crest={option.crest} compact />}<span>{option.label}</span></button>)}
    </div>
    <small>{selectedLabel ? `Tu voto: ${selectedLabel}. Puedes cambiarlo cuando quieras.` : "Aún no has elegido un resultado."}</small>
  </section>;
}

function VenueCard({ stadium, city, photo }: { stadium: string; city?: string; photo?: VenuePhoto | null }) {
  return <aside className="detail-venue-card" aria-label={`Estadio: ${stadium}`}>
    <header><span className="detail-kicker">Estadio</span>{city && <small>⌖ {city}</small>}</header>
    <h2>{stadium}</h2>
    {photo ? <figure>
      <div className="detail-venue-photo"><Image src={photo.imageUrl} alt={`Vista del ${stadium}`} fill sizes="(max-width: 820px) calc(100vw - 56px), 460px" unoptimized={photo.imageUrl.startsWith("/stadiums/")} /></div>
      <figcaption>{photo.sourceUrl ? <>Foto: <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Wikipedia</a></> : "Imagen local"}</figcaption>
    </figure> : <div className="detail-venue-no-photo"><span aria-hidden="true">⌂</span><p>Fotografía del recinto no disponible todavía.</p></div>}
  </aside>;
}

export function MatchDetailClient({ context, analysis, forms, statistics, standings, h2h, kickoff, venue, venueCity, venuePhoto, transparency, homeCrest, awayCrest }: MatchDetailClientProps) {
  const [tab, setTab] = useState<DetailTab>("resumen");
  const home = context.fixture.home.canonicalName;
  const away = context.fixture.away.canonicalName;
  const homeStanding = standings.rows.find((row) => row.team === home);
  const awayStanding = standings.rows.find((row) => row.team === away);
  const logo = competitionLogos[context.fixture.competition] ?? "/competition-placeholder.svg";
  const voteStorageKey = `gloria:match-vote:v1:${encodeURIComponent([context.fixture.competition, context.fixture.fixtureDate, home, away].join("|"))}`;
  const lowHistoryTeams = [
    { team: home, ...transparency.home },
    { team: away, ...transparency.away },
  ].filter((team) => team.historicalMatches < 10);
  const missingStatistics = [
    statistics.home.expectedGoalsFor == null || statistics.away.expectedGoalsFor == null ? "xG" : null,
    statistics.home.shotsFor == null || statistics.away.shotsFor == null ? "tiros" : null,
    statistics.home.shotsOnTargetFor == null || statistics.away.shotsOnTargetFor == null ? "tiros a puerta" : null,
    statistics.home.cornersFor == null || statistics.away.cornersFor == null ? "córneres" : null,
    statistics.home.yellowCards == null || statistics.away.yellowCards == null ? "tarjetas" : null,
  ].filter((metricName): metricName is string => metricName != null);
  const winner = analysis ? (analysis.probabilities.home > analysis.probabilities.away ? home : analysis.probabilities.away > analysis.probabilities.home ? away : null) : null;
  const winnerCrest = winner === home ? homeCrest : winner === away ? awayCrest : undefined;

  return <main className="match-detail-page">
    <section className="match-detail-hero">
      <div className="detail-competition"><Image src={logo} alt="" width={26} height={26} unoptimized /><span>{context.fixture.competition}</span><i /> <span>Lectura prepartido</span></div>
      <div className="match-detail-scoreboard">
        <div className="match-detail-team home"><TeamMark team={home} side="home" crest={homeCrest} /><strong>{home}</strong><small>Local</small><TeamFormStrip form={forms.home} /></div>
        <div className="match-detail-center"><time>{kickoff}</time><b>VS</b><span>{formatDate(context.fixture.fixtureDate)}</span></div>
        <div className="match-detail-team away"><TeamMark team={away} side="away" crest={awayCrest} /><strong>{away}</strong><small>Visitante</small><TeamFormStrip form={forms.away} /></div>
      </div>
      <div className="match-detail-meta"><span>◷ {formatDate(context.fixture.fixtureDate)} · {kickoff}</span><span>⌖ {venue}</span><span>⌁ Datos hasta {context.coverage.preMatchDataThrough ? formatDate(context.coverage.preMatchDataThrough) : "sin registros"}</span></div>
      <div className="detail-hero-support">
        <div className="detail-hero-analysis">
          {analysis ? <div className="detail-probability-panel"><div className="detail-probability-heading"><span>Probabilidad 1X2</span><small>Estimación del modelo</small></div><ProbabilityBar home={analysis.probabilities.home} draw={analysis.probabilities.draw} away={analysis.probabilities.away} homeTeam={home} awayTeam={away} /><div className="detail-probabilities"><span><b>1</b><TeamMark team={home} crest={homeCrest} compact />{home}<strong>{analysis.probabilities.home}%</strong></span><span><b>X</b><i className="detail-draw-mark">X</i>Empate<strong>{analysis.probabilities.draw}%</strong></span><span><b>2</b><TeamMark team={away} crest={awayCrest} compact />{away}<strong>{analysis.probabilities.away}%</strong></span></div></div> : <p className="detail-data-note">El fixture está disponible, pero no hay muestra local suficiente para generar el pronóstico.</p>}
          <ModelConfidence homeHistorical={transparency.home.historicalMatches} awayHistorical={transparency.away.historicalMatches} homeCurrent={transparency.home.currentMatches} awayCurrent={transparency.away.currentMatches} />
          <LocalPredictionPoll home={home} away={away} homeCrest={homeCrest} awayCrest={awayCrest} storageKey={voteStorageKey} />
        </div>
        <VenueCard stadium={venue} city={venueCity} photo={venuePhoto} />
      </div>
      <aside className="detail-transparency" aria-label="Cobertura y límites de los datos">
        <span>Datos locales</span>
        <p>El análisis prepartido incluye resultados hasta {context.coverage.preMatchDataThrough ? formatDate(context.coverage.preMatchDataThrough) : "la última actualización disponible"}. El CSV actual llega hasta {context.coverage.currentDatasetThrough ? formatDate(context.coverage.currentDatasetThrough) : "sin fecha disponible"}.</p>
        {lowHistoryTeams.length > 0 && <p className="is-warning">{lowHistoryTeams.map((team) => team.historicalMatches === 0 ? `${team.team}: equipo nuevo o sin historial local (${team.currentMatches} partido${team.currentMatches === 1 ? "" : "s"} actual${team.currentMatches === 1 ? "" : "es"})` : `${team.team}: ${team.historicalMatches} partido${team.historicalMatches === 1 ? "" : "s"} histórico${team.historicalMatches === 1 ? "" : "s"}`).join(" · ")}. {analysis?.usingLeagueBaseline ? "El modelo usa también la media de la liga para evitar sobreconfianza." : "La muestra histórica es corta; interpreta el pronóstico con cautela."}</p>}
      </aside>
    </section>

    <nav className="detail-tabs" aria-label="Secciones del detalle del partido">{tabs.map(([id, label]) => <button key={id} className={`tab-motion ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>)}</nav>

    {tab === "resumen" && <div className="detail-content detail-overview">
      <section className="detail-section-card detail-reading"><div><span className="detail-kicker">Lectura del modelo</span><h2>{winner && <TeamMark team={winner} crest={winnerCrest} compact />}{winner ?? (analysis ? "Partido equilibrado" : "Sin predicción")}</h2><p>{analysis ? `Modelo local con cinco temporadas y datos actuales previos al partido. Muestra actual: ${analysis.currentSeasonHomeSample} partidos de local y ${analysis.currentSeasonAwaySample} de visita.` : "Actualiza el dataset para ampliar la muestra local."}</p></div><dl><div><dt>Goles esperados</dt><dd>{analysis ? analysis.expectedGoals.total.toFixed(2) : "—"}</dd></div><div><dt>Ambos anotan</dt><dd>{analysis ? `${analysis.bttsProbability}%` : "—"}</dd></div><div><dt>+2.5 goles</dt><dd>{analysis ? `${analysis.over25Probability}%` : "—"}</dd></div></dl></section>
      <div className="detail-overview-grid"><section className="detail-section-card"><span className="detail-kicker">Posición prepartido</span><div className="detail-rank-compare"><div><b>{homeStanding?.position ?? "—"}</b><span><TeamMark team={home} crest={homeCrest} compact />{home}</span><small>{homeStanding?.points ?? 0} pts</small></div><i>vs</i><div><b>{awayStanding?.position ?? "—"}</b><span><TeamMark team={away} crest={awayCrest} compact />{away}</span><small>{awayStanding?.points ?? 0} pts</small></div></div><StandingDistance home={homeStanding} away={awayStanding} /></section><section className="detail-section-card"><span className="detail-kicker">H2H en datasets locales</span><div className="detail-h2h-numbers"><div><b>{h2h.homeWins}</b><span><TeamMark team={home} crest={homeCrest} compact />{home}</span></div><div><b>{h2h.draws}</b><span>Empates</span></div><div><b>{h2h.awayWins}</b><span><TeamMark team={away} crest={awayCrest} compact />{away}</span></div></div></section></div>
      <VenuePerformance home={statistics.home.homeRecord} away={statistics.away.awayRecord} homeCrest={homeCrest} awayCrest={awayCrest} />
      <div className="detail-two-columns"><FormPanel title={home} crest={homeCrest} form={forms.home} fixtureDate={context.fixture.fixtureDate} /><FormPanel title={away} crest={awayCrest} form={forms.away} fixtureDate={context.fixture.fixtureDate} /></div>
    </div>}

    {tab === "forma" && <div className="detail-content detail-two-columns"><FormPanel title={home} crest={homeCrest} form={forms.home} fixtureDate={context.fixture.fixtureDate} /><FormPanel title={away} crest={awayCrest} form={forms.away} fixtureDate={context.fixture.fixtureDate} /></div>}

    {tab === "estadisticas" && <div className="detail-content"><section className="detail-section-card detail-statistics"><header><span className="detail-kicker">Temporada {statistics.home.season}</span><h2>Comparación estadística</h2><p>Solo encuentros de liga terminados antes de este partido.</p></header>{missingStatistics.length > 0 && <p className="detail-missing-data" role="status">Sin datos de {missingStatistics.join(", ")} para uno o ambos equipos en el CSV actual. Se muestra “Sin dato” en lugar de inventar una cifra.</p>}<div className="detail-team-headers"><span>{home}</span><span>{away}</span></div><div className="detail-comparison-list"><ComparisonRow label="Partidos" home={statistics.home.played} away={statistics.away.played} /><ComparisonRow label="Goles" home={statistics.home.goalsFor} away={statistics.away.goalsFor} /><ComparisonRow label="Goles por partido" home={statistics.home.goalsPerGame?.toFixed(2) ?? "Sin dato"} away={statistics.away.goalsPerGame?.toFixed(2) ?? "Sin dato"} /><ComparisonRow label="Porterías a cero" home={statistics.home.cleanSheets} away={statistics.away.cleanSheets} /><ComparisonRow label="xG por partido" home={metric(statistics.home.expectedGoalsFor)} away={metric(statistics.away.expectedGoalsFor)} /><ComparisonRow label="Tiros por partido" home={metric(statistics.home.shotsFor)} away={metric(statistics.away.shotsFor)} /><ComparisonRow label="Tiros a puerta" home={metric(statistics.home.shotsOnTargetFor)} away={metric(statistics.away.shotsOnTargetFor)} /><ComparisonRow label="Córneres" home={metric(statistics.home.cornersFor)} away={metric(statistics.away.cornersFor)} /><ComparisonRow label="Amarillas" home={metric(statistics.home.yellowCards)} away={metric(statistics.away.yellowCards)} /></div></section></div>}

    {tab === "posiciones" && <div className="detail-content"><section className="detail-section-card detail-standings"><header><div><span className="detail-kicker">Clasificación calculada localmente</span><h2>Posiciones</h2></div><small>Tabla prepartido: {standings.dataThrough ? formatDate(standings.dataThrough) : "sin resultados"}</small></header><p className="detail-table-coverage">La tabla usa el CSV de temporada actualizado hasta {context.coverage.currentDatasetThrough ? formatDate(context.coverage.currentDatasetThrough) : "sin fecha disponible"}; solo incorpora resultados anteriores al partido para evitar usar el futuro.</p><StandingsTable rows={standings.rows} /><footer>Desempate: {standings.tieBreakRule.replaceAll("-", " → ")}. Las plazas son orientativas.</footer></section></div>}

    {tab === "h2h" && <div className="detail-content"><HeadToHeadTimeline h2h={h2h} home={home} away={away} homeCrest={homeCrest} awayCrest={awayCrest} /></div>}

    <footer className="match-detail-footer">GlorIA Futbolera · Análisis local con datos históricos y temporada actual · No constituye recomendación de apuesta.</footer>
  </main>;
}
