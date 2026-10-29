import Image from "next/image";
import Link from "next/link";
import { datasetInfoByCompetition } from "../data/datasets";
import { LandingMatchPreview } from "../components/LandingMatchPreview";
import { LandingFixturesPreview } from "../components/LandingFixturesPreview";

const features = [
  { icon: "calendar", title: "Partidos", text: "Consulta la agenda por fecha y competición." },
  { icon: "trophy", title: "Competiciones", text: "Sigue las ligas disponibles en un solo lugar." },
  { icon: "chart", title: "Predicciones", text: "Estimaciones basadas en datos históricos." },
  { icon: "stats", title: "Estadísticas", text: "Métricas para entender mejor cada encuentro." },
] as const;

const competitions = [
  { name: "Premier League", country: "Inglaterra", id: "Premier League", logo: "/competitions/premier-league.svg" },
  { name: "LaLiga", country: "España", id: "LaLiga de España", logo: "/competitions/laliga.svg" },
  { name: "Serie A", country: "Italia", id: "Serie A de Italia", logo: "/competitions/serie-a.svg" },
  { name: "Bundesliga", country: "Alemania", id: "Bundesliga de Alemania", logo: "/competitions/bundesliga.svg" },
  { name: "Ligue 1", country: "Francia", id: "Ligue 1 de Francia", logo: "/competitions/ligue-1.svg" },
  { name: "Champions League", country: "Europa", id: "Champions League", logo: "/competitions/champions-league.svg" },
];

const productViews = [
  { title: "Partidos", detail: "Agenda por día y competición.", preview: true },
  { title: "Detalle del encuentro", detail: "Probabilidades, estadio y muestra del modelo.", image: "/match-info-screenshot.jpg", alt: "Detalle de un partido con probabilidades y datos del estadio" },
  { title: "Análisis estadístico", detail: "Métricas y tendencias para cada partido.", image: "/home-screenshot.jpg", alt: "Pantalla de análisis estadístico de GlorIA Futbolera" },
];

const historicalLeagues = Object.values(datasetInfoByCompetition).filter(({ status }) => status === "historical").length;
const datasetSeasons = new Set(Object.values(datasetInfoByCompetition).flatMap(({ seasons }) => seasons)).size;
const historicalMarkets = new Set(Object.values(datasetInfoByCompetition).flatMap(({ markets }) => markets)).size;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 14 4-4 3 2 5-6" /><path d="M16 6h3v3" /></>,
    stats: <><path d="M4 20V11m5 9V5m5 15v-7m5 7V8" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="GlorIA Futbolera, inicio">
          <Image src="/gloria-futbolera.svg" alt="" width={32} height={32} />
          <span>GlorIA <b>Futbolera</b></span>
        </Link>
        <nav className="landing-nav" aria-label="Navegación principal">
          <a className="is-current" href="#inicio" aria-current="page">Inicio</a>
          <Link href="/competiciones">Competiciones</Link>
          <a href="#funciones">Funciones</a>
          <Link href="/partidos">Partidos</Link>
          <Link href="/metodologia">Metodología</Link>
        </nav>
        <div className="landing-actions">
          <Link className="landing-login" href="/login">Iniciar sesión</Link>
          <Link className="landing-cta landing-cta-small" href="/partidos">Ver partidos <span className="landing-cta-small-arrow" aria-hidden="true">→</span></Link>
        </div>
      </header>

      <section className="landing-hero" id="inicio" aria-labelledby="landing-title">
        <div className="landing-backdrop" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-copy">
            <h1 id="landing-title">El fútbol, con contexto.</h1>
            <p>Partidos, competiciones y análisis estadístico para entender qué hay detrás de cada encuentro.</p>
            <div className="landing-hero-actions">
              <Link className="landing-cta" href="/partidos">Explorar partidos <span aria-hidden="true">→</span></Link>
              <Link className="landing-secondary-cta" href="/metodologia">Conoce la metodología</Link>
            </div>
          </div>
          <div className="landing-preview-shell"><div className="landing-preview-wrap"><LandingMatchPreview /></div></div>
        </div>
      </section>

      <section className="landing-features" id="funciones" aria-label="Funciones de GlorIA Futbolera">
        {features.map((feature) => (
          <article className="landing-feature" key={feature.title}>
            <span className="landing-feature-icon"><FeatureIcon name={feature.icon} /></span>
            <span><b>{feature.title}</b><small>{feature.text}</small></span>
          </article>
        ))}
      </section>

      <section className="landing-competitions" aria-labelledby="landing-competitions-title">
        <div className="landing-section-heading">
          <div><h2 id="landing-competitions-title">Competiciones destacadas</h2><p>Accede a la agenda de las ligas disponibles.</p></div>
          <Link href="/competiciones">Ver todas <span aria-hidden="true">→</span></Link>
        </div>
        <div className="landing-competition-grid">
          {competitions.map((competition) => (
            <Link className="landing-competition" href={`/partidos?competicion=${encodeURIComponent(competition.id)}`} key={competition.name}>
              <span className="landing-competition-logo"><Image src={competition.logo} alt="" width={38} height={38} /></span>
              <span className="landing-competition-copy"><b>{competition.name}</b><small>{competition.country}</small></span>
              <span className="landing-competition-action" aria-hidden="true">Ver <span>→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-experience" aria-labelledby="landing-experience-title">
        <div className="landing-experience-copy">
          <h2 id="landing-experience-title">Una mirada más completa del juego.</h2>
          <p>Desde la agenda diaria hasta el análisis de cada encuentro. Explora las pantallas de GlorIA Futbolera.</p>
          <Link className="landing-text-link" href="/partidos">Ir a la agenda <span aria-hidden="true">→</span></Link>
        </div>
        <div className="landing-view-grid">
          {productViews.map((view) => (
            <article className="landing-view-card" key={view.title}>
              <span className="landing-view-image">{"preview" in view ? <LandingFixturesPreview /> : <Image src={view.image} alt={view.alt} fill sizes="(max-width: 760px) 92vw, 27vw" />}</span>
              <b>{view.title}</b><small>{view.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-facts" aria-label="Cobertura de datos">
        <div><b>{historicalLeagues}</b><span>Ligas con dataset histórico</span></div>
        <div><b>{datasetSeasons}</b><span>Temporadas documentadas</span></div>
        <div><b>{historicalMarkets}</b><span>Métricas del modelo</span></div>
        <Link href="/metodologia">Fuentes y límites <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="landing-footer">
        <Link className="landing-footer-brand" href="/"><Image src="/gloria-futbolera.svg" alt="" width={25} height={25} />GlorIA Futbolera</Link>
        <span>Fútbol con contexto.</span>
        <nav aria-label="Enlaces del pie de página"><Link href="/partidos">Partidos</Link><Link href="/competiciones">Competiciones</Link><Link href="/metodologia">Metodología</Link><Link href="/login">Iniciar sesión</Link></nav>
      </footer>
    </main>
  );
}
