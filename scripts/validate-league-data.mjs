import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rawRoot = join(process.cwd(), "data", "raw");
const processedRoot = join(process.cwd(), "data", "processed");
const requiredColumns = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"];
const optionalNumericColumns = ["HxG", "AxG", "HS", "AS", "HST", "AST", "HC", "AC", "HY", "AY", "HR", "AR"];

const leagues = [
  { slug: "bundesliga", competition: "Bundesliga", currentFile: "season-26_27-bundesliga.csv" },
  { slug: "la-liga", competition: "LaLiga", currentFile: "season-26_27-la-liga.csv" },
  { slug: "ligue-1", competition: "Ligue 1", currentFile: "season-26_27-ligue-1.csv" },
  { slug: "premier-league", competition: "Premier League", currentFile: "season-26_27-premier-league.csv" },
  { slug: "serie-a", competition: "Serie A", currentFile: "season-26_27-serie-a.csv" },
];

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

function parseDate(value) {
  const trimmed = (value ?? "").trim();
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

function toNonNegativeInteger(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function canonicalTeamName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function countDuplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function createCounter() {
  return Object.fromEntries(optionalNumericColumns.map((column) => [column, { missing: 0, invalid: 0 }]));
}

async function auditRawLeague(league) {
  const directory = join(rawRoot, league.slug);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".csv")).sort();
  const critical = [];
  const warnings = [];
  const fileReports = [];
  const allFixtureKeys = [];
  const teamVariants = new Map();

  if (files.length !== 6 || !files.includes(league.currentFile)) {
    critical.push({ code: "unexpected_file_set", message: "Se esperaban seis CSV y una temporada actual identificable." });
  }

  for (const fileName of files) {
    const isCurrent = fileName === league.currentFile;
    const lines = (await readFile(join(directory, fileName), "utf8"))
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/);
    const headers = parseCsvLine(lines[0]);
    const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
    const counters = {
      invalidDate: 0,
      missingTeam: 0,
      sameTeam: 0,
      incompleteScore: 0,
      invalidScore: 0,
      resultMismatch: 0,
      optional: createCounter(),
    };

    if (missingColumns.length) {
      critical.push({ code: "missing_columns", file: fileName, columns: missingColumns });
    }

    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
      const date = parseDate(row.Date);
      const home = row.HomeTeam?.trim() ?? "";
      const away = row.AwayTeam?.trim() ?? "";
      const homeGoals = toNonNegativeInteger(row.FTHG);
      const awayGoals = toNonNegativeInteger(row.FTAG);

      if (!date) counters.invalidDate += 1;
      if (!home || !away) counters.missingTeam += 1;
      if (home && away && canonicalTeamName(home) === canonicalTeamName(away)) counters.sameTeam += 1;
      if ((homeGoals == null) !== (awayGoals == null)) counters.incompleteScore += 1;
      if (homeGoals === undefined || awayGoals === undefined) counters.invalidScore += 1;
      if (!isCurrent && (homeGoals == null || awayGoals == null)) counters.incompleteScore += 1;

      if (homeGoals != null && awayGoals != null && row.FTR?.trim()) {
        const expected = homeGoals > awayGoals ? "H" : homeGoals === awayGoals ? "D" : "A";
        if (row.FTR.trim() !== expected) counters.resultMismatch += 1;
      }

      for (const column of optionalNumericColumns) {
        if (!headers.includes(column)) {
          counters.optional[column].missing += 1;
          continue;
        }
        const value = row[column]?.trim() ?? "";
        if (!value) counters.optional[column].missing += 1;
        else if (!Number.isFinite(Number(value)) || Number(value) < 0) counters.optional[column].invalid += 1;
      }

      if (date && home && away) {
        allFixtureKeys.push(fileName + ":" + date + ":" + canonicalTeamName(home) + ":" + canonicalTeamName(away));
      }
      for (const team of [home, away]) {
        if (!team) continue;
        const key = canonicalTeamName(team);
        const variants = teamVariants.get(key) ?? new Set();
        variants.add(team);
        teamVariants.set(key, variants);
      }
    }

    const rowCritical = ["invalidDate", "missingTeam", "sameTeam", "incompleteScore", "invalidScore", "resultMismatch"]
      .filter((key) => counters[key] > 0)
      .map((key) => ({ code: key, file: fileName, count: counters[key] }));
    critical.push(...rowCritical);
    fileReports.push({ file: fileName, currentSeason: isCurrent, rows: lines.length - 1, missingColumns, counters });
  }

  const duplicates = countDuplicates(allFixtureKeys);
  if (duplicates.length) critical.push({ code: "duplicate_fixtures", count: duplicates.length, examples: duplicates.slice(0, 10) });

  const nameVariants = [...teamVariants.entries()]
    .filter(([, variants]) => variants.size > 1)
    .map(([canonical, variants]) => ({ canonical, variants: [...variants].sort() }));
  if (nameVariants.length) warnings.push({ code: "team_name_variants", count: nameVariants.length, examples: nameVariants.slice(0, 20) });

  return { critical, warnings, fileReports, nameVariants };
}

