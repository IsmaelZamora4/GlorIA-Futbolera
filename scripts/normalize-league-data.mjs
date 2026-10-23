import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rawRoot = join(process.cwd(), "data", "raw");
const processedRoot = join(process.cwd(), "data", "processed");

const leagues = [
  { slug: "bundesliga", competition: "Bundesliga", currentFile: "season-26_27-bundesliga.csv" },
  { slug: "la-liga", competition: "LaLiga", currentFile: "season-26_27-la-liga.csv" },
  { slug: "ligue-1", competition: "Ligue 1", currentFile: "season-26_27-ligue-1.csv" },
  { slug: "premier-league", competition: "Premier League", currentFile: "season-26_27-premier-league.csv" },
  { slug: "serie-a", competition: "Serie A", currentFile: "season-26_27-serie-a.csv" },
];

const requiredColumns = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"];

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

function toNumber(value) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;

  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
  const parsed = new Date(Date.UTC(year, Number(month) - 1, Number(day)));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== Number(month) - 1
    || parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function seasonFromFile(fileName) {
  const match = fileName.match(/^season-(\d{2})_(\d{2})-/);
  if (!match) throw new Error("Nombre de temporada no reconocido: " + fileName);
  return "20" + match[1] + "/20" + match[2];
}

function normalizeRow({ row, league, fileName, rowNumber }) {
  const date = toIsoDate(row.Date ?? "");
  const homeGoals = toNumber(row.FTHG);
  const awayGoals = toNumber(row.FTAG);
  const isFinished = homeGoals != null && awayGoals != null;

  if (!date || !row.HomeTeam?.trim() || !row.AwayTeam?.trim()) {
    throw new Error(league.slug + "/" + fileName + ", fila " + rowNumber + ": fecha o equipos inválidos.");
  }

  return {
    id: league.slug + ":" + seasonFromFile(fileName) + ":" + date + ":" + row.HomeTeam + ":" + row.AwayTeam,
    competition: league.competition,
    season: seasonFromFile(fileName),
    date,
    kickoff: row.Time?.trim() || null,
    homeTeam: row.HomeTeam.trim(),
    awayTeam: row.AwayTeam.trim(),
    status: isFinished ? "FINISHED" : "SCHEDULED",
    homeGoals,
    awayGoals,
    result: isFinished ? (row.FTR?.trim() || (homeGoals > awayGoals ? "H" : homeGoals === awayGoals ? "D" : "A")) : null,
    homeExpectedGoals: toNumber(row.HxG),
    awayExpectedGoals: toNumber(row.AxG),
    homeShots: toNumber(row.HS),
    awayShots: toNumber(row.AS),
    homeShotsOnTarget: toNumber(row.HST),
    awayShotsOnTarget: toNumber(row.AST),
    homeCorners: toNumber(row.HC),
    awayCorners: toNumber(row.AC),
    homeYellowCards: toNumber(row.HY),
    awayYellowCards: toNumber(row.AY),
    homeRedCards: toNumber(row.HR),
    awayRedCards: toNumber(row.AR),
  };
}

async function normalizeLeague(league) {
  const rawDirectory = join(rawRoot, league.slug);
  const files = (await readdir(rawDirectory))
    .filter((file) => file.endsWith(".csv"))
    .sort();

  if (files.length !== 6 || !files.includes(league.currentFile)) {
    throw new Error(league.slug + ": se esperaban 6 CSV y el actual " + league.currentFile + ".");
  }

  const normalizedByFile = new Map();
  for (const fileName of files) {
    const lines = (await readFile(join(rawDirectory, fileName), "utf8"))
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/);
    const headers = parseCsvLine(lines[0]);

    for (const column of requiredColumns) {
      if (!headers.includes(column)) {
        throw new Error(league.slug + "/" + fileName + " no contiene la columna " + column + ".");
      }
    }

    const rows = lines.slice(1).map((line, index) => {
      const cells = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""]));
      return normalizeRow({ row, league, fileName, rowNumber: index + 2 });
    });
    normalizedByFile.set(fileName, rows);
  }

  const historicalMatches = files
    .filter((file) => file !== league.currentFile)
    .flatMap((file) => normalizedByFile.get(file) ?? [])
    .filter((match) => match.status === "FINISHED")
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
  const currentSeasonMatches = (normalizedByFile.get(league.currentFile) ?? [])
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));

  const outputDirectory = join(processedRoot, league.slug);
  const metadata = {
    generatedAt: new Date().toISOString(),
    competition: league.competition,
    historicalSeasons: [...new Set(historicalMatches.map((match) => match.season))],
    currentSeason: seasonFromFile(league.currentFile),
    historicalMatches: historicalMatches.length,
    currentSeasonMatches: currentSeasonMatches.length,
    currentSeasonFinishedMatches: currentSeasonMatches.filter((match) => match.status === "FINISHED").length,
    currentSeasonScheduledMatches: currentSeasonMatches.filter((match) => match.status === "SCHEDULED").length,
    sourceFiles: files,
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(join(outputDirectory, "historical-matches.json"), JSON.stringify(historicalMatches, null, 2) + "\n"),
    writeFile(join(outputDirectory, "current-season-matches.json"), JSON.stringify(currentSeasonMatches, null, 2) + "\n"),
    writeFile(join(outputDirectory, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n"),
  ]);

  return metadata;
}

const results = await Promise.all(leagues.map(normalizeLeague));
for (const result of results) {
  console.log(result.competition + ": " + result.historicalMatches + " históricos, " + result.currentSeasonFinishedMatches + " actuales finalizados.");
}
