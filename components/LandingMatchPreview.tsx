"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import match from "../data/landing-match-preview.json";

const tabs = ["Resumen", "Forma", "Goles", "Tiros", "Córneres", "Estadísticas", "Posiciones", "H2H"] as const;
type Tab = (typeof tabs)[number];
type Team = typeof match.home;
type Vote = "home" | "draw" | "away";
const voteKey = "gloria-landing-preview-vote:v1";

function Crest({ team, size = 25 }: { team: Team; size?: number }) {
  return <Image className="mini-crest" src={team.crest} alt={`Escudo de ${team.name}`} width={size} height={size} unoptimized onError={(event) => { event.currentTarget.src = "/team-placeholder.svg"; }} />;
}

function Form({ results }: { results: string[] }) {
  return <span className="mini-form">{results.map((result, index) => <b className={`is-${result.toLowerCase()}`} key={`${result}-${index}`}>{result}</b>)}</span>;
}

function MetricCard({ metric }: { metric: (typeof match.metrics)[number] }) {
  return <article className="mini-metric">
    <span><small>{metric.title}</small><em>{match.sample.label}</em></span>
    <strong>{metric.value}</strong>
    <span><small>{metric.probabilityLabel}</small><b>{metric.probability}%</b></span>
    <div className="mini-progress"><i style={{ width: `${metric.probability}%` }} /></div>
    <small>{metric.league}</small>
  </article>;
}

function Results({ team, type }: { team: Team; type: "conditionMatches" | "recent" }) {
  return <ul className="mini-results">{team[type].map((item, index) => <li key={`${item.date}-${index}`}><time>{item.date}</time><b className={`mini-result is-${item.result.toLowerCase()}`}>{item.result}</b><span>{item.opponent}</span><strong>{item.score}</strong></li>)}</ul>;
}

