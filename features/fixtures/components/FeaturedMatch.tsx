import Image from "next/image";
import Link from "next/link";
import type { Match } from "@/data/metadata/demo-matches";

type FeaturedMatchProps = {
  match: Match;
  detailHref: string | null;
};

const competitionLogos: Record<string, string> = {
  "Liga 1 de Perú": "/competitions/liga-1-peru.svg",
  "Serie A de Italia": "/competitions/serie-a.svg",
  "LaLiga de España": "/competitions/laliga.svg",
  "Ligue 1 de Francia": "/competitions/ligue-1.svg",
  "Bundesliga de Alemania": "/competitions/bundesliga.svg",
  "Premier League": "/competitions/premier-league.svg",
  "Champions League": "/competitions/champions-league.svg",
  "Europa League": "/competitions/europa-league.svg",
};

function getMatchNarrative(match: Match) {
  const analysis = match.historicalAnalysis;

  if (!analysis) {
    return "El fixture está disponible, pero aún no existe una muestra local suficiente.";
  }

  const { home, away } = analysis.probabilities;
  const leader = home > away ? match.home : away > home ? match.away : null;

  if (!leader) {
    return "El modelo detecta un partido equilibrado, con poca distancia entre ambos equipos.";
  }

  return `${leader} parte con ventaja estadística, aunque el empate conserva un peso relevante.`;
}

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function FeaturedMatch({ match, detailHref }: FeaturedMatchProps) {
  const analysis = match.historicalAnalysis;
  const competitionLogo = competitionLogos[match.competition];
  const probabilities = [
    { label: "Local", team: match.home, value: match.probabilities.home },
    { label: "Empate", team: "X", value: match.probabilities.draw },
    { label: "Visitante", team: match.away, value: match.probabilities.away },
  ];

  return (
    <section className="featured-match gloria-reveal interactive-card" aria-labelledby="featured-match-title">
      <div className="featured-match-topline">
        <span className="eyebrow">Partido recomendado</span>
        <span className="featured-match-status">{match.status}</span>
      </div>
      <div className="featured-match-heading">
        <div className="featured-match-competition">
          <span className="featured-match-competition-mark">
            {competitionLogo ? <Image src={competitionLogo} alt="" width={28} height={28} unoptimized /> : "◉"}
          </span>
          <span>{match.competition}</span>
        </div>
        <div className="featured-match-date">
          <strong>{match.kickoff}</strong>
          <span>{formatMatchDate(match.date)}</span>
        </div>
      </div>
      <div className="featured-match-main">
        <div className="featured-team">
          <Image className="featured-team-crest" src={match.homeLogo} alt={`Escudo de ${match.home}`} width={76} height={76} onError={(event) => { event.currentTarget.src = "/teams/team-placeholder.svg"; }} />
          <strong>{match.home}</strong>
          <span>Local</span>
        </div>
        <span className="featured-match-vs" aria-hidden="true">VS</span>
        <div className="featured-team">
          <Image className="featured-team-crest away" src={match.awayLogo} alt={`Escudo de ${match.away}`} width={76} height={76} onError={(event) => { event.currentTarget.src = "/teams/team-placeholder.svg"; }} />
          <strong>{match.away}</strong>
          <span>Visitante</span>
        </div>
      </div>
      <div className="featured-match-reading">
        <span className="eyebrow">Lectura de GlorIA</span>
        <p>{analysis ? getMatchNarrative(match) : "El modelo aún no fuerza una lectura."}</p>
      </div>
      <div className="featured-match-bottom">
        <div className="featured-probabilities" aria-label="Probabilidades del partido">
          {probabilities.map((probability) => (
            <div className="featured-probability" key={probability.label}>
              <span>{probability.label}</span>
              <strong>{probability.value}%</strong>
              <small>{probability.team}</small>
              <i><b style={{ width: `${probability.value}%` }} /></i>
            </div>
          ))}
        </div>
        {detailHref ? <Link className="featured-match-cta" href={detailHref}>Abrir dossier del partido <span aria-hidden="true">→</span></Link> : <span className="featured-match-unavailable">Dossier local no disponible</span>}
      </div>
    </section>
  );
}
