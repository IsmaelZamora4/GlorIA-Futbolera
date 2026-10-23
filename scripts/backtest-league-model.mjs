import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const processedRoot = join(process.cwd(), "data", "processed");
const outputPath = join(processedRoot, "backtest-report.json");
const calibrationOutputPath = join(processedRoot, "calibration-model.json");
const leagues = [
  { slug: "bundesliga", competition: "Bundesliga" },
  { slug: "la-liga", competition: "LaLiga" },
  { slug: "ligue-1", competition: "Ligue 1" },
  { slug: "premier-league", competition: "Premier League" },
  { slug: "serie-a", competition: "Serie A" },
];

const priorMatches = 8;
const warmupMatches = 150;
const calibrationPriorStrength = 20;

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function available(values) {
  return values.filter((value) => Number.isFinite(value));
}

function smoothedAverage(values, leagueAverage) {
  const usable = available(values);
  return (usable.reduce((total, value) => total + value, 0) + leagueAverage * priorMatches) / (usable.length + priorMatches);
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return Math.exp(-lambda) * lambda ** k / factorial;
}

function overLineProbability(lambda, line) {
  let atOrBelow = 0;
  for (let value = 0; value <= Math.floor(line); value += 1) atOrBelow += poisson(value, lambda);
  return Math.max(0, Math.min(1, 1 - atOrBelow));
}

