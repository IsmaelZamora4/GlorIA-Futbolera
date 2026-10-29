import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AppSidebar } from "../../components/AppSidebar";
import { datasetInfoByCompetition } from "../../data/datasets";
import bundesliga from "../../data/processed/bundesliga/metadata.json";
import laliga from "../../data/processed/la-liga/metadata.json";
import ligue1 from "../../data/processed/ligue-1/metadata.json";
import premierLeague from "../../data/processed/premier-league/metadata.json";
import serieA from "../../data/processed/serie-a/metadata.json";

export const metadata: Metadata = {
  title: "Metodología | GlorIA Futbolera",
  description: "Conoce las fuentes, temporadas, cálculos y límites del análisis estadístico de GlorIA Futbolera.",
};

const metricLabels = {
  winner: "1X2",
  goals: "Goles",
  btts: "Ambos anotan",
  corners: "Córneres",
  shots: "Tiros a puerta",
} as const;

const coverage = [
  { name: "Bundesliga", info: datasetInfoByCompetition["Bundesliga de Alemania"], data: bundesliga, logo: "/competitions/bundesliga.svg" },
  { name: "LaLiga", info: datasetInfoByCompetition["LaLiga de España"], data: laliga, logo: "/competitions/laliga.svg" },
  { name: "Ligue 1", info: datasetInfoByCompetition["Ligue 1 de Francia"], data: ligue1, logo: "/competitions/ligue-1.svg" },
  { name: "Premier League", info: datasetInfoByCompetition["Premier League"], data: premierLeague, logo: "/competitions/premier-league.svg" },
  { name: "Serie A", info: datasetInfoByCompetition["Serie A de Italia"], data: serieA, logo: "/competitions/serie-a.svg" },
] as const;

