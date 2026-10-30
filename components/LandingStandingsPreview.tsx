const teams = [
  ["Arsenal", 29, 21, 5, 3, 67, 25, 42, 68],
  ["Liverpool", 29, 20, 7, 2, 66, 26, 40, 67],
  ["Manchester City", 29, 19, 7, 3, 63, 28, 35, 64],
  ["Aston Villa", 29, 17, 5, 7, 60, 42, 18, 56],
  ["Tottenham", 28, 16, 5, 7, 59, 42, 17, 53],
  ["Manchester United", 29, 15, 3, 11, 41, 40, 1, 48],
  ["West Ham", 29, 12, 8, 9, 46, 50, -4, 44],
  ["Newcastle", 29, 13, 4, 12, 63, 51, 12, 43],
  ["Brighton", 28, 11, 9, 8, 50, 44, 6, 42],
  ["Wolves", 29, 12, 5, 12, 42, 46, -4, 41],
  ["Chelsea", 27, 11, 6, 10, 47, 45, 2, 39],
  ["Fulham", 29, 11, 5, 13, 40, 44, -4, 38],
  ["Bournemouth", 28, 10, 7, 11, 41, 52, -11, 37],
  ["Crystal Palace", 29, 7, 9, 13, 34, 49, -15, 30],
  ["Brentford", 29, 7, 6, 16, 41, 54, -13, 27],
  ["Everton", 29, 8, 8, 13, 30, 41, -11, 26],
  ["Nottingham Forest", 29, 7, 8, 14, 33, 49, -16, 25],
  ["Luton Town", 28, 5, 7, 16, 41, 57, -16, 22],
  ["Burnley", 29, 4, 5, 20, 29, 63, -34, 17],
  ["Sheffield United", 28, 3, 5, 20, 24, 74, -50, 14],
] as const;

export function LandingStandingsPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`landing-standings-preview${compact ? " is-compact" : ""}`}>
      <header className="landing-standings-heading">
        <span><Image src="/competitions/premier-league.svg" alt="" width={21} height={21} /> Premier League</span>
        <b>Datos simulados</b>
      </header>
      <div className="landing-standings-scroll">
        <table>
          <thead><tr><th>Pos.</th><th>Equipo</th><th>PJ</th>{!compact && <><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th></>}<th>DG</th><th>Pts.</th></tr></thead>
          <tbody>{teams.map(([team, played, won, draw, lost, goalsFor, goalsAgainst, difference, points], index) => (
            <tr key={team}>
              <td><span className={index < 4 ? "is-champions" : index >= 17 ? "is-relegation" : ""}>{index + 1}</span></td>
              <th scope="row">{team}</th>
              <td>{played}</td>
              {!compact && <><td>{won}</td><td>{draw}</td><td>{lost}</td><td>{goalsFor}</td><td>{goalsAgainst}</td></>}
              <td>{difference > 0 ? `+${difference}` : difference}</td>
              <td><strong>{points}</strong></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {!compact && <footer><span>Datos de ejemplo, no corresponden a la clasificación actual.</span><Link href="/posiciones?competicion=premier-league">Ver tabla oficial <span aria-hidden="true">→</span></Link></footer>}
    </div>
  );
}
import Image from "next/image";
import Link from "next/link";

