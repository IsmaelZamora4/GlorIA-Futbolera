import Image from "next/image";
import Link from "next/link";

import { SportiaSidebar } from "../../components/SportiaSidebar";
import { getFootballDataStandings, type FootballDataStanding } from "../../lib/football-data";

export const dynamic = "force-dynamic";

const competitions = [
  { id: "premier-league", name: "Premier League", label: "Premier League", logo: "/competitions/premier-league.svg" },
  { id: "serie-a", name: "Serie A de Italia", label: "Serie A", logo: "/competitions/serie-a.svg" },
  { id: "laliga", name: "LaLiga de España", label: "LaLiga", logo: "/competitions/laliga.svg" },
  { id: "ligue-1", name: "Ligue 1 de Francia", label: "Ligue 1", logo: "/competitions/ligue-1.svg" },
  { id: "bundesliga", name: "Bundesliga de Alemania", label: "Bundesliga", logo: "/competitions/bundesliga.svg" },
  { id: "champions-league", name: "Champions League", label: "Champions League", logo: "/competitions/champions-league.svg" },
] as const;

function getCompetition(id?: string) {
  return competitions.find((competition) => competition.id === id) ?? competitions[0];
}

function positionClass(position: number) {
  if (position <= 4) return "champions";
  if (position === 5) return "europa";
  if (position >= 18) return "relegation";
  return "neutral";
}

function StandingsTable({ table }: { table: FootballDataStanding[] }) {
  return <div className="standings-card"><div className="table-scroll"><table><thead><tr><th>Pos.</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts.</th></tr></thead><tbody>{table.map((row) => <tr key={row.team.id}><td><span className={`position-badge ${positionClass(row.position)}`}>{row.position}</span></td><td><div className="standing-team"><Image src={row.team.crest || "/team-placeholder.svg"} alt={`Escudo de ${row.team.name}`} width={28} height={28} /><strong>{row.team.name}</strong></div></td><td>{row.playedGames}</td><td>{row.won}</td><td>{row.draw}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td></tr>)}</tbody></table></div><div className="standings-legend"><span><i className="champions" />Champions League</span><span><i className="europa" />Europa League</span><span><i className="relegation" />Descenso</span></div></div>;
}

export default async function PositionsPage({ searchParams }: { searchParams: Promise<{ competicion?: string }> }) {
  const params = await searchParams;
  const competition = getCompetition(params.competicion);
  let table: FootballDataStanding[] = [];
  let errorMessage = "";
  try {
    table = await getFootballDataStandings(competition.name);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudo cargar la tabla.";
  }

  return <div className="app-shell standings-shell"><SportiaSidebar active="Competiciones" /><div className="main-area standings-main"><header className="sportia-topbar standings-app-topbar"><div><h1>Posiciones</h1><p>{competition.label} · tabla general</p></div><div className="standings-source"><span />football-data.org<br /><small>Actualización cacheada por 6 horas</small></div></header><section className="standings-content">{errorMessage ? <div className="standings-empty"><div className="eyebrow">Posiciones · {competition.label}</div><h2>La tabla no está disponible</h2><p>{errorMessage}</p><Link className="match-detail-header-link primary" href="/">Volver al inicio</Link></div> : <><nav className="competition-tabs" aria-label="Seleccionar competición">{competitions.map((item) => <Link key={item.id} href={`/posiciones?competicion=${item.id}`} className={item.id === competition.id ? "active" : undefined} aria-current={item.id === competition.id ? "page" : undefined}><Image className="competition-logo" src={item.logo} alt={`Logo de ${item.label}`} width={38} height={38} unoptimized /><span className="competition-copy"><strong>{item.label}</strong><small>Tabla general</small></span><span className="competition-arrow" aria-hidden="true">→</span></Link>)}</nav><StandingsTable table={table} /></>}</section></div></div>;
}
