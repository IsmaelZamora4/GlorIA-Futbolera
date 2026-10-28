import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveTeamIdentity, type TeamIdentitySource } from "./team-identity";
import { calibrateProbability, calibrateResultProbabilities } from "./calibration";

type LocalMatch = {
  season: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  status: "FINISHED" | "SCHEDULED";
  homeGoals: number | null;
  awayGoals: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
};

type LocalDataset = {
  historical: LocalMatch[];
  current: LocalMatch[];
};

export type LocalAnalysisCompetition =
  | "Bundesliga de Alemania"
  | "LaLiga de España"
  | "Ligue 1 de Francia"
  | "Premier League"
  | "Serie A de Italia";

type AnalysisConfig = {
  slug: string;
  identityCompetition: "Bundesliga" | "LaLiga" | "Ligue 1" | "Premier League" | "Serie A";
};

const configurations: Record<LocalAnalysisCompetition, AnalysisConfig> = {
  "Bundesliga de Alemania": { slug: "bundesliga", identityCompetition: "Bundesliga" },
  "LaLiga de España": { slug: "la-liga", identityCompetition: "LaLiga" },
  "Ligue 1 de Francia": { slug: "ligue-1", identityCompetition: "Ligue 1" },
  "Premier League": { slug: "premier-league", identityCompetition: "Premier League" },
  "Serie A de Italia": { slug: "serie-a", identityCompetition: "Serie A" },
};

const dataCache = new Map<string, Promise<LocalDataset>>();
const priorMatches = 8;
const maximumCurrentSeasonWeight = 0.35;
const currentSeasonWeightAtMatches = 10;

export type DerivedMarkets = {
  /** All lines are derived from the same pre-match distribution, not separate tips. */
  goals: {
    over15: number;
    over25: number;
    over35: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  corners: {
    over55: number;
    over65: number;
    over75: number;
    over85: number;
    over95: number;
    over105: number;
    over115: number;
    over125: number;
  };
  shotsOnTarget: {
    homeOver25: number;
    awayOver25: number;
    totalOver75: number;
  };
};

export type LocalLeagueAnalysis = {
  source: "local-5-seasons-plus-current";
  usingLeagueBaseline: boolean;
  probabilities: { home: number; draw: number; away: number };
  homeSample: number;
  awaySample: number;
  currentSeasonHomeSample: number;
  currentSeasonAwaySample: number;
  expectedGoals: { home: number; away: number; total: number };
  over25Probability: number;
  bttsProbability: number;
  expectedCorners: { home: number; away: number; total: number };
  expectedShotsOnTarget: { home: number; away: number };
  leagueBenchmarks: {
    goalsPerMatch: number | null;
    cornersPerMatch: number | null;
    shotsOnTargetPerMatch: number | null;
    goalsOver15: number | null;
    goalsOver25: number | null;
    bttsYes: number | null;
  };
  markets: DerivedMarkets;
  teamIdentity: {
    home: TeamIdentitySource;
    away: TeamIdentitySource;
  };
  calibration: {
    applied: boolean;
    method: "walk-forward-monotonic-bins";
  };
};

function isLocalAnalysisCompetition(competition: string): competition is LocalAnalysisCompetition {
  return competition in configurations;
}

export function supportsLocalLeagueAnalysis(competition: string) {
  return isLocalAnalysisCompetition(competition);
}

async function getDataset(config: AnalysisConfig) {
  const cached = dataCache.get(config.slug);
  if (cached) return cached;

  const load = Promise.all([
    readFile(path.join(process.cwd(), "data", "processed", config.slug, "historical-matches.json"), "utf8"),
    readFile(path.join(process.cwd(), "data", "processed", config.slug, "current-season-matches.json"), "utf8"),
  ]).then(([historical, current]) => ({
    historical: JSON.parse(historical) as LocalMatch[],
    current: JSON.parse(current) as LocalMatch[],
  }));
  dataCache.set(config.slug, load);
  return load;
}

function average(values: Array<number | null>) {
  const available = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!available.length) return null;
  return available.reduce((total, value) => total + value, 0) / available.length;
}

