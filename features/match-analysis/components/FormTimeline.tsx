import Image from "next/image";
import { getKnownTeamCrest } from "@/data/metadata/team-crests";
import type { RecentFormMatch } from "@/features/match-analysis/services/match-detail";

type FormTimelineProps = {
  matches: RecentFormMatch[];
  fixtureDate: string;
};

function formatTimelineDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function outcomeLabel(outcome: RecentFormMatch["outcome"]) {
  return outcome === "W" ? "G" : outcome === "D" ? "E" : "P";
}

function OpponentMark({ opponent }: { opponent: string }) {
  const crest = getKnownTeamCrest(opponent);
  return (
    <span className="form-timeline-crest">
      {crest ? <Image src={crest} alt={`Escudo de ${opponent}`} width={24} height={24} /> : <span aria-hidden="true">{opponent.slice(0, 2).toUpperCase()}</span>}
    </span>
  );
}

export function FormTimeline({ matches, fixtureDate }: FormTimelineProps) {
  const preFixtureMatches = matches.filter((match) => match.date < fixtureDate);

  return (
    <ol className="form-timeline" aria-label="Línea de forma reciente">
      {preFixtureMatches.map((match) => (
        <li className={`form-timeline-item is-${match.outcome}`} key={match.id}>
          <time dateTime={match.date}>{formatTimelineDate(match.date)}</time>
          <div className="form-timeline-content">
            <span className="form-timeline-marker" aria-label={`Resultado ${outcomeLabel(match.outcome)}`}>{outcomeLabel(match.outcome)}</span>
            <span className="form-timeline-venue">{match.venue === "home" ? "vs" : "@"}</span>
            <OpponentMark opponent={match.opponent} />
            <strong>{match.opponent}</strong>
            <b>{match.goalsFor}–{match.goalsAgainst}</b>
          </div>
        </li>
      ))}
    </ol>
  );
}
