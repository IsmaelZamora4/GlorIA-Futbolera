/**
 * Catálogo y tipos compartidos del dominio.
 *
 * El nombre se conserva por compatibilidad con los imports existentes. Este
 * archivo no contiene fixtures ni datos de demostración: los partidos y sus
 * análisis se obtienen desde las fuentes locales o remotas de la aplicación.
 */

import type { DatasetInfo } from "./datasets";

export const competitions = [
  "Todas",
  "Liga 1 de Perú",
  "Serie A de Italia",
  "LaLiga de España",
  "Ligue 1 de Francia",
  "Bundesliga de Alemania",
  "Premier League",
  "Champions League",
  "Europa League",
] as const;

export type MarketKey = "winner" | "goals" | "btts" | "corners" | "shots";

export type HistoricalAnalysis = {
  dataset: DatasetInfo;
  usingLeagueBaseline: boolean;
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  homeSample: number;
  awaySample: number;
  currentSeasonHomeSample: number;
  currentSeasonAwaySample: number;
  expectedGoals: {
    home: number;
    away: number;
    total: number;
  };
  over25Probability: number;
  bttsProbability: number;
  expectedCorners: {
    home: number;
    away: number;
    total: number;
  };
  expectedShotsOnTarget: {
    home: number;
    away: number;
  };
  /**
   * Market lines calculated from the same goal/count model as 1X2 and BTTS.
   * They are estimates for analysis, not betting recommendations.
   */
  markets: {
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
      over85: number;
      over95: number;
    };
    shotsOnTarget: {
      homeOver25: number;
      awayOver25: number;
      totalOver75: number;
    };
  };
  teamIdentity?: {
    home: "exact" | "alias" | "unmatched";
    away: "exact" | "alias" | "unmatched";
  };
  calibration?: {
    applied: boolean;
    method: string;
  };
};

export type MarketMetric = {
  label: string;
  confidence: number | null;
  note: string;
};

export type MatchStatistic = {
  label: string;
  home: string;
  away: string;
  available: boolean;
};

export type Match = {
  id: string;
  competition: string;
  shortCompetition: string;
  date: string;
  kickoff: string;
  home: string;
  away: string;
  homeTeamId: number;
  awayTeamId: number;
  homeCode: string;
  awayCode: string;
  homeLogo: string;
  awayLogo: string;
  venue: string;
  status: string;
  score?: [number, number];
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  metrics: Record<MarketKey, MarketMetric>;
  stats: MatchStatistic[];
  dataSource: "fixture" | "demo" | "local";
  historicalAnalysis?: HistoricalAnalysis;
};
