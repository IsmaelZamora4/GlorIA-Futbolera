import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const processedRoot = join(process.cwd(), "data", "processed");
const aliases = JSON.parse(await readFile(join(process.cwd(), "data", "team-aliases.json"), "utf8"));
const leagueDirectories = {
  Bundesliga: "bundesliga",
  LaLiga: "la-liga",
  "Ligue 1": "ligue-1",
  "Premier League": "premier-league",
  "Serie A": "serie-a",
};

function normalizeTeamKey(name) {
  const tokens = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ");
  const legalClubTokens = new Set(["afc", "cfc", "cf", "fc"]);
  while (tokens.length && legalClubTokens.has(tokens[0])) tokens.shift();
  while (tokens.length && legalClubTokens.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

const reports = [];
for (const [competition, directory] of Object.entries(leagueDirectories)) {
  const historical = JSON.parse(await readFile(join(processedRoot, directory, "historical-matches.json"), "utf8"));
  const current = JSON.parse(await readFile(join(processedRoot, directory, "current-season-matches.json"), "utf8"));
  const historicalTeams = new Map();
  const currentTeams = new Map();
  for (const match of historical) {
    historicalTeams.set(normalizeTeamKey(match.homeTeam), match.homeTeam);
    historicalTeams.set(normalizeTeamKey(match.awayTeam), match.awayTeam);
  }
  for (const match of current) {
    currentTeams.set(normalizeTeamKey(match.homeTeam), match.homeTeam);
    currentTeams.set(normalizeTeamKey(match.awayTeam), match.awayTeam);
  }

  const invalidAliases = Object.keys(aliases[competition] ?? {})
    .filter((canonicalName) => (
      !historicalTeams.has(normalizeTeamKey(canonicalName))
      && !currentTeams.has(normalizeTeamKey(canonicalName))
    ));
  const unresolvedCurrentTeams = [...new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]))]
    .filter((team) => {
      if (historicalTeams.has(normalizeTeamKey(team))) return false;
      return !Object.values(aliases[competition] ?? {}).flat().some((variant) => normalizeTeamKey(variant) === normalizeTeamKey(team));
    })
    .sort();

  reports.push({
    competition,
    status: invalidAliases.length ? "failed" : "passed",
    configuredAliases: Object.values(aliases[competition] ?? {}).flat().length,
    invalidAliasTargets: invalidAliases,
    currentTeamsWithoutHistoricalIdentity: unresolvedCurrentTeams,
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  status: reports.some((report) => report.status === "failed") ? "failed" : "passed",
  leagues: reports,
};
await writeFile(join(processedRoot, "team-identity-report.json"), JSON.stringify(output, null, 2) + "\n");
for (const report of reports) {
  console.log(report.competition + ": " + report.status + " · " + report.configuredAliases + " aliases · " + report.currentTeamsWithoutHistoricalIdentity.length + " equipos nuevos.");
}
if (output.status === "failed") process.exitCode = 1;
