import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingFooter } from "../../components/LandingFooter";
import { LandingHeader } from "../../components/LandingHeader";
import landingMatchPreview from "../../data/landing-match-preview.json";
import styles from "./como-funciona.module.css";

const match = {
  ...landingMatchPreview,
  home: {
    ...landingMatchPreview.home,
    name: "PSG",
    fullName: "Paris Saint-Germain",
    crest: "https://crests.football-data.org/524.png",
    form: ["G", "E", "P", "G", "P"],
    condition: { ...landingMatchPreview.home.condition, matches: 5, pointsPerMatch: "1.80" },
  },
  away: {
    ...landingMatchPreview.away,
    name: "Marsella",
    fullName: "Olympique de Marseille",
    crest: "https://crests.football-data.org/516.png",
    form: ["G", "P", "G", "E", "P"],
    condition: { ...landingMatchPreview.away.condition, matches: 5, pointsPerMatch: "1.60" },
  },
  probabilities: { home: 36, draw: 31, away: 33 },
  headToHead: { home: 3, draw: 2, away: 3 },
};

export const metadata: Metadata = {
  title: "Cómo funciona | GlorIA Futbolera",
  description: "Conoce cómo GlorIA Futbolera reúne contexto, estadísticas y estimaciones para entender mejor los partidos.",
};

const steps = [
  {
    title: "Elige qué explorar",
    description: "Selecciona un partido o una competición disponible en la plataforma.",
    icon: "calendar",
  },
  {
    title: "Mira el contexto",
    description: "Revisa la forma reciente, estadísticas, antecedentes y otros datos relevantes que ayudan a situar el encuentro.",
    icon: "chart",
  },
  {
    title: "Interpreta las estimaciones",
    description: "Analiza probabilidades y métricas como referencias estadísticas, considerando la calidad de la muestra y sus limitaciones.",
    icon: "trend",
  },
] as const;

const information = [
  {
    title: "Partidos y competiciones",
    description: "Accede a la agenda de las ligas y torneos disponibles.",
    href: "/partidos",
    icon: "calendar",
  },
  {
    title: "Análisis estadístico",
    description: "Explora estimaciones de resultado, goles, córneres y tiros cuando haya datos suficientes.",
    href: "/partidos",
    icon: "chart",
  },
  {
    title: "Forma y métricas de equipos",
    description: "Compara el rendimiento reciente y las métricas disponibles de cada equipo.",
    href: "/partidos",
    icon: "shield",
  },
  {
    title: "Fuentes y límites",
    description: "Conoce la cobertura de datos y cómo interpretar las estimaciones.",
    href: "/metodologia",
    icon: "database",
  },
] as const;

type IconName = "calendar" | "chart" | "trend" | "shield" | "database";