function percentOf(matches: LocalMatch[], predicate: (match: LocalMatch) => boolean | null) {
  const eligible = matches.filter((match) => predicate(match) != null);
  if (!eligible.length) return null;
  return Math.round((eligible.filter((match) => predicate(match) === true).length / eligible.length) * 100);
}

function getLeagueBenchmarks(matches: LocalMatch[]) {
  const totalGoals = (match: LocalMatch) => match.homeGoals == null || match.awayGoals == null ? null : match.homeGoals + match.awayGoals;
  const totalCorners = (match: LocalMatch) => match.homeCorners == null || match.awayCorners == null ? null : match.homeCorners + match.awayCorners;
  const totalShotsOnTarget = (match: LocalMatch) => match.homeShotsOnTarget == null || match.awayShotsOnTarget == null ? null : match.homeShotsOnTarget + match.awayShotsOnTarget;

  return {
    goalsPerMatch: average(matches.map(totalGoals)),
    cornersPerMatch: average(matches.map(totalCorners)),
    shotsOnTargetPerMatch: average(matches.map(totalShotsOnTarget)),
    goalsOver15: percentOf(matches, (match) => {
      const total = totalGoals(match);
      return total == null ? null : total > 1.5;
    }),
    goalsOver25: percentOf(matches, (match) => {
      const total = totalGoals(match);
      return total == null ? null : total > 2.5;
    }),
    bttsYes: percentOf(matches, (match) => match.homeGoals == null || match.awayGoals == null ? null : match.homeGoals > 0 && match.awayGoals > 0),
  };
}

function smoothedAverage(values: Array<number | null>, leagueAverage: number) {
  const available = values.filter((value): value is number => value != null && Number.isFinite(value));
  const total = available.reduce((sum, value) => sum + value, 0);
  return (total + leagueAverage * priorMatches) / (available.length + priorMatches);
}

function blendHistoricalAndCurrent(historical: number, current: number, currentMatches: number) {
  const weight = Math.min(
    maximumCurrentSeasonWeight,
    (Math.min(currentMatches, currentSeasonWeightAtMatches) / currentSeasonWeightAtMatches) * maximumCurrentSeasonWeight,
  );
  return historical * (1 - weight) + current * weight;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function percent(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function percentageDistribution(probabilities: { home: number; draw: number; away: number }) {
  const home = percent(probabilities.home);
  const draw = percent(probabilities.draw);
  return { home, draw, away: Math.max(0, 100 - home - draw) };
}

function poisson(k: number, lambda: number) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return (Math.exp(-lambda) * lambda ** k) / factorial;
}

/** Probability of exceeding a half-goal/half-event line under a Poisson model. */
function overLineProbability(lambda: number, line: number) {
  const highestIncluded = Math.floor(line);
  let probabilityAtOrBelowLine = 0;
  for (let value = 0; value <= highestIncluded; value += 1) {
    probabilityAtOrBelowLine += poisson(value, lambda);
  }
  return percent(1 - probabilityAtOrBelowLine);
}

function outcomeProbabilities(homeGoals: number, awayGoals: number) {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let homeScore = 0; homeScore <= 9; homeScore += 1) {
    for (let awayScore = 0; awayScore <= 9; awayScore += 1) {
      const probability = poisson(homeScore, homeGoals) * poisson(awayScore, awayGoals);
      if (homeScore > awayScore) home += probability;
      else if (homeScore === awayScore) draw += probability;
      else away += probability;
    }
  }
  const total = home + draw + away;
  return { home: percent(home / total), draw: percent(draw / total), away: percent(away / total) };
}

type MetricKey =
  | "homeGoals"
  | "awayGoals"
  | "homeShotsOnTarget"
  | "awayShotsOnTarget"
  | "homeCorners"
  | "awayCorners";

