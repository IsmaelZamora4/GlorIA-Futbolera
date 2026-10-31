import Link from "next/link";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";
import { SportiaSidebar } from "@/components/layout/SportiaSidebar";
import { datasetInfoByCompetition } from "@/data/metadata/datasets";

const datasets = Object.values(datasetInfoByCompetition);
const historicalLeagues = datasets.filter(({ status }) => status === "historical").length;
const datasetSeasons = new Set(datasets.flatMap(({ seasons }) => seasons)).size;
const historicalMarkets = new Set(datasets.flatMap(({ markets }) => markets)).size;

export default function DataPage() {
  return (
    <div className="app-shell competitions-shell">
      <SportiaSidebar active="Datos" />
      <main className="main-area competitions-main">
        <SportiaPageHeader title="Datos" description="Cobertura de datasets y métricas disponibles en GlorIA Futbolera." />
        <div className="competitions-page">
          <section className="competition-summary" aria-label="Cobertura de datos">
            <div className="competition-summary-item"><strong>{historicalLeagues}</strong><span>Ligas con dataset histórico</span></div>
            <div className="competition-summary-item"><strong>{datasetSeasons}</strong><span>Temporadas documentadas</span></div>
            <div className="competition-summary-item"><strong>{historicalMarkets}</strong><span>Métricas del modelo</span></div>
          </section>
          <section className="competition-method">
            <div>
              <div className="competitions-overline">Fuentes y cobertura</div>
              <h2>Consulta el alcance de los datos</h2>
            </div>
            <p>La disponibilidad varía por competición y temporada. Revisa las fuentes, el corte temporal y los límites antes de interpretar una estimación.</p>
            <Link className="match-detail-header-link primary" href="/home/metodología">Ver metodología</Link>
          </section>
        </div>
      </main>
    </div>
  );
}