function Icon({ name }: { name: IconName }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 14 4-4 3 2 5-6" /></>,
    trend: <><path d="m4 16 6-6 4 4 6-8" /><path d="M14 6h6v6" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.2-8 10-4.7-1.8-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function RecentForm() {
  const teams = [match.home, match.away];
  const outcomeLabels: Record<string, string> = { G: "Ganado", E: "Empatado", P: "Perdido" };

  return (
    <section className={`${styles.widget} ${styles.formWidget}`} aria-labelledby="sample-form-title">
      <h2 id="sample-form-title">Forma reciente</h2>
      <div className={styles.formTeams}>
        {teams.map((team) => (
          <div className={styles.formTeam} key={team.name}>
            <Image src={team.crest} alt="" width={22} height={22} unoptimized />
            <span className={styles.teamName}>{team.name}</span>
            <span className={styles.formResults} aria-label={`Últimos resultados de ${team.name}`}>
              {team.form.map((outcome, index) => (
                <span className={`${styles.result} ${styles[`result${outcome}`]}`} aria-label={outcomeLabels[outcome]} key={`${team.name}-${index}`}>{outcome}</span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchHistory() {
  const history = [
    { label: "Local", count: match.headToHead.home },
    { label: "Empates", count: match.headToHead.draw },
    { label: "Visitante", count: match.headToHead.away },
  ];

  return (
    <section className={`${styles.widget} ${styles.historyWidget}`} aria-labelledby="sample-history-title">
      <h2 id="sample-history-title">Historial directo</h2>
      <p className={styles.widgetCaption}>Resumen de la muestra</p>
      <div className={styles.historyRows}>
        {history.map(({ label, count }) => (
          <div className={styles.historyRow} key={label}><span>{label}</span><strong>{count}</strong></div>
        ))}
      </div>
    </section>
  );
}

function TeamComparison() {
  const rows = [
    { label: "Puntos por partido", home: Number(match.home.condition.pointsPerMatch), away: Number(match.away.condition.pointsPerMatch) },
    { label: "Partidos de muestra", home: match.home.condition.matches, away: match.away.condition.matches },
  ];
  const maxValue = Math.max(...rows.flatMap(({ home, away }) => [home, away]), 1);

  return (
    <section className={`${styles.widget} ${styles.comparisonWidget}`} aria-labelledby="sample-comparison-title">
      <div className={styles.comparisonHeading}>
        <h2 id="sample-comparison-title">Comparativa de equipos</h2>
        <span>{match.home.name} <i>vs.</i> {match.away.name}</span>
      </div>
      {rows.map(({ label, home, away }) => (
        <div className={styles.metricRow} key={label}>
          <div className={styles.metricLabels}><strong>{home}</strong><span>{label}</span><strong>{away}</strong></div>
          <div className={styles.metricBars} aria-hidden="true">
            <span className={styles.homeBar} style={{ width: `${(home / maxValue) * 100}%` }} />
            <span className={styles.awayBar} style={{ width: `${(away / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className={styles.comparisonTeams}><span>{match.home.name}</span><span>{match.away.name}</span></p>
    </section>
  );
}

function OutcomeEstimate() {
  const outcomes = [
    { label: "Local", percentage: match.probabilities.home, crest: match.home.crest },
    { label: "Empate", percentage: match.probabilities.draw },
    { label: "Visitante", percentage: match.probabilities.away, crest: match.away.crest },
  ];

  return (
    <section className={`${styles.widget} ${styles.probabilityWidget}`} aria-labelledby="sample-probability-title">
      <h2 id="sample-probability-title">Probabilidad 1X2</h2>
      <p className={styles.widgetCaption}>Estimación del modelo · muestra ilustrativa</p>
      <div className={styles.outcomes}>
        {outcomes.map(({ label, percentage, crest }) => (
          <div className={styles.outcome} key={label}>
            {crest ? <Image src={crest} alt="" width={25} height={25} unoptimized /> : <span className={styles.drawMark}>X</span>}
            <strong>{percentage}%</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <main className={`landing-page ${styles.page}`}>
      <LandingHeader currentPage="how-it-works" />

      <section className={`landing-hero ${styles.hero}`} aria-labelledby="how-it-works-title">
        <div className="landing-backdrop" aria-hidden="true" />
        <div className={`landing-hero-inner ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <h1 id="how-it-works-title">Entiende el partido <span>antes del pitazo inicial.</span></h1>
            <p className={styles.intro}>GlorIA reúne contexto, estadísticas y estimaciones para ayudarte a leer mejor cada encuentro. Explora los datos, conoce sus límites y saca tus propias conclusiones.</p>
            <div className={`landing-hero-actions ${styles.heroActions}`}>
              <Link className="landing-cta" href="/login?mode=register">Únete a GlorIA <span aria-hidden="true">→</span></Link>
              <Link className="landing-secondary-cta" href="/login">Iniciar sesión</Link>
            </div>
          </div>

          <div className={styles.showcase} aria-label="Vista de ejemplo del análisis">
            <p className={styles.sampleBadge}>Vista de prueba · datos simulados</p>
            <RecentForm />
            <MatchHistory />
            <TeamComparison />
            <OutcomeEstimate />
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.stepsSection} aria-labelledby="steps-title">
          <div className={styles.stepsIntro}>
            <h2 id="steps-title">Así funciona GlorIA</h2>
            <p>Un proceso sencillo para que puedas explorar, analizar y entender mejor cada partido.</p>
          </div>
          <ol className={styles.stepsList}>
            {steps.map((step, index) => (
              <li className={styles.stepCard} key={step.title}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepIcon}><Icon name={step.icon} /></span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.informationSection} aria-labelledby="information-title">
          <div className={styles.sectionHeading}>
            <h2 id="information-title">Qué encontrarás</h2>
            <p>La información en un solo lugar, con el contexto necesario para un análisis más completo.</p>
          </div>
          <div className={styles.informationGrid}>
            {information.map((item) => (
              <Link className={styles.informationCard} href={item.href} key={item.title}>
                <span className={styles.informationIcon}><Icon name={item.icon} /></span>
                <span className={styles.informationCopy}><strong>{item.title}</strong><span>{item.description}</span></span>
                <span className={styles.cardArrow} aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className={styles.responsibleNote} aria-labelledby="responsible-title">
          <span className={styles.noteIcon}><Icon name="database" /></span>
          <div>
            <h2 id="responsible-title">Una lectura responsable</h2>
            <p>Las estimaciones de GlorIA se basan en los datos disponibles y pueden tener muestras limitadas. No garantizan resultados ni reemplazan tu criterio personal. GlorIA ofrece información deportiva con fines estadísticos y de análisis; no recibe ni procesa apuestas.</p>
          </div>
        </aside>

      </div>

      <LandingFooter />
    </main>
  );
}