function expectedHomeSideMetric(
  matches: LocalMatch[],
  homeTeam: string,
  awayTeam: string,
  homeFor: MetricKey,
  awayConceded: MetricKey,
) {
  const leagueMean = average(matches.map((match) => match[homeFor])) ?? 1;
  const homeMatches = matches.filter((match) => match.homeTeam === homeTeam);
  const awayMatches = matches.filter((match) => match.awayTeam === awayTeam);
  const homeAttack = smoothedAverage(homeMatches.map((match) => match[homeFor]), leagueMean) / leagueMean;
  const awayDefence = smoothedAverage(awayMatches.map((match) => match[awayConceded]), leagueMean) / leagueMean;
  return leagueMean * Math.sqrt(homeAttack * awayDefence);
}

function expectedAwaySideMetric(
  matches: LocalMatch[],
  awayTeam: string,
  homeTeam: string,
  awayFor: MetricKey,
  homeConceded: MetricKey,
) {
  const leagueMean = average(matches.map((match) => match[awayFor])) ?? 1;
  const awayMatches = matches.filter((match) => match.awayTeam === awayTeam);
  const homeMatches = matches.filter((match) => match.homeTeam === homeTeam);
  const awayAttack = smoothedAverage(awayMatches.map((match) => match[awayFor]), leagueMean) / leagueMean;
  const homeDefence = smoothedAverage(homeMatches.map((match) => match[homeConceded]), leagueMean) / leagueMean;
  return leagueMean * Math.sqrt(awayAttack * homeDefence);
}

function getTeamHomeMatches(matches: LocalMatch[], team: string) {
  return matches.filter((match) => match.homeTeam === team);
}

function getTeamAwayMatches(matches: LocalMatch[], team: string) {
  return matches.filter((match) => match.awayTeam === team);
}

/**
 * Generates a conservative pre-match estimate from local CSV data only.
 * Current-season rows are included only when they happened before fixtureDate,
 * so the function cannot use a later result to predict an earlier match.
 */
