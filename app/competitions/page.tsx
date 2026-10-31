import type { Metadata } from "next";
import { LandingFooter } from "../../components/LandingFooter";
import { LandingHeader } from "../../components/LandingHeader";
import { CompetitionsBrowser } from "./CompetitionsBrowser";
import styles from "./competitions.module.css";

export const metadata: Metadata = {
  title: "Competiciones | GlorIA Futbolera",
  description: "Explora seis competiciones de fútbol, sus clásicos, cobertura de datos y fuentes.",
};

export default function PublicCompetitionsPage() {
  return (
    <main className={`landing-page ${styles.page}`}>
      <LandingHeader currentPage="competitions" />

      <section className={`landing-hero ${styles.hero}`} aria-labelledby="competitions-page-title">
        <div className="landing-backdrop" aria-hidden="true" />
        <div className={`landing-hero-inner ${styles.heroInner}`}>
          <div className={`landing-copy ${styles.heroCopy}`}>
            <p className={styles.heroEyebrow}>Competiciones</p>
            <h1 id="competitions-page-title"><span>Todo el fútbol,</span><span>en un solo lugar.</span></h1>
            <p>Explora las ligas disponibles, consulta sus partidos, clasificaciones y análisis estadístico. Encuentra la competición que te interesa y accede a toda la información en un solo lugar.</p>
          </div>
        </div>
      </section>

      <CompetitionsBrowser />
      <LandingFooter />
    </main>
  );
}
