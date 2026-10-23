import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFootballDataStandings, type FootballDataStanding } from "../../lib/football-data";
import { AppSidebar } from "../../components/AppSidebar";

const competitions = [
  { id: "premier-league", name: "Premier League", country: "Inglaterra", logo: "/competitions/premier-league.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "Inglaterra" },
  { id: "laliga", name: "LaLiga", country: "España", logo: "/competitions/laliga.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "España" },
  { id: "serie-a", name: "Serie A", country: "Italia", logo: "/competitions/serie-a.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "Italia" },
  { id: "bundesliga", name: "Bundesliga", country: "Alemania", logo: "/competitions/bundesliga.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "Alemania" },
  { id: "ligue-1", name: "Ligue 1", country: "Francia", logo: "/competitions/ligue-1.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "Francia" },
  { id: "liga-1-peru", name: "Liga 1", country: "Perú", logo: "/competitions/liga-1-peru.svg", source: "TheSportsDB", coverage: "Partidos", accent: "Perú" },
  { id: "champions-league", name: "Champions League", country: "Europa", logo: "/competitions/champions-league.svg", source: "football-data.org", coverage: "Partidos y tabla", accent: "Europa" },
  { id: "europa-league", name: "Europa League", country: "Europa", logo: "/competitions/europa-league.svg", source: "TheSportsDB", coverage: "Partidos", accent: "Europa" },
] as const;

function positionClass(position: number) {
  if (position <= 4) return "champions";
  if (position === 5) return "europa";
  if (position >= 18) return "relegation";
  return "neutral";
}

function StandingsTable({ table }: { table: FootballDataStanding[] }) {
  return <div className="standings-card"><div className="table-scroll"><table><thead><tr><th>Pos.</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts.</th></tr></thead><tbody>{table.map((row) => <tr key={row.team.id}><td><span className={`position-badge ${positionClass(row.position)}`}>{row.position}</span></td><td><div className="standing-team"><Image src={row.team.crest || "/team-placeholder.svg"} alt={`Escudo de ${row.team.name}`} width={28} height={28} /><strong>{row.team.name}</strong></div></td><td>{row.playedGames}</td><td>{row.won}</td><td>{row.draw}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td></tr>)}</tbody></table></div><div className="standings-legend"><span><i className="champions" />Champions League</span><span><i className="europa" />Europa League</span><span><i className="relegation" />Descenso</span></div></div>;
}

function Navigation() {
  return <AppSidebar active="Competiciones" />;
}

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ competicion?: string }> }) {
  const params = await searchParams;
  const selected = competitions.find((item) => item.id === params.competicion);
  if (selected?.coverage.includes("tabla")) {
    redirect(`/posiciones?competicion=${selected.id}`);
  }
  let table: FootballDataStanding[] = [];
  let tableError = "";
  if (selected && selected.coverage.includes("tabla")) {
    try {
      table = await getFootballDataStandings(selected.name === "LaLiga" ? "LaLiga de España" : selected.name === "Serie A" ? "Serie A de Italia" : selected.name === "Ligue 1" ? "Ligue 1 de Francia" : selected.name === "Bundesliga" ? "Bundesliga de Alemania" : selected.name);
    } catch (error) {
      tableError = error instanceof Error ? error.message : "No se pudo cargar la tabla.";
    }
  }
  return <div className="app-shell"><Navigation /><main className="main-area"><header className="topbar"><div className="competition-page-brand"><div className="eyebrow">GlorIA Futbolera</div><strong>Centro de competiciones</strong></div><div className="top-actions"><span className="demo-status"><i /> {selected ? "Datos reales" : "Sin consultas automáticas"}</span></div></header><div className="competitions-page"><header className="competitions-hero"><div><div className="eyebrow">Explora el fútbol</div><h1>Competiciones</h1><p>Elige una liga para consultar sus partidos o su tabla. El catálogo inicial no realiza llamadas externas.</p></div><div className="competitions-cache-note"><span>◷</span><strong>Caché inteligente</strong><small>Las consultas de partidos y posiciones se reutilizan durante 6 horas.</small></div></header><section className="competition-summary"><div><strong>{competitions.length}</strong><span>competiciones configuradas</span></div><div><strong>2</strong><span>fuentes conectadas</span></div><div><strong>{selected ? "1" : "0"}</strong><span>consulta de tabla actual</span></div></section><div className="competition-catalog">{competitions.map((item) => <article className={`competition-card ${selected?.id === item.id ? "selected" : ""}`} key={item.id}><div className="competition-card-top"><div className="competition-logo-wrap"><Image src={item.logo} alt={`Logo de ${item.name}`} width={54} height={54} /></div><div><span className="competition-country">{item.country}</span><h2>{item.name}</h2><p>{item.coverage}</p></div><span className="competition-live-dot" title="Fuente configurada" /></div><div className="competition-card-meta"><span><i />{item.source}</span><span>Cacheada 6 h</span></div><div className="competition-card-actions"><Link href={`/partidos?competicion=${encodeURIComponent(item.name)}`}>Ver partidos <b>→</b></Link>{item.coverage.includes("tabla") ? <Link href={`/competiciones?competicion=${item.id}`}>Ver tabla <b>↗</b></Link> : <span className="unavailable-action">Tabla no disponible</span>}</div></article>)}</div>{selected?.coverage.includes("tabla") && <section className="competition-standings"><div className="standings-heading"><div><div className="eyebrow">Tabla actual · datos reales</div><h2>{selected.name}</h2></div><div className="standings-source"><span />football-data.org<br /><small>Caché de 6 horas</small></div></div>{tableError ? <div className="standings-empty"><h1>La tabla no está disponible</h1><p>{tableError}</p></div> : <StandingsTable table={table} />}</section>}<section className="competition-method"><div><div className="eyebrow">Cómo cuidamos tus peticiones</div><h2>Primero catálogo, después datos</h2></div><p>No cargamos partidos ni tablas automáticamente en este centro. Solo se consulta la competición que elijas, y las respuestas de las fuentes quedan cacheadas durante seis horas.</p></section></div></main></div>;
}