export function LandingMatchPreview() {
  const [tab, setTab] = useState<Tab>("Resumen");
  const [vote, setVote] = useState<Vote | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(voteKey);
      if (saved === "home" || saved === "draw" || saved === "away") setVote(saved);
    } catch {
      // La vista previa sigue disponible sin almacenamiento local.
    }
  }, []);

  function chooseVote(choice: Vote) {
    setVote(choice);
    try { localStorage.setItem(voteKey, choice); } catch { /* La elección permanece durante esta visita. */ }
  }

  const choices: { id: Vote; label: string; number: string; team?: Team }[] = [
    { id: "home", label: match.home.name, number: "1", team: match.home },
    { id: "draw", label: "Empate", number: "X" },
    { id: "away", label: match.away.name, number: "2", team: match.away },
  ];

  return <div className="mini-match" aria-label="Vista interactiva de ejemplo del partido Villarreal contra Espanol">
    <div className="mini-toolbar"><span className="mini-toolbar-brand">GlorIA</span><span>VISTA DE PRUEBA · DATOS SIMULADOS</span><Link href={match.detailHref}>Ver partido completo <span aria-hidden="true">↗</span></Link></div>
    <div className="mini-viewport">
      <div className="mini-league"><Image src={match.competitionLogo} alt="" width={18} height={18} /><span>{match.competition}</span><i />{match.label}</div>
      <div className="mini-matchup">
        <div className="mini-team"><Crest team={match.home} size={30} /><div><strong>{match.home.name}</strong><small>Local</small><Form results={match.home.form} /></div></div>
        <div className="mini-versus"><small>{match.time}</small><strong>VS</strong><span>{match.date}</span></div>
        <div className="mini-team mini-team-away"><div><strong>{match.away.name}</strong><small>Visitante</small><Form results={match.away.form} /></div><Crest team={match.away} size={30} /></div>
      </div>
      <div className="mini-meta"><span>◷ {match.date} · {match.time}</span><span>⌖ {match.stadium}</span><span>⌁ Datos hasta {match.dataUntil}</span></div>
      <nav className="mini-tabs" aria-label="Secciones de la vista previa" role="tablist">{tabs.map((item) => <button type="button" role="tab" id={`mini-tab-${item}`} aria-controls="mini-panel" aria-selected={tab === item} className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <div className="mini-tab-content" role="tabpanel" id="mini-panel" aria-labelledby={`mini-tab-${tab}`}>
        {tab === "Resumen" && <>
          <section className="mini-panel"><div className="mini-panel-heading"><h3>Probabilidad 1X2</h3><span>Estimación del modelo</span></div><div className="mini-prob-bar"><i style={{ width: `${match.probabilities.home}%` }} /><i style={{ width: `${match.probabilities.draw}%` }} /><i style={{ width: `${match.probabilities.away}%` }} /></div><div className="mini-prob-choices">{choices.map((choice) => <div key={choice.id}><b>{choice.number}</b>{choice.team && <Crest team={choice.team} size={16} />}<span>{choice.label}</span><strong>{match.probabilities[choice.id]}%</strong></div>)}</div></section>
          <section className="mini-panel"><div className="mini-panel-heading"><h3>Calidad de muestra</h3><span>{match.sample.label}</span></div><div className="mini-progress"><i style={{ width: `${match.sample.coverage}%` }} /></div><p>{match.sample.description}</p></section>
          <section className="mini-panel"><div className="mini-panel-heading"><h3>Encuesta local</h3><span>¿Quién crees que ganará?</span></div><p>Tu elección se guarda solo en este navegador.</p><div className="mini-poll">{choices.map((choice) => <button type="button" key={choice.id} aria-pressed={vote === choice.id} onClick={() => chooseVote(choice.id)}><b>{choice.number}</b>{choice.team && <Crest team={choice.team} size={16} />}{choice.label}</button>)}</div><small>{vote ? `Elegiste ${choices.find((choice) => choice.id === vote)?.label}.` : "Aún no has elegido un resultado."}</small></section>
          <section className="mini-panel mini-stadium"><div className="mini-panel-heading"><h3>Estadio</h3><span>⌖ {match.city}</span></div><strong>{match.stadium}</strong><Image src={match.stadiumImage} alt={`Vista de ${match.stadium}`} width={450} height={170} /><small>Imagen local</small></section>
          <section className="mini-panel"><h3>Datos locales</h3><p>{match.localData}</p></section>
        </>}
        {tab === "Forma" && <><h3 className="mini-section-title">Rendimiento según condición</h3><p className="mini-section-note">Temporada actual · antes del partido</p>{([match.home, match.away] as Team[]).map((team) => <section className="mini-panel" key={team.name}><div className="mini-panel-heading"><h3><Crest team={team} size={18} />{team.name}</h3><span>{team.condition.label}</span></div><div className="mini-facts"><span>PJ <b>{team.condition.matches}</b></span><span>G/E/P <b>{team.condition.record}</b></span><span>GF–GC <b>{team.condition.goals}</b></span><span>Pts/PJ <b>{team.condition.pointsPerMatch}</b></span></div><p>{team.condition.points} pts · Partidos {team === match.home ? "en casa" : "fuera de casa"}</p><Results team={team} type="conditionMatches" /><h4>Últimos resultados · {team.recentPoints}</h4><Results team={team} type="recent" /><small>Temporada actual · {team.recentGoals}</small></section>)}</>}
        {(tab === "Goles" || tab === "Tiros" || tab === "Córneres") && <><h3 className="mini-section-title">{tab === "Goles" ? "Lectura rápida · Goles" : tab === "Tiros" ? "Tiros a puerta" : "Córneres"}</h3><p className="mini-section-note">Estimaciones estadísticas; no garantizan resultados.</p><div className="mini-metrics">{match.metrics.filter((metric) => metric.tab === tab).map((metric) => <MetricCard metric={metric} key={metric.id} />)}</div></>}
        {tab === "Estadísticas" && <><section className="mini-panel"><div className="mini-panel-heading"><h3>Lectura del modelo</h3><span>{match.sample.label}</span></div><p>{match.modelReading}</p><div className="mini-facts"><span>Goles esperados <b>2.99</b></span><span>Ambos anotan <b>55%</b></span><span>+2.5 goles <b>57%</b></span></div></section><h3 className="mini-section-title">Métricas clave</h3><div className="mini-metrics">{match.metrics.map((metric) => <MetricCard metric={metric} key={metric.id} />)}</div><section className="mini-panel"><h3>Por qué muestra esta lectura</h3>{match.reasons.map((reason) => <p key={reason.title}><b>{reason.title}:</b> {reason.text}</p>)}</section><p className="mini-section-note">{match.disclaimer}</p></>}
        {tab === "Posiciones" && <section className="mini-panel"><h3>Posición prepartido</h3><div className="mini-standing"><div><b>{match.home.position}</b><Crest team={match.home} size={24} /><span>{match.home.name}<small>{match.home.points} pts</small></span></div><span>vs</span><div><b>{match.away.position}</b><Crest team={match.away} size={24} /><span>{match.away.name}<small>{match.away.points} pts</small></span></div></div><p>Distancia al rival · {match.positionGap}</p></section>}
        {tab === "H2H" && <section className="mini-panel"><h3>H2H en datasets locales</h3><div className="mini-h2h"><div><Crest team={match.home} /><b>{match.headToHead.home}</b><span>{match.home.name}</span></div><div><b>{match.headToHead.draw}</b><span>Empates</span></div><div><Crest team={match.away} /><b>{match.headToHead.away}</b><span>{match.away.name}</span></div></div></section>}
      </div>
      <p className="mini-disclaimer">{match.disclaimer}</p>
    </div>
  </div>;
}