async function auditProcessedLeague(league) {
  const directory = join(processedRoot, league.slug);
  const historical = JSON.parse(await readFile(join(directory, "historical-matches.json"), "utf8"));
  const current = JSON.parse(await readFile(join(directory, "current-season-matches.json"), "utf8"));
  const critical = [];
  const warnings = [];
  const historicalIds = countDuplicates(historical.map((match) => match.id));
  const historicalFixtureKeys = countDuplicates(historical.map((match) => match.season + ":" + match.date + ":" + canonicalTeamName(match.homeTeam) + ":" + canonicalTeamName(match.awayTeam)));
  const invalidHistorical = historical.filter((match) => (
    match.status !== "FINISHED"
    || !/^\d{4}-\d{2}-\d{2}$/.test(match.date)
    || !Number.isInteger(match.homeGoals)
    || !Number.isInteger(match.awayGoals)
  ));
  const invalidCurrent = current.filter((match) => !/^\d{4}-\d{2}-\d{2}$/.test(match.date));

  if (historicalIds.length) critical.push({ code: "processed_duplicate_ids", count: historicalIds.length });
  if (historicalFixtureKeys.length) critical.push({ code: "processed_duplicate_fixtures", count: historicalFixtureKeys.length });
  if (invalidHistorical.length) critical.push({ code: "processed_invalid_historical", count: invalidHistorical.length });
  if (invalidCurrent.length) critical.push({ code: "processed_invalid_current_dates", count: invalidCurrent.length });

  const historicalTeams = new Map();
  const currentTeams = new Map();
  for (const match of historical) {
    historicalTeams.set(canonicalTeamName(match.homeTeam), match.homeTeam);
    historicalTeams.set(canonicalTeamName(match.awayTeam), match.awayTeam);
  }
  for (const match of current) {
    currentTeams.set(canonicalTeamName(match.homeTeam), match.homeTeam);
    currentTeams.set(canonicalTeamName(match.awayTeam), match.awayTeam);
  }
  const currentOnlyTeams = [...currentTeams.entries()]
    .filter(([key]) => !historicalTeams.has(key))
    .map(([, name]) => name)
    .sort();
  if (currentOnlyTeams.length) {
    warnings.push({
      code: "current_teams_without_historical_exact_match",
      message: "Puede indicar clubes ascendidos o aliases que deberán resolverse en el paso 3.",
      teams: currentOnlyTeams,
    });
  }

  return {
    critical,
    warnings,
    checks: {
      historicalMatches: historical.length,
      currentSeasonMatches: current.length,
      historicalSeasons: [...new Set(historical.map((match) => match.season))].sort(),
      currentOnlyTeams,
    },
  };
}

async function auditLeague(league) {
  const raw = await auditRawLeague(league);
  const processed = await auditProcessedLeague(league);
  const report = {
    generatedAt: new Date().toISOString(),
    competition: league.competition,
    status: raw.critical.length || processed.critical.length ? "failed" : "passed",
    critical: [...raw.critical, ...processed.critical],
    warnings: [...raw.warnings, ...processed.warnings],
    raw: { files: raw.fileReports, detectedNameVariants: raw.nameVariants },
    processed: processed.checks,
  };

  const outputDirectory = join(processedRoot, league.slug);
  await writeFile(join(outputDirectory, "quality-report.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}

await mkdir(processedRoot, { recursive: true });
const reports = await Promise.all(leagues.map(auditLeague));
const summary = {
  generatedAt: new Date().toISOString(),
  status: reports.some((report) => report.status === "failed") ? "failed" : "passed",
  leagues: reports.map((report) => ({
    competition: report.competition,
    status: report.status,
    criticalIssues: report.critical.length,
    warnings: report.warnings.length,
  })),
};

await writeFile(join(processedRoot, "quality-report.json"), JSON.stringify(summary, null, 2) + "\n");
for (const report of summary.leagues) {
  console.log(report.competition + ": " + report.status + " · " + report.criticalIssues + " críticos · " + report.warnings + " advertencias.");
}
if (summary.status === "failed") process.exitCode = 1;