export async function getLocalLeagueAnalysis(
  competition: string,
  homeName: string,
  awayName: string,
  fixtureDate: string,
): Promise<LocalLeagueAnalysis | null> {
  if (!isLocalAnalysisCompetition(competition)) return null;

  const config = configurations[competition];
  const dataset = await getDataset(config);
  const historicalTeams = new Set(dataset.historical.flatMap((match) => [match.homeTeam, match.awayTeam]));
  const homeIdentity = resolveTeamIdentity(config.identityCompetition, homeName, historicalTeams);
  const awayIdentity = resolveTeamIdentity(config.identityCompetition, awayName, historicalTeams);
  const homeTeam = homeIdentity.canonicalName;
  const awayTeam = awayIdentity.canonicalName;
  const historicalHomeMatches = getTeamHomeMatches(dataset.historical, homeTeam);
  const historicalAwayMatches = getTeamAwayMatches(dataset.historical, awayTeam);
  const currentMatches = dataset.current.filter((match) => match.status === "FINISHED" && match.date < fixtureDate);
  const currentHomeMatches = getTeamHomeMatches(currentMatches, homeTeam);
  const currentAwayMatches = getTeamAwayMatches(currentMatches, awayTeam);

  const historicalHomeGoals = expectedHomeSideMetric(dataset.historical, homeTeam, awayTeam, "homeGoals", "homeGoals");
  const historicalAwayGoals = expectedAwaySideMetric(dataset.historical, awayTeam, homeTeam, "awayGoals", "awayGoals");
  const historicalHomeCorners = expectedHomeSideMetric(dataset.historical, homeTeam, awayTeam, "homeCorners", "homeCorners");
  const historicalAwayCorners = expectedAwaySideMetric(dataset.historical, awayTeam, homeTeam, "awayCorners", "awayCorners");
  const historicalHomeShots = expectedHomeSideMetric(dataset.historical, homeTeam, awayTeam, "homeShotsOnTarget", "homeShotsOnTarget");
  const historicalAwayShots = expectedAwaySideMetric(dataset.historical, awayTeam, homeTeam, "awayShotsOnTarget", "awayShotsOnTarget");
  const currentSample = Math.min(currentHomeMatches.length, currentAwayMatches.length);

  const currentHomeGoals = currentMatches.length
    ? expectedHomeSideMetric(currentMatches, homeTeam, awayTeam, "homeGoals", "homeGoals")
    : historicalHomeGoals;
  const currentAwayGoals = currentMatches.length
    ? expectedAwaySideMetric(currentMatches, awayTeam, homeTeam, "awayGoals", "awayGoals")
    : historicalAwayGoals;
  const currentHomeCorners = currentMatches.length
    ? expectedHomeSideMetric(currentMatches, homeTeam, awayTeam, "homeCorners", "homeCorners")
    : historicalHomeCorners;
  const currentAwayCorners = currentMatches.length
    ? expectedAwaySideMetric(currentMatches, awayTeam, homeTeam, "awayCorners", "awayCorners")
    : historicalAwayCorners;
  const currentHomeShots = currentMatches.length
    ? expectedHomeSideMetric(currentMatches, homeTeam, awayTeam, "homeShotsOnTarget", "homeShotsOnTarget")
    : historicalHomeShots;
  const currentAwayShots = currentMatches.length
    ? expectedAwaySideMetric(currentMatches, awayTeam, homeTeam, "awayShotsOnTarget", "awayShotsOnTarget")
    : historicalAwayShots;

  const expectedHomeGoals = blendHistoricalAndCurrent(historicalHomeGoals, currentHomeGoals, currentSample);
  const expectedAwayGoals = blendHistoricalAndCurrent(historicalAwayGoals, currentAwayGoals, currentSample);
  const expectedHomeCorners = blendHistoricalAndCurrent(historicalHomeCorners, currentHomeCorners, currentSample);
  const expectedAwayCorners = blendHistoricalAndCurrent(historicalAwayCorners, currentAwayCorners, currentSample);
  const expectedHomeShots = blendHistoricalAndCurrent(historicalHomeShots, currentHomeShots, currentSample);
  const expectedAwayShots = blendHistoricalAndCurrent(historicalAwayShots, currentAwayShots, currentSample);
  const totalGoals = expectedHomeGoals + expectedAwayGoals;
  const totalCorners = expectedHomeCorners + expectedAwayCorners;
  const totalShots = expectedHomeShots + expectedAwayShots;
  const leagueBenchmarks = getLeagueBenchmarks([...dataset.historical, ...currentMatches]);
  const bttsYes = percent((1 - Math.exp(-expectedHomeGoals)) * (1 - Math.exp(-expectedAwayGoals)));
  const rawResultProbabilities = outcomeProbabilities(expectedHomeGoals, expectedAwayGoals);
  const rawGoalsOver25 = overLineProbability(totalGoals, 2.5);
  const rawCornersOver85 = overLineProbability(totalCorners, 8.5);
  const rawShotsTotalOver75 = overLineProbability(totalShots, 7.5);
  const [calibratedResult, calibratedGoalsOver25, calibratedBttsYes, calibratedCornersOver85, calibratedShotsTotalOver75] = await Promise.all([
    calibrateResultProbabilities(config.slug, {
      home: rawResultProbabilities.home / 100,
      draw: rawResultProbabilities.draw / 100,
      away: rawResultProbabilities.away / 100,
    }),
    calibrateProbability(config.slug, "goalsOver25", rawGoalsOver25 / 100),
    calibrateProbability(config.slug, "bttsYes", bttsYes / 100),
    calibrateProbability(config.slug, "cornersOver85", rawCornersOver85 / 100),
    calibrateProbability(config.slug, "shotsTotalOver75", rawShotsTotalOver75 / 100),
  ]);
  const calibratedGoalsOver25Percent = percent(calibratedGoalsOver25);
  const calibratedBttsYesPercent = percent(calibratedBttsYes);
  const calibratedCornersOver85Percent = percent(calibratedCornersOver85);
  const calibratedShotsTotalOver75Percent = percent(calibratedShotsTotalOver75);

  return {
    source: "local-5-seasons-plus-current",
    usingLeagueBaseline: historicalHomeMatches.length < priorMatches || historicalAwayMatches.length < priorMatches,
    probabilities: percentageDistribution(calibratedResult),
    homeSample: historicalHomeMatches.length,
    awaySample: historicalAwayMatches.length,
    currentSeasonHomeSample: currentHomeMatches.length,
    currentSeasonAwaySample: currentAwayMatches.length,
    expectedGoals: {
      home: round(expectedHomeGoals),
      away: round(expectedAwayGoals),
      total: round(totalGoals),
    },
    over25Probability: calibratedGoalsOver25Percent,
    bttsProbability: calibratedBttsYesPercent,
    expectedCorners: {
      home: round(expectedHomeCorners),
      away: round(expectedAwayCorners),
      total: round(totalCorners),
    },
    expectedShotsOnTarget: {
      home: round(expectedHomeShots),
      away: round(expectedAwayShots),
    },
    leagueBenchmarks: {
      goalsPerMatch: leagueBenchmarks.goalsPerMatch == null ? null : round(leagueBenchmarks.goalsPerMatch),
      cornersPerMatch: leagueBenchmarks.cornersPerMatch == null ? null : round(leagueBenchmarks.cornersPerMatch),
      shotsOnTargetPerMatch: leagueBenchmarks.shotsOnTargetPerMatch == null ? null : round(leagueBenchmarks.shotsOnTargetPerMatch),
      goalsOver15: leagueBenchmarks.goalsOver15,
      goalsOver25: leagueBenchmarks.goalsOver25,
      bttsYes: leagueBenchmarks.bttsYes,
    },
    markets: {
      goals: {
        // The calibration is trained on O2.5. Preserve the mathematical order
        // of the neighbouring lines instead of pretending they were calibrated.
        over15: Math.max(overLineProbability(totalGoals, 1.5), calibratedGoalsOver25Percent),
        over25: calibratedGoalsOver25Percent,
        over35: Math.min(overLineProbability(totalGoals, 3.5), calibratedGoalsOver25Percent),
      },
      btts: { yes: calibratedBttsYesPercent, no: 100 - calibratedBttsYesPercent },
      // Corners and shots use the same count-distribution approximation. Their
      // calibration is assessed separately in the backtesting step.
      corners: {
        over55: Math.max(overLineProbability(totalCorners, 5.5), calibratedCornersOver85Percent),
        over65: Math.max(overLineProbability(totalCorners, 6.5), calibratedCornersOver85Percent),
        over75: Math.max(overLineProbability(totalCorners, 7.5), calibratedCornersOver85Percent),
        over85: calibratedCornersOver85Percent,
        over95: Math.min(overLineProbability(totalCorners, 9.5), calibratedCornersOver85Percent),
        over105: Math.min(overLineProbability(totalCorners, 10.5), calibratedCornersOver85Percent),
        over115: Math.min(overLineProbability(totalCorners, 11.5), calibratedCornersOver85Percent),
        over125: Math.min(overLineProbability(totalCorners, 12.5), calibratedCornersOver85Percent),
      },
      shotsOnTarget: {
        homeOver25: overLineProbability(expectedHomeShots, 2.5),
        awayOver25: overLineProbability(expectedAwayShots, 2.5),
        totalOver75: calibratedShotsTotalOver75Percent,
      },
    },
    teamIdentity: {
      home: homeIdentity.source,
      away: awayIdentity.source,
    },
    calibration: {
      applied: true,
      method: "walk-forward-monotonic-bins",
    },
  };
}
