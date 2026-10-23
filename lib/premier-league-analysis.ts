import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveTeamIdentity } from "./team-identity";

type HistoricalMatch = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
};

export type CurrentSeasonResult = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
};

export type PremierLeagueHistoricalAnalysis = {
  source: "historical-5-seasons";
  homeSample: number;
  awaySample: number;
  probabilities: { home: number; draw: number; away: number };
  expectedGoals: { home: number; away: number; total: number };
  expectedCorners: { total: number };
  expectedShotsOnTarget: { home: number; away: number };
  bttsProbability: number;
  over25Probability: number;
  usingLeagueBaseline: boolean;
  currentSeasonHomeSample: number;
  currentSeasonAwaySample: number;
};

let matchesCache: HistoricalMatch[] | undefined;

function canonicalTeamName(name: string, historicalTeams: Set<string>) {
  return resolveTeamIdentity("Premier League", name, historicalTeams).canonicalName;
}

async function getHistoricalMatches() {
  if (matchesCache) return matchesCache;
  const source = await readFile(path.join(process.cwd(), "data", "processed", "premier-league-matches.json"), "utf8");
  matchesCache = JSON.parse(source) as HistoricalMatch[];
  return matchesCache;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function blend(historical: number, current: number, currentMatches: number) {
  // Current form grows to a maximum 35% of the estimate after ten matches.
  const currentWeight = Math.min(0.35, (currentMatches / 10) * 0.35);
  return historical * (1 - currentWeight) + current * currentWeight;
}

function percent(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function poisson(k: number, lambda: number) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return (Math.exp(-lambda) * lambda ** k) / factorial;
}

function outcomeProbabilities(homeGoals: number, awayGoals: number) {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let homeScore = 0; homeScore <= 8; homeScore += 1) {
    for (let awayScore = 0; awayScore <= 8; awayScore += 1) {
      const probability = poisson(homeScore, homeGoals) * poisson(awayScore, awayGoals);
      if (homeScore > awayScore) home += probability;
      else if (homeScore === awayScore) draw += probability;
      else away += probability;
    }
  }
  const total = home + draw + away;
  return { home: percent(home / total), draw: percent(draw / total), away: percent(away / total) };
}

/**
 * Generates an intentionally conservative estimate from the five local completed seasons.
 * It never calls an external API. Promoted clubs without sufficient history receive
 * a clearly marked league-average baseline with lower confidence in the UI.
 */
export async function getPremierLeagueHistoricalAnalysis(
  homeName: string,
  awayName: string,
  currentSeasonResults: CurrentSeasonResult[] = [],
): Promise<PremierLeagueHistoricalAnalysis | null> {
  const matches = await getHistoricalMatches();
  const historicalTeams = new Set(matches.flatMap((match) => [match.homeTeam, match.awayTeam]));
  const homeTeam = canonicalTeamName(homeName, historicalTeams);
  const awayTeam = canonicalTeamName(awayName, historicalTeams);
  const homeMatches = matches.filter((match) => match.homeTeam === homeTeam);
  const awayMatches = matches.filter((match) => match.awayTeam === awayTeam);

  const usingLeagueBaseline = homeMatches.length < 8 || awayMatches.length < 8;
  const homeHistory = homeMatches.length >= 8 ? homeMatches : matches;
  const awayHistory = awayMatches.length >= 8 ? awayMatches : matches;

  const historicalHomeGoals = average([
    average(homeHistory.map((match) => match.homeGoals)),
    average(awayHistory.map((match) => match.homeGoals)),
  ]);
  const historicalAwayGoals = average([
    average(awayHistory.map((match) => match.awayGoals)),
    average(homeHistory.map((match) => match.awayGoals)),
  ]);
  const currentHomeMatches = currentSeasonResults.filter((match) => canonicalTeamName(match.homeTeam, historicalTeams) === homeTeam);
  const currentAwayMatches = currentSeasonResults.filter((match) => canonicalTeamName(match.awayTeam, historicalTeams) === awayTeam);
  const currentSample = Math.min(currentHomeMatches.length, currentAwayMatches.length);
  const expectedHomeGoals = currentSample > 0
    ? blend(historicalHomeGoals, average([
        average(currentHomeMatches.map((match) => match.homeGoals)),
        average(currentAwayMatches.map((match) => match.homeGoals)),
      ]), currentSample)
    : historicalHomeGoals;
  const expectedAwayGoals = currentSample > 0
    ? blend(historicalAwayGoals, average([
        average(currentAwayMatches.map((match) => match.awayGoals)),
        average(currentHomeMatches.map((match) => match.awayGoals)),
      ]), currentSample)
    : historicalAwayGoals;
  const totalGoals = expectedHomeGoals + expectedAwayGoals;
  const bttsProbability = (1 - Math.exp(-expectedHomeGoals)) * (1 - Math.exp(-expectedAwayGoals));
  const over25Probability = 1 - poisson(0, totalGoals) - poisson(1, totalGoals) - poisson(2, totalGoals);

  return {
    source: "historical-5-seasons",
    homeSample: homeMatches.length,
    awaySample: awayMatches.length,
    probabilities: outcomeProbabilities(expectedHomeGoals, expectedAwayGoals),
    expectedGoals: { home: round(expectedHomeGoals), away: round(expectedAwayGoals), total: round(totalGoals) },
    expectedCorners: { total: round(average(homeHistory.map((match) => match.homeCorners)) + average(awayHistory.map((match) => match.awayCorners))) },
    expectedShotsOnTarget: {
      home: round(average(homeHistory.map((match) => match.homeShotsOnTarget))),
      away: round(average(awayHistory.map((match) => match.awayShotsOnTarget))),
    },
    bttsProbability: percent(bttsProbability),
    over25Probability: percent(over25Probability),
    usingLeagueBaseline,
    currentSeasonHomeSample: currentHomeMatches.length,
    currentSeasonAwaySample: currentAwayMatches.length,
  };
}
