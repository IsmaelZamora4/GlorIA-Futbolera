import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rawDirectory = join(process.cwd(), "data", "raw", "premier-league");
const outputDirectory = join(process.cwd(), "data", "processed");
const requiredColumns = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR", "HS", "AS", "HST", "AST", "HC", "AC", "HY", "AY", "HR", "AR"];

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { values.push(value); value = ""; } else value += character;
  }
  values.push(value);
  return values;
}

function toNumber(value) {
  return value === "" || value == null ? null : Number(value);
}

function seasonFromFile(fileName) {
  const match = fileName.match(/season-(\d{2})_(\d{2})-premier-league\.csv$/);
  if (!match) throw new Error(`Nombre de archivo no reconocido: ${fileName}`);
  return `20${match[1]}/20${match[2]}`;
}

function mean(values) {
  const available = values.filter((value) => value != null);
  return available.length ? Number((available.reduce((total, value) => total + value, 0) / available.length).toFixed(3)) : null;
}

function createTeamState(season, team) {
  return { season, team, matches: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, shotsOnTargetFor: 0, cornersFor: 0, yellowCards: 0, btts: 0, over25: 0, lastFive: [] };
}

function stateKey(season, team) {
  return `${season}:${team}`;
}

function snapshot(state) {
  if (!state || state.matches === 0) return { matches: 0, pointsPerMatch: null, goalsForPerMatch: null, goalsAgainstPerMatch: null, shotsOnTargetPerMatch: null, cornersPerMatch: null, bttsRate: null, over25Rate: null, lastFive: [] };
  const perMatch = (value) => Number((value / state.matches).toFixed(3));
  return {
    matches: state.matches, pointsPerMatch: perMatch(state.points), goalsForPerMatch: perMatch(state.goalsFor), goalsAgainstPerMatch: perMatch(state.goalsAgainst),
    shotsOnTargetPerMatch: perMatch(state.shotsOnTargetFor), cornersPerMatch: perMatch(state.cornersFor), bttsRate: perMatch(state.btts), over25Rate: perMatch(state.over25), lastFive: state.lastFive,
  };
}

function updateState(state, goalsFor, goalsAgainst, shotsOnTarget, corners, yellowCards, btts, over25) {
  state.matches += 1;
  state.goalsFor += goalsFor;
  state.goalsAgainst += goalsAgainst;
  state.shotsOnTargetFor += shotsOnTarget ?? 0;
  state.cornersFor += corners ?? 0;
  state.yellowCards += yellowCards ?? 0;
  if (btts) state.btts += 1;
  if (over25) state.over25 += 1;
  const result = goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "D" : "L";
  if (result === "W") { state.wins += 1; state.points += 3; }
  if (result === "D") { state.draws += 1; state.points += 1; }
  if (result === "L") state.losses += 1;
  state.lastFive = [...state.lastFive, result].slice(-5);
}

const files = (await readdir(rawDirectory)).filter((file) => file.endsWith(".csv")).sort();
if (files.length < 5) throw new Error(`Se requieren al menos 5 temporadas y se encontraron ${files.length}.`);

const matches = [];
for (const file of files) {
  const lines = (await readFile(join(rawDirectory, file), "utf8")).trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  for (const column of requiredColumns) if (!headers.includes(column)) throw new Error(`${file} no contiene la columna ${column}.`);
  const season = seasonFromFile(file);
  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const homeGoals = toNumber(row.FTHG);
    const awayGoals = toNumber(row.FTAG);
    if (!row.Date || !row.HomeTeam || !row.AwayTeam || homeGoals == null || awayGoals == null) {
      throw new Error(`${file}, fila ${lineIndex + 2}: partido incompleto.`);
    }
    matches.push({
      id: `${season}:${row.Date}:${row.HomeTeam}:${row.AwayTeam}`,
      season, date: row.Date, homeTeam: row.HomeTeam, awayTeam: row.AwayTeam,
      homeGoals, awayGoals, result: row.FTR,
      halfTimeHomeGoals: toNumber(row.HTHG), halfTimeAwayGoals: toNumber(row.HTAG),
      homeShots: toNumber(row.HS), awayShots: toNumber(row.AS), homeShotsOnTarget: toNumber(row.HST), awayShotsOnTarget: toNumber(row.AST),
      homeCorners: toNumber(row.HC), awayCorners: toNumber(row.AC), homeYellowCards: toNumber(row.HY), awayYellowCards: toNumber(row.AY), homeRedCards: toNumber(row.HR), awayRedCards: toNumber(row.AR),
      referee: row.Referee || null,
      totalGoals: homeGoals + awayGoals, btts: homeGoals > 0 && awayGoals > 0,
      over15: homeGoals + awayGoals > 1, over25: homeGoals + awayGoals > 2, over35: homeGoals + awayGoals > 3,
    });
  }
}

