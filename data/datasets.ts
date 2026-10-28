export type DatasetStatus = "historical" | "demo" | "insufficient";

export type DatasetMarket = "winner" | "goals" | "btts" | "corners" | "shots";

export type DatasetInfo = {
  source: string;
  seasons: string[];
  updatedAt: string;
  status: DatasetStatus;
  markets: DatasetMarket[];
};

const datasetSeasons = ["2021/2022", "2022/2023", "2023/2024", "2024/2025", "2025/2026", "2026/2027"];
const historicalMarkets: DatasetMarket[] = ["winner", "goals", "btts", "corners", "shots"];

export const datasetInfoByCompetition = {
  "Bundesliga de Alemania": {
    source: "Dataset histórico local: data/processed/bundesliga",
    seasons: datasetSeasons,
    updatedAt: "2026-10-27T23:21:08.406Z",
    status: "historical",
    markets: historicalMarkets,
  },
  "LaLiga de España": {
    source: "Dataset histórico local: data/processed/la-liga",
    seasons: datasetSeasons,
    updatedAt: "2026-10-27T23:21:08.412Z",
    status: "historical",
    markets: historicalMarkets,
  },
  "Ligue 1 de Francia": {
    source: "Dataset histórico local: data/processed/ligue-1",
    seasons: datasetSeasons,
    updatedAt: "2026-10-27T23:21:08.403Z",
    status: "historical",
    markets: historicalMarkets,
  },
  "Premier League": {
    source: "Dataset histórico local: data/processed/premier-league",
    seasons: datasetSeasons,
    updatedAt: "2026-10-27T23:21:08.418Z",
    status: "historical",
    markets: historicalMarkets,
  },
  "Serie A de Italia": {
    source: "Dataset histórico local: data/processed/serie-a",
    seasons: datasetSeasons,
    updatedAt: "2026-10-27T23:21:08.440Z",
    status: "historical",
    markets: historicalMarkets,
  },
} satisfies Record<string, DatasetInfo>;

export const insufficientDatasetInfo: DatasetInfo = {
  source: "Sin dataset histórico local",
  seasons: [],
  updatedAt: "",
  status: "insufficient",
  markets: [],
};