function outcomeProbabilities(homeGoals, awayGoals) {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let homeScore = 0; homeScore <= 9; homeScore += 1) {
    for (let awayScore = 0; awayScore <= 9; awayScore += 1) {
      const chance = poisson(homeScore, homeGoals) * poisson(awayScore, awayGoals);
      if (homeScore > awayScore) home += chance;
      else if (homeScore === awayScore) draw += chance;
      else away += chance;
    }
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

function expectedHomeMetric(training, homeTeam, awayTeam, homeFor, awayConceded) {
  const leagueMean = average(available(training.map((match) => match[homeFor]))) ?? 1;
  const homeMatches = training.filter((match) => match.homeTeam === homeTeam);
  const awayMatches = training.filter((match) => match.awayTeam === awayTeam);
  const homeAttack = smoothedAverage(homeMatches.map((match) => match[homeFor]), leagueMean) / leagueMean;
  const awayDefence = smoothedAverage(awayMatches.map((match) => match[awayConceded]), leagueMean) / leagueMean;
  return leagueMean * Math.sqrt(homeAttack * awayDefence);
}

function expectedAwayMetric(training, awayTeam, homeTeam, awayFor, homeConceded) {
  const leagueMean = average(available(training.map((match) => match[awayFor]))) ?? 1;
  const awayMatches = training.filter((match) => match.awayTeam === awayTeam);
  const homeMatches = training.filter((match) => match.homeTeam === homeTeam);
  const awayAttack = smoothedAverage(awayMatches.map((match) => match[awayFor]), leagueMean) / leagueMean;
  const homeDefence = smoothedAverage(homeMatches.map((match) => match[homeConceded]), leagueMean) / leagueMean;
  return leagueMean * Math.sqrt(awayAttack * homeDefence);
}

function predict(match, training) {
  const homeGoals = expectedHomeMetric(training, match.homeTeam, match.awayTeam, "homeGoals", "homeGoals");
  const awayGoals = expectedAwayMetric(training, match.awayTeam, match.homeTeam, "awayGoals", "awayGoals");
  const homeCorners = expectedHomeMetric(training, match.homeTeam, match.awayTeam, "homeCorners", "homeCorners");
  const awayCorners = expectedAwayMetric(training, match.awayTeam, match.homeTeam, "awayCorners", "awayCorners");
  const homeShots = expectedHomeMetric(training, match.homeTeam, match.awayTeam, "homeShotsOnTarget", "homeShotsOnTarget");
  const awayShots = expectedAwayMetric(training, match.awayTeam, match.homeTeam, "awayShotsOnTarget", "awayShotsOnTarget");
  const totalGoals = homeGoals + awayGoals;
  const totalCorners = homeCorners + awayCorners;
  const totalShots = homeShots + awayShots;

  return {
    result: outcomeProbabilities(homeGoals, awayGoals),
    goals: { total: totalGoals, over25: overLineProbability(totalGoals, 2.5) },
    btts: (1 - Math.exp(-homeGoals)) * (1 - Math.exp(-awayGoals)),
    corners: { total: totalCorners, over85: overLineProbability(totalCorners, 8.5) },
    shots: {
      home: homeShots,
      away: awayShots,
      total: totalShots,
      homeOver25: overLineProbability(homeShots, 2.5),
      awayOver25: overLineProbability(awayShots, 2.5),
      totalOver75: overLineProbability(totalShots, 7.5),
    },
  };
}

function marketSummary(rows) {
  const usable = rows.filter((row) => Number.isFinite(row.probability) && typeof row.actual === "boolean");
  if (!usable.length) return { sample: 0, hitRate: null, averagePredictedProbability: null, brierScore: null, calibration: [] };
  const bins = [[0, 0.4], [0.4, 0.5], [0.5, 0.6], [0.6, 0.7], [0.7, 1.01]].map(([min, max]) => {
    const binRows = usable.filter((row) => row.probability >= min && row.probability < max);
    return {
      range: `${Math.round(min * 100)}–${Math.min(100, Math.round(max * 100))}%`,
      sample: binRows.length,
      predicted: average(binRows.map((row) => row.probability)),
      observed: average(binRows.map((row) => Number(row.actual))),
    };
  }).filter((bin) => bin.sample > 0);
  return {
    sample: usable.length,
    hitRate: average(usable.map((row) => Number(row.actual))),
    averagePredictedProbability: average(usable.map((row) => row.probability)),
    brierScore: average(usable.map((row) => (row.probability - Number(row.actual)) ** 2)),
    calibration: bins,
  };
}

/**
 * Fits a monotonic, smoothed calibration map from walk-forward predictions.
 * The prior avoids trusting a sparse probability range too aggressively.
 */
function calibrationModel(rows) {
  const usable = rows.filter((row) => Number.isFinite(row.probability) && typeof row.actual === "boolean");
  const globalRate = average(usable.map((row) => Number(row.actual)));
  const boundaries = [0, 0.4, 0.5, 0.6, 0.7, 1.01];
  const buckets = boundaries.slice(0, -1).map((min, index) => {
    const max = boundaries[index + 1];
    const rowsInBucket = usable.filter((row) => row.probability >= min && row.probability < max);
    return {
      min,
      max,
      sample: rowsInBucket.length,
      successes: rowsInBucket.reduce((total, row) => total + Number(row.actual), 0),
    };
  });
  if (!usable.length || globalRate == null) return null;

  // Pool-adjacent-violators keeps calibration monotonic: a higher raw
  // probability can never receive a lower calibrated probability.
  const groups = [];
  for (const bucket of buckets) {
    const effectiveSample = bucket.sample + calibrationPriorStrength;
    const effectiveSuccesses = bucket.successes + calibrationPriorStrength * globalRate;
    groups.push({ ...bucket, effectiveSample, effectiveSuccesses, rate: effectiveSuccesses / effectiveSample });
    while (groups.length > 1 && groups.at(-2).rate > groups.at(-1).rate) {
      const right = groups.pop();
      const left = groups.pop();
      const merged = {
        min: left.min,
        max: right.max,
        sample: left.sample + right.sample,
        successes: left.successes + right.successes,
        effectiveSample: left.effectiveSample + right.effectiveSample,
        effectiveSuccesses: left.effectiveSuccesses + right.effectiveSuccesses,
      };
      groups.push({ ...merged, rate: merged.effectiveSuccesses / merged.effectiveSample });
    }
  }

  return {
    globalRate: round(globalRate),
    smoothingPriorStrength: calibrationPriorStrength,
    bins: groups.map((group) => ({
      min: group.min,
      max: group.max,
      sample: group.sample,
      observedRate: round(group.sample ? group.successes / group.sample : globalRate),
      calibratedRate: round(group.rate),
    })),
  };
}

function round(value, digits = 3) {
  return value == null ? null : Math.round(value * 10 ** digits) / 10 ** digits;
}

function roundedMarket(summary) {
  return {
    ...summary,
    hitRate: round(summary.hitRate),
    averagePredictedProbability: round(summary.averagePredictedProbability),
    brierScore: round(summary.brierScore),
    calibration: summary.calibration.map((bin) => ({ ...bin, predicted: round(bin.predicted), observed: round(bin.observed) })),
  };
}

async function backtestLeague(league) {
  const matches = JSON.parse(await readFile(join(processedRoot, league.slug, "historical-matches.json"), "utf8"))
    .filter((match) => match.status === "FINISHED")
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
  const results = [];

  for (const match of matches) {
    // Strictly before the fixture date: same-day outcomes cannot leak in.
    const training = matches.filter((candidate) => candidate.date < match.date);
    if (training.length < warmupMatches) continue;
    const prediction = predict(match, training);
    const actualResult = match.homeGoals > match.awayGoals ? "home" : match.homeGoals === match.awayGoals ? "draw" : "away";
    const pick = Object.entries(prediction.result).reduce((best, current) => current[1] > best[1] ? current : best)[0];
    const totalGoals = match.homeGoals + match.awayGoals;
    const totalCorners = match.homeCorners == null || match.awayCorners == null ? null : match.homeCorners + match.awayCorners;
    const totalShots = match.homeShotsOnTarget == null || match.awayShotsOnTarget == null ? null : match.homeShotsOnTarget + match.awayShotsOnTarget;
    results.push({ match, prediction, actualResult, pick, totalGoals, totalCorners, totalShots });
  }

  const resultAccuracy = average(results.map((row) => Number(row.pick === row.actualResult)));
  const resultBrier = average(results.map((row) => (
    (row.prediction.result.home - Number(row.actualResult === "home")) ** 2
    + (row.prediction.result.draw - Number(row.actualResult === "draw")) ** 2
    + (row.prediction.result.away - Number(row.actualResult === "away")) ** 2
  ) / 3));
  const goals = marketSummary(results.map((row) => ({ probability: row.prediction.goals.over25, actual: row.totalGoals > 2.5 })));
  const btts = marketSummary(results.map((row) => ({ probability: row.prediction.btts, actual: row.match.homeGoals > 0 && row.match.awayGoals > 0 })));
  const corners = marketSummary(results.filter((row) => row.totalCorners != null).map((row) => ({ probability: row.prediction.corners.over85, actual: row.totalCorners > 8.5 })));
  const shots = marketSummary(results.filter((row) => row.totalShots != null).map((row) => ({ probability: row.prediction.shots.totalOver75, actual: row.totalShots > 7.5 })));
  const calibration = {
    result1X2: Object.fromEntries(["home", "draw", "away"].map((outcome) => [
      outcome,
      calibrationModel(results.map((row) => ({ probability: row.prediction.result[outcome], actual: row.actualResult === outcome }))),
    ])),
    goalsOver25: calibrationModel(results.map((row) => ({ probability: row.prediction.goals.over25, actual: row.totalGoals > 2.5 }))),
    bttsYes: calibrationModel(results.map((row) => ({ probability: row.prediction.btts, actual: row.match.homeGoals > 0 && row.match.awayGoals > 0 }))),
    cornersOver85: calibrationModel(results.filter((row) => row.totalCorners != null).map((row) => ({ probability: row.prediction.corners.over85, actual: row.totalCorners > 8.5 }))),
    shotsTotalOver75: calibrationModel(results.filter((row) => row.totalShots != null).map((row) => ({ probability: row.prediction.shots.totalOver75, actual: row.totalShots > 7.5 }))),
  };

  return {
    slug: league.slug,
    competition: league.competition,
    sourceMatches: matches.length,
    evaluatedFixtures: results.length,
    skippedForWarmup: matches.length - results.length,
    result1X2: { accuracy: round(resultAccuracy), brierScore: round(resultBrier) },
    goals: { mae: round(average(results.map((row) => Math.abs(row.prediction.goals.total - row.totalGoals))), 2), over25: roundedMarket(goals) },
    btts: roundedMarket(btts),
    corners: { mae: round(average(results.filter((row) => row.totalCorners != null).map((row) => Math.abs(row.prediction.corners.total - row.totalCorners))), 2), over85: roundedMarket(corners) },
    shotsOnTarget: { mae: round(average(results.filter((row) => row.totalShots != null).map((row) => Math.abs(row.prediction.shots.total - row.totalShots))), 2), over75: roundedMarket(shots) },
    calibration,
  };
}

const reports = await Promise.all(leagues.map(backtestLeague));
const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    evaluation: "walk-forward temporal",
    leakageGuard: "Cada partido se estima solo con encuentros cuya fecha sea estrictamente anterior.",
    warmupMatches,
    note: "Brier más bajo es mejor. Las métricas describen el histórico y no garantizan resultados futuros ni rentabilidad de apuestas.",
  },
  leagues: reports,
};

await mkdir(processedRoot, { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
await writeFile(calibrationOutputPath, JSON.stringify({
  version: 1,
  generatedAt: report.generatedAt,
  methodology: "Calibración por bins monotónicos con suavizado bayesiano, aprendida de predicciones walk-forward.",
  leagues: Object.fromEntries(reports.map((league) => [league.slug, league.calibration])),
}, null, 2) + "\n");
for (const league of reports) {
  console.log(`${league.competition}: ${league.evaluatedFixtures} fixtures · 1X2 ${Math.round(league.result1X2.accuracy * 100)}% · O2.5 Brier ${league.goals.over25.brierScore}`);
}
console.log(`Reporte guardado: ${outputPath}`);
console.log(`Calibración guardada: ${calibrationOutputPath}`);
