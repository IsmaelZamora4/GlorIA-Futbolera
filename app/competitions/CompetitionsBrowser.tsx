"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./competitions.module.css";

const competitions = [
  { id: "premier-league", query: "Premier League", label: "Premier League", country: "Inglaterra", region: "Europa", teams: 20, logo: "/competitions/premier-league.svg", popularity: 1, standings: true, analysis: true },
  { id: "laliga", query: "LaLiga de España", label: "LaLiga", country: "España", region: "Europa", teams: 20, logo: "/competitions/laliga.svg", popularity: 2, standings: true, analysis: true },
  { id: "serie-a", query: "Serie A de Italia", label: "Serie A", country: "Italia", region: "Europa", teams: 20, logo: "/competitions/serie-a.svg", popularity: 3, standings: true, analysis: true },
  { id: "bundesliga", query: "Bundesliga de Alemania", label: "Bundesliga", country: "Alemania", region: "Europa", teams: 18, logo: "/competitions/bundesliga.svg", popularity: 4, standings: true, analysis: true },
  { id: "ligue-1", query: "Ligue 1 de Francia", label: "Ligue 1", country: "Francia", region: "Europa", teams: 18, logo: "/competitions/ligue-1.svg", popularity: 5, standings: true, analysis: true },
  { id: "champions-league", query: "Champions League", label: "Champions League", country: "Europa", region: "Europa", teams: 36, logo: "/competitions/champions-league.svg", popularity: 6, standings: true, analysis: false },
] as const;

const classicMatches = [
  { competition: "Premier League", query: "Premier League", id: "premier-league", home: "Manchester City", away: "Manchester United", homeCrest: "65", awayCrest: "66", logo: "/competitions/premier-league.svg" },
  { competition: "LaLiga", query: "LaLiga de España", id: "laliga", home: "Real Madrid", away: "Barcelona", homeCrest: "86", awayCrest: "81", logo: "/competitions/laliga.svg" },
  { competition: "Serie A", query: "Serie A de Italia", id: "serie-a", home: "Inter", away: "Milan", homeCrest: "108", awayCrest: "98", logo: "/competitions/serie-a.svg" },
  { competition: "Bundesliga", query: "Bundesliga de Alemania", id: "bundesliga", home: "Bayern München", away: "Dortmund", homeCrest: "5", awayCrest: "4", logo: "/competitions/bundesliga.svg" },
] as const;