const fixtureOnly = [
  { name: "Liga 1", source: "TheSportsDB" },
  { name: "Champions League", source: "football-data.org" },
  { name: "Europa League", source: "TheSportsDB" },
];

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function MethodologyPage() {
  return (
    <div className="app-shell">
      <AppSidebar active="Metodología" />
      <main className="main-area">
        <header className="topbar methodology-topbar">
          <div className="mobile-logo">
            <Link href="/" aria-label="GlorIA Futbolera, inicio">
              <Image className="logo-image" src="/logo-gloria.png" alt="GlorIA Futbolera" width={136} height={84} priority />
            </Link>
          </div>
          <div className="methodology-topbar-title"><span className="eyebrow">Transparencia</span><strong>Metodología</strong></div>
          <div className="top-actions"><Link className="methodology-topbar-link" href="/partidos">Ver partidos <span aria-hidden="true">→</span></Link></div>
        </header>

        <div className="methodology-content">
          <section className="methodology-intro" aria-labelledby="methodology-title">
            <div className="methodology-intro-kicker"><span className="eyebrow">Cómo leer el análisis</span><span className="methodology-record-mark" aria-hidden="true">GF / DATOS</span></div>
            <h1 id="methodology-title">Datos, contexto y estimaciones</h1>
            <p>Te contamos qué competiciones tienen análisis histórico, cómo calculamos sus probabilidades y qué cosas no puede saber un modelo basado en resultados pasados.</p>
            <div className="methodology-intro-note"><span aria-hidden="true">i</span><p>Una probabilidad resume datos disponibles; no garantiza lo que ocurrirá en un partido.</p></div>
          </section>

          <nav className="methodology-index" aria-label="Secciones de metodología">
            <a href="#cobertura"><span>01</span> Cobertura</a>
            <a href="#proceso"><span>02</span> Cálculo</a>
            <a href="#alcance"><span>03</span> Fuentes</a>
            <a href="#limites"><span>04</span> Límites</a>
          </nav>

          <section className="methodology-section" id="cobertura" aria-labelledby="coverage-title">
            <div className="methodology-section-heading">
              <div><div className="eyebrow">Datos disponibles</div><h2 id="coverage-title">Cobertura histórica</h2></div>
              <p>La temporada actual es parcial. Los conteos indican los registros guardados al actualizar cada dataset.</p>
            </div>

            <div className="methodology-coverage-grid">
              {coverage.map(({ name, info, data, logo }) => (
                <article className="methodology-coverage-card" key={name}>
                  <header className="methodology-coverage-title">
                    <Image src={logo} alt={`Logo de ${name}`} width={34} height={34} unoptimized />
                    <div><h3>{name}</h3><span>Modelo histórico local</span></div>
                  </header>
                  <dl className="methodology-coverage-stats">
                    <div><dt>Temporadas históricas</dt><dd>{data.historicalSeasons.length}</dd></div>
                    <div><dt>Partidos históricos</dt><dd>{data.historicalMatches.toLocaleString("es-PE")}</dd></div>
                    <div><dt>{data.currentSeason}</dt><dd>{data.currentSeasonMatches.toLocaleString("es-PE")} registros</dd></div>
                  </dl>
                  <p className="methodology-season-list">{data.historicalSeasons.join(" · ")}</p>
                  <ul className="methodology-market-list" aria-label={`Mercados analizados en ${name}`}>
                    {info.markets.map((market) => <li key={market}>{metricLabels[market]}</li>)}
                  </ul>
                  <small className="methodology-updated">Dataset actualizado el {formatUpdatedAt(data.generatedAt)}.</small>
                </article>
              ))}
            </div>

            <p className="methodology-source-note"><strong>Origen histórico:</strong> CSV locales normalizados en GlorIA. El repositorio no registra el proveedor original de esos archivos, así que no atribuimos estos datos a una fuente externa.</p>
          </section>

          <section className="methodology-section" id="proceso" aria-labelledby="process-title">
            <div className="methodology-section-heading">
              <div><div className="eyebrow">De los datos al pronóstico</div><h2 id="process-title">Cómo se construye una estimación</h2></div>
              <p>El análisis usa partidos finalizados antes del encuentro para evitar incluir información futura.</p>
            </div>
            <ol className="methodology-steps">
              <li><span>01</span><div><h3>Separamos local y visitante</h3><p>Calculamos métricas de ataque y defensa según dónde juega cada equipo y las comparamos con el promedio de su liga.</p></div></li>
              <li><span>02</span><div><h3>Suavizamos muestras pequeñas</h3><p>La referencia de liga aporta el equivalente a ocho observaciones, para que pocos partidos no distorsionen tanto la media.</p></div></li>
              <li><span>03</span><div><h3>Incorporamos la temporada actual</h3><p>Solo entran resultados previos al partido. Su peso aumenta con la muestra y llega como máximo al 35% después de diez observaciones de referencia.</p></div></li>
              <li><span>04</span><div><h3>Convertimos las métricas en probabilidades</h3><p>Una distribución de Poisson aproxima los marcadores y las líneas de goles, córneres y tiros. Algunas probabilidades principales reciben calibración walk-forward.</p></div></li>
            </ol>
            <div className="methodology-formula"><span className="eyebrow">Ejemplo: ambos anotan</span><code>P(sí) = (1 − e<sup>−λ local</sup>) × (1 − e<sup>−λ visitante</sup>)</code><p>λ representa los goles esperados por el modelo para cada equipo; no es xG observado.</p></div>
          </section>

          <section className="methodology-section methodology-scope-section" id="alcance" aria-labelledby="scope-title">
            <div className="methodology-section-heading">
              <div><div className="eyebrow">Fuentes y alcance</div><h2 id="scope-title">Qué cubre el modelo</h2></div>
              <p>Agenda de partidos y análisis histórico son coberturas distintas.</p>
            </div>
            <div className="methodology-scope-grid">
              <article className="methodology-scope-card">
                <h3>Fixtures actuales</h3>
                <p>Los partidos de las cinco ligas con modelo local se consultan en <a href="https://www.football-data.org/" target="_blank" rel="noreferrer">football-data.org</a>. El catálogo usa también <a href="https://www.thesportsdb.com/" target="_blank" rel="noreferrer">TheSportsDB</a> para Liga 1 y Europa League.</p>
              </article>
              <article className="methodology-scope-card methodology-scope-card-muted">
                <h3>Competiciones sin análisis histórico local</h3>
                <p>Estas competiciones pueden mostrar fixtures, pero no reciben las probabilidades basadas en los datasets históricos locales de las cinco ligas anteriores.</p>
                <ul>{fixtureOnly.map((item) => <li key={item.name}><span>{item.name}</span><small>{item.source}</small></li>)}</ul>
              </article>
            </div>
          </section>

          <section className="methodology-section methodology-limits" id="limites" aria-labelledby="limits-title">
            <div><div className="eyebrow">Interpretación responsable</div><h2 id="limits-title">Confianza y límites</h2></div>
            <ul>
              <li><strong>La confianza describe la muestra.</strong> Resume la cantidad y cobertura de datos; no es otra probabilidad ni una garantía.</li>
              <li><strong>El contexto puede cambiar.</strong> Lesiones, alineaciones, sanciones y otros eventos que no están en los CSV pueden alterar el partido.</li>
              <li><strong>Los datos faltantes no son cero.</strong> Si una métrica no tiene observaciones suficientes, la interfaz puede indicarla como no disponible.</li>
              <li><strong>El histórico no predice con certeza.</strong> Los porcentajes son estimaciones estadísticas, no recomendaciones de apuesta.</li>
            </ul>
          </section>

          <footer className="methodology-footer"><span>¿Quieres ver el análisis aplicado?</span><Link href="/partidos">Explorar partidos <span aria-hidden="true">→</span></Link></footer>
        </div>
      </main>
    </div>
  );
}