matches.sort((left, right) => left.date.localeCompare(right.date));
const teamStates = new Map();
const preMatchFeatures = [];
for (let start = 0; start < matches.length;) {
  const date = matches[start].date;
  let end = start;
  while (end < matches.length && matches[end].date === date) end += 1;
  const matchday = matches.slice(start, end);
  for (const match of matchday) {
    preMatchFeatures.push({
      id: match.id, season: match.season, date: match.date, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
      homeBefore: snapshot(teamStates.get(stateKey(match.season, match.homeTeam))),
      awayBefore: snapshot(teamStates.get(stateKey(match.season, match.awayTeam))),
      outcome: { result: match.result, btts: match.btts, over25: match.over25 },
    });
  }
  for (const match of matchday) {
    const homeKey = stateKey(match.season, match.homeTeam);
    const awayKey = stateKey(match.season, match.awayTeam);
    const home = teamStates.get(homeKey) ?? createTeamState(match.season, match.homeTeam);
    const away = teamStates.get(awayKey) ?? createTeamState(match.season, match.awayTeam);
    updateState(home, match.homeGoals, match.awayGoals, match.homeShotsOnTarget, match.homeCorners, match.homeYellowCards, match.btts, match.over25);
    updateState(away, match.awayGoals, match.homeGoals, match.awayShotsOnTarget, match.awayCorners, match.awayYellowCards, match.btts, match.over25);
    teamStates.set(homeKey, home);
    teamStates.set(awayKey, away);
  }
  start = end;
}
const teamSeasonStats = [...teamStates.values()].sort((left, right) => left.season.localeCompare(right.season) || right.points - left.points || (right.goalsFor - right.goalsAgainst) - (left.goalsFor - left.goalsAgainst));
const summary = {
  generatedAt: new Date().toISOString(), competition: "Premier League", seasons: [...new Set(matches.map((match) => match.season))], matches: matches.length,
  homeWins: matches.filter((match) => match.result === "H").length,
  draws: matches.filter((match) => match.result === "D").length,
  awayWins: matches.filter((match) => match.result === "A").length,
  btts: matches.filter((match) => match.btts).length,
  over15: matches.filter((match) => match.over15).length,
  over25: matches.filter((match) => match.over25).length,
  over35: matches.filter((match) => match.over35).length,
  averageGoals: mean(matches.map((match) => match.totalGoals)),
  averageCorners: mean(matches.map((match) => match.homeCorners + match.awayCorners)),
  averageYellowCards: mean(matches.map((match) => match.homeYellowCards + match.awayYellowCards)),
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "premier-league-matches.json"), `${JSON.stringify(matches, null, 2)}\n`);
await writeFile(join(outputDirectory, "premier-league-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(join(outputDirectory, "premier-league-team-season-stats.json"), `${JSON.stringify(teamSeasonStats, null, 2)}\n`);
await writeFile(join(outputDirectory, "premier-league-pre-match-features.json"), `${JSON.stringify(preMatchFeatures, null, 2)}\n`);
console.log(`Normalizados ${matches.length} partidos, ${teamSeasonStats.length} registros equipo-temporada y ${preMatchFeatures.length} conjuntos pre-partido.`);
