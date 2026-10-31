import { readFile } from "node:fs/promises";
import path from "node:path";

type CalibrationBin = {
  min: number;
  max: number;
  calibratedRate: number;
};

type CalibrationMap = {
  bins: CalibrationBin[];
};

type LeagueCalibration = {
  result1X2: Record<"home" | "draw" | "away", CalibrationMap | null>;
  goalsOver25: CalibrationMap | null;
  bttsYes: CalibrationMap | null;
  cornersOver85: CalibrationMap | null;
  shotsTotalOver75: CalibrationMap | null;
};

type CalibrationDocument = {
  version: number;
  leagues: Record<string, LeagueCalibration>;
};

let calibrationCache: Promise<CalibrationDocument | null> | undefined;

async function getCalibrationDocument() {
  if (!calibrationCache) {
    calibrationCache = readFile(path.join(process.cwd(), "data", "processed", "calibration-model.json"), "utf8")
      .then((content) => JSON.parse(content) as CalibrationDocument)
      .catch(() => null);
  }
  return calibrationCache;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function applyMap(probability: number, map: CalibrationMap | null | undefined) {
  const safeProbability = clamp(probability);
  if (!map?.bins.length) return safeProbability;
  return map.bins.find((bin) => safeProbability >= bin.min && safeProbability < bin.max)?.calibratedRate
    ?? map.bins.at(-1)?.calibratedRate
    ?? safeProbability;
}

export async function calibrateProbability(
  leagueSlug: string,
  market: "goalsOver25" | "bttsYes" | "cornersOver85" | "shotsTotalOver75",
  probability: number,
) {
  const document = await getCalibrationDocument();
  return applyMap(probability, document?.leagues[leagueSlug]?.[market]);
}

export async function calibrateResultProbabilities(
  leagueSlug: string,
  probabilities: { home: number; draw: number; away: number },
) {
  const document = await getCalibrationDocument();
  const map = document?.leagues[leagueSlug]?.result1X2;
  if (!map) return probabilities;

  const home = applyMap(probabilities.home, map.home);
  const draw = applyMap(probabilities.draw, map.draw);
  const away = applyMap(probabilities.away, map.away);
  const total = home + draw + away;
  if (!total) return probabilities;
  return { home: home / total, draw: draw / total, away: away / total };
}
