"use client";

import Image from "next/image";

const fixtures = [
  { home: "Manchester City", away: "Manchester United", homeCrest: "https://crests.football-data.org/65.png", awayCrest: "https://crests.football-data.org/66.png" },
  { home: "Real Madrid", away: "Barcelona", homeCrest: "https://crests.football-data.org/86.png", awayCrest: "https://crests.football-data.org/81.png" },
] as const;

export function LandingFixturesPreview() {
  return (
    <div className="landing-fixtures-preview" aria-label="Vista de prueba de la agenda de partidos con datos simulados">
      <header className="landing-fixtures-heading"><b>PARTIDOS</b><small>DATOS SIMULADOS</small></header>
      <div className="landing-fixtures-dates"><button type="button" aria-pressed="true">Hoy</button></div>
      <div className="landing-fixtures-list" aria-live="polite">
        {fixtures.map((fixture) => <div className="landing-fixture-row" key={fixture.home}>
          <span className="landing-fixture-team"><Image src={fixture.homeCrest} alt="" width={15} height={15} unoptimized />{fixture.home}</span>
          <b>vs</b>
          <span className="landing-fixture-team"><Image src={fixture.awayCrest} alt="" width={15} height={15} unoptimized />{fixture.away}</span>
        </div>)}
      </div>
      <div className="landing-fixtures-footer"><span>2 partidos</span><span>Agenda de ejemplo</span></div>
    </div>
  );
}
