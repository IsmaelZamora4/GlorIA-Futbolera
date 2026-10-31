import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SportiaSidebar } from "@/components/layout/SportiaSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";

const competitions = [
  { id: "premier-league", name: "Premier League", country: "Inglaterra", logo: "/competitions/premier-league.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "laliga", name: "LaLiga", country: "España", logo: "/competitions/laliga.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "serie-a", name: "Serie A", country: "Italia", logo: "/competitions/serie-a.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "bundesliga", name: "Bundesliga", country: "Alemania", logo: "/competitions/bundesliga.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "ligue-1", name: "Ligue 1", country: "Francia", logo: "/competitions/ligue-1.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "liga-1-peru", name: "Liga 1", country: "Perú", logo: "/competitions/liga-1-peru.svg", source: "TheSportsDB", coverage: "Partidos" },
  { id: "champions-league", name: "Champions League", country: "Europa", logo: "/competitions/champions-league.svg", source: "football-data.org", coverage: "Partidos y tabla" },
  { id: "europa-league", name: "Europa League", country: "Europa", logo: "/competitions/europa-league.svg", source: "TheSportsDB", coverage: "Partidos" },
] as const;

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ competicion?: string }> }) {
  const params = await searchParams;
  const selected = competitions.find((item) => item.id === params.competicion);
  if (selected?.coverage.includes("tabla")) redirect(`/home/posiciones?competicion=${selected.id}`);

  return (
    <div className="app-shell competitions-shell">
      <SportiaSidebar active="Competiciones" />
      <main className="main-area competitions-main">
        <SportiaPageHeader title="Competiciones" description="Explora las ligas y torneos disponibles." />

        <div className="competitions-page">
          <section className="competitions-intro" aria-labelledby="competitions-title">
            <div className="competitions-intro-copy">
              <h2 id="competitions-title">Catálogo de competiciones</h2>
              <p>Consulta partidos, tablas y fuentes desde la ficha de cada liga o torneo.</p>
            </div>
            <aside className="competitions-cache-note" aria-label="Información sobre actualización de datos">
              <div className="competitions-cache-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
              <div><strong>Caché de datos</strong><p>Las consultas se reutilizan durante 6 horas para reducir solicitudes a las fuentes.</p></div>
            </aside>
          </section>

          <section className="competition-summary" aria-label="Resumen del catálogo">
            <div className="competition-summary-item"><strong>{competitions.length}</strong><span>competiciones</span></div>
            <div className="competition-summary-item"><strong>{new Set(competitions.map((item) => item.source)).size}</strong><span>fuentes</span></div>
            <div className="competition-summary-item competition-summary-note"><span className="competition-status-mark" /><span>Los datos se consultan al abrir partidos o tablas.</span></div>
          </section>

          <section className="competition-catalog" aria-label="Catálogo de competiciones">
            {competitions.map((item) => {
              const hasStandings = item.coverage.includes("tabla");
              return (
                <article className={`competition-card ${selected?.id === item.id ? "selected" : ""}`} data-competition={item.id} key={item.id}>
                  <div className="competition-card-top">
                    <div className="competition-logo-wrap"><Image src={item.logo} alt={`Logo de ${item.name}`} width={48} height={48} /></div>
                    <div className="competition-card-copy"><span className="competition-country">{item.country}</span><h3>{item.name}</h3><p>{item.coverage}</p></div>
                    <span className="competition-live-dot" aria-label="Competición configurada" />
                  </div>
                  <div className="competition-card-meta"><span><i aria-hidden="true" />{item.source}</span><span>Datos en caché · 6 h</span></div>
                  <div className="competition-card-actions">
                    <Link href={`/home/partidos?competicion=${encodeURIComponent(item.name)}`}>Ver partidos <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m-4-4 4 4-4 4" /></svg></Link>
                    {hasStandings ? <Link href={`/home/competiciones?competicion=${item.id}`}>Ver tabla <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M5 11 11 5M5 5h6v6" /></svg></Link> : <span className="unavailable-action" aria-disabled="true">Tabla no disponible</span>}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="competition-method">
            <h2>Consultas bajo demanda</h2>
            <p>El catálogo se muestra sin consultar las APIs. Los partidos y las tablas se solicitan solo cuando eliges una competición y se reutilizan desde caché durante seis horas.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