function Availability({ available, label }: { available: boolean; label: string }) {
  return <span className={`${styles.availability} ${available ? styles.available : styles.unavailable}`} aria-label={`${label}: ${available ? "disponible" : "sin cobertura histórica"}`} title={available ? "Disponible" : "Sin cobertura histórica"}>{available ? <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6" /></svg> : "–"}</span>;
}

export function CompetitionsBrowser() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("Todas las regiones");
  const [sort, setSort] = useState("popularidad");

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return competitions
      .filter((competition) => `${competition.label} ${competition.country}`.toLocaleLowerCase("es").includes(normalizedQuery))
      .filter((competition) => region === "Todas las regiones" || competition.region === region)
      .toSorted((a, b) => sort === "alfabetico" ? a.label.localeCompare(b.label, "es") : a.popularity - b.popularity);
  }, [query, region, sort]);

  return (
    <div className={styles.content}>
      <section className={styles.catalog} aria-labelledby="available-competitions-title">
        <div className={styles.catalogHeading}>
          <div>
            <h2 id="available-competitions-title">Competiciones disponibles</h2>
            <p>Busca y filtra para encontrar la competición que quieres analizar.</p>
          </div>
          <div className={styles.filters}>
            <label className={styles.search}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
              <span className={styles.srOnly}>Buscar competición</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar competición…" />
            </label>
            <label className={styles.selectLabel}>
              <span className={styles.srOnly}>Filtrar por región</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                <option>Todas las regiones</option>
                <option>Europa</option>
              </select>
              <svg className={styles.selectChevron} aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
            </label>
            <label className={styles.selectLabel}>
              <span className={styles.srOnly}>Ordenar competiciones</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="popularidad">Ordenar por popularidad</option>
                <option value="alfabetico">Orden alfabético</option>
              </select>
              <svg className={styles.selectChevron} aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
            </label>
          </div>
        </div>

        {filteredCompetitions.length > 0 ? (
          <div className={styles.competitionGrid}>
            {filteredCompetitions.map((competition) => (
              <Link className={styles.competitionCard} href={`/partidos?competicion=${encodeURIComponent(competition.query)}`} key={competition.id}>
                <span className={styles.competitionLogo}><Image src={competition.logo} alt="" width={52} height={52} /></span>
                <span className={styles.competitionInfo}>
                  <strong>{competition.label}</strong>
                  <small>{competition.country}</small>
                  <span className={styles.competitionMeta}><i>{competition.teams} equipos</i><span>Ver partidos <b aria-hidden="true">→</b></span></span>
                </span>
                <span className={styles.cardArrow} aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptySearch} role="status">No encontramos competiciones con esos filtros.</p>
        )}
      </section>

      <section className={styles.fixtures} aria-labelledby="upcoming-matches-title">
        <div className={styles.sectionHeading}>
          <div><h2 id="upcoming-matches-title">Próximos encuentros</h2><p>Clásicos de las principales ligas; consulta la agenda para confirmar fechas y horarios.</p></div>
          <Link href="/partidos">Ver toda la agenda <span aria-hidden="true">→</span></Link>
        </div>
        <div className={styles.fixtureGrid}>
          {classicMatches.map((match) => (
            <article className={styles.fixtureCard} key={match.id}>
              <div className={styles.fixtureTop}>
                <Image src={match.logo} alt="" width={20} height={20} />
                <strong>{match.competition}</strong>
                <span>Clásico destacado</span>
              </div>
              <div className={styles.fixtureTeams}>
                <span className={styles.team}><Image src={`https://crests.football-data.org/${match.homeCrest}.png`} alt="" width={26} height={26} unoptimized /><b>{match.home}</b></span>
                <span className={styles.versus}>vs</span>
                <span className={`${styles.team} ${styles.awayTeam}`}><Image src={`https://crests.football-data.org/${match.awayCrest}.png`} alt="" width={26} height={26} unoptimized /><b>{match.away}</b></span>
              </div>
              <Link href={`/partidos?competicion=${encodeURIComponent(match.query)}`}>Ver partidos <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.informationGrid}>
        <section className={styles.panel} aria-labelledby="coverage-title">
          <div className={styles.panelHeading}><div><h2 id="coverage-title">Cobertura de datos por competición</h2><p>Consulta qué información está disponible en cada liga.</p></div><Link href="/metodologia" aria-label="Ver más sobre cobertura">›</Link></div>
          <div className={styles.coverageTable} role="table" aria-label="Cobertura de datos por competición">
            <div className={`${styles.coverageRow} ${styles.coverageHeader}`} role="row">
              <span role="columnheader">Competición</span><span role="columnheader">Partidos</span><span role="columnheader">Tabla</span><span role="columnheader">Estadísticas</span><span role="columnheader">Histórico</span>
            </div>
            {competitions.map((competition) => (
              <div className={styles.coverageRow} role="row" key={competition.id}>
                <span className={styles.coverageCompetition} role="rowheader"><Image src={competition.logo} alt="" width={18} height={18} /><b>{competition.label}</b></span>
                <span role="cell"><Availability available label={`${competition.label}, partidos`} /></span>
                <span role="cell"><Availability available label={`${competition.label}, tabla`} /></span>
                <span role="cell"><Availability available={competition.analysis} label={`${competition.label}, estadísticas`} /></span>
                <span role="cell"><Availability available={competition.analysis} label={`${competition.label}, histórico`} /></span>
              </div>
            ))}
          </div>
          <p className={styles.coverageNote}>Partidos y tablas dependen de la disponibilidad de football-data.org. El análisis histórico local cubre cinco ligas; Champions League no tiene dataset propio.</p>
        </section>

        <section className={styles.panel} aria-labelledby="sources-title">
          <div className={styles.panelHeading}><div><h2 id="sources-title">Fuentes y actualización</h2><p>Los datos proceden de fuentes especializadas en fútbol. La cobertura puede variar según la competición.</p></div></div>
          <div className={styles.sourceList}>
            <article><span className={styles.sourceIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg></span><span><b>Fuente de datos</b><small>football-data.org para agenda y tablas; datasets locales para cinco ligas.</small></span></article>
            <article><span className={styles.sourceIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span><span><b>Actualización</b><small>Las consultas actuales se reutilizan desde caché durante seis horas.</small></span></article>
            <article><span className={styles.sourceIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" /></svg></span><span><b>Cobertura</b><small>La disponibilidad de datos cambia según la competición y la temporada.</small></span></article>
            <article><span className={styles.sourceIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3v7h7m-11 4h6m-6 4h6" /></svg></span><span><b>Más información</b><small>Consulta todos los detalles en la sección de <Link href="/metodologia">Metodología</Link>.</small></span></article>
          </div>
        </section>
      </div>
    </div>
  );
}
