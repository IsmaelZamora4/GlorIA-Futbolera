import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveTeamIdentity, type TeamIdentity } from "./team-identity";

/**
 * Server-side contract for every tab in the future match-detail screen.
 *
 * It deliberately exposes only rows available before `fixtureDate`. This makes
 * it impossible for form, standings, or H2H features to accidentally include
 * a result that happened after the prediction was made.
 */
export type LocalDetailMatch = {
  id: string;
  competition: string;
  season: string;
  date: string;
  kickoff: string | null;
  homeTeam: string;
  awayTeam: string;
  status: "FINISHED" | "SCHEDULED";
  homeGoals: number | null;
  awayGoals: number | null;
  result: "H" | "D" | "A" | null;
  homeExpectedGoals: number | null;
  awayExpectedGoals: number | null;
  homeShots: number | null;
  awayShots: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
  homeYellowCards: number | null;
  awayYellowCards: number | null;
  homeRedCards: number | null;
  awayRedCards: number | null;
};

type LocalDetailMetadata = {
  generatedAt: string;
  competition: string;
  historicalSeasons: string[];
  currentSeason: string;
};

type LocalDetailDataset = {
  historical: LocalDetailMatch[];
  current: LocalDetailMatch[];
  metadata: LocalDetailMetadata;
};

type DetailCompetitionConfig = {
  slug: string;
  identityCompetition: "Bundesliga" | "LaLiga" | "Ligue 1" | "Premier League" | "Serie A";
};

const configurations: Record<string, DetailCompetitionConfig> = {
  "Bundesliga de Alemania": { slug: "bundesliga", identityCompetition: "Bundesliga" },
  "LaLiga de España": { slug: "la-liga", identityCompetition: "LaLiga" },
  "Ligue 1 de Francia": { slug: "ligue-1", identityCompetition: "Ligue 1" },
  "Premier League": { slug: "premier-league", identityCompetition: "Premier League" },
  "Serie A de Italia": { slug: "serie-a", identityCompetition: "Serie A" },
};

const datasetCache = new Map<string, Promise<LocalDetailDataset>>();
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export type MatchDetailRequest = {
  competition: string;
  fixtureDate: string;
  homeTeam: string;
  awayTeam: string;
};

export type LocalMatchDetailContext = {
  source: "local-csv";
  fixture: {
    competition: string;
    fixtureDate: string;
    home: TeamIdentity;
    away: TeamIdentity;
  };
  coverage: {
    generatedAt: string;
    historicalSeasons: string[];
    currentSeason: string;
    /** Latest finished match included in pre-match calculations. */
    preMatchDataThrough: string | null;
    /** Latest result found in the refreshed current-season CSV. */
    currentDatasetThrough: string | null;
  };
  /** Five completed prior seasons; used by the historical model and H2H. */
  historicalMatches: LocalDetailMatch[];
  /** Current-season finished rows strictly before the fixture date. */
  currentMatchesBeforeFixture: LocalDetailMatch[];
};

export type FormOutcome = "W" | "D" | "L";

export type RecentFormMatch = {
  id: string;
  date: string;
  season: string;
  opponent: string;
  venue: "home" | "away";
  goalsFor: number;
  goalsAgainst: number;
  outcome: FormOutcome;
};

export type TeamRecentForm = {
  team: string;
  matches: RecentFormMatch[];
  record: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  /** Indicates whether a newly promoted/low-sample team needed historic fallback rows. */
  coverage: "current-only" | "current-and-historical" | "historical-only" | "unavailable";
};

export type MatchRecentForms = {
  home: TeamRecentForm;
  away: TeamRecentForm;
};

export type AggregateMetric = {
  total: number;
  average: number;
  sample: number;
} | null;

/** Season-to-date performance split by the venue of the selected fixture. */
export type VenueSeasonRecord = {
  team: string;
  venue: "home" | "away";
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  pointsPerGame: number | null;
  matches: RecentFormMatch[];
  dataThrough: string | null;
};

export type TeamSeasonStatistics = {
  team: string;
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsPerGame: number | null;
  goalsConcededPerGame: number | null;
  cleanSheets: number;
  expectedGoalsFor: AggregateMetric;
  expectedGoalsAgainst: AggregateMetric;
  shotsFor: AggregateMetric;
  shotsAgainst: AggregateMetric;
  shotsOnTargetFor: AggregateMetric;
  shotsOnTargetAgainst: AggregateMetric;
  cornersFor: AggregateMetric;
  cornersAgainst: AggregateMetric;
  yellowCards: AggregateMetric;
  redCards: AggregateMetric;
  homeRecord: VenueSeasonRecord;
  awayRecord: VenueSeasonRecord;
  dataThrough: string | null;
};

export type MatchSeasonStatistics = {
  home: TeamSeasonStatistics;
  away: TeamSeasonStatistics;
};

export type StandingsZone = "champions" | "europa" | "conference" | "relegation" | "neutral";

export type LocalStanding = {
  position: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormOutcome[];
  zone: StandingsZone;
  isFixtureTeam: boolean;
};

export type LocalStandings = {
  season: string;
  dataThrough: string | null;
  rows: LocalStanding[];
  /** A deterministic local fallback. Official leagues can use additional tie-break rules. */
  tieBreakRule: "points-goal-difference-goals-for-wins-alphabetical";
};

export type HeadToHeadMatch = {
  id: string;
  date: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  /** Outcome from the perspective of the upcoming fixture's home team. */
  homeFixtureOutcome: FormOutcome;
};

export type HeadToHeadSummary = {
  homeTeam: string;
  awayTeam: string;
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
  /** All direct league meetings in the five historic seasons plus the current pre-match season. */
  matches: HeadToHeadMatch[];
  /** Convenience list for the initial detail tab. */
  recentMatches: HeadToHeadMatch[];
};

export function supportsLocalMatchDetail(competition: string) {
  return competition in configurations;
}

export function getMatchDetailCompetitionSlug(competition: string) {
  return configurations[competition]?.slug ?? null;
}

export function getMatchDetailCompetitionBySlug(slug: string) {
  return Object.entries(configurations).find(([, config]) => config.slug === slug)?.[0] ?? null;
}

async function getDataset(config: DetailCompetitionConfig) {
  const cached = datasetCache.get(config.slug);
  if (cached) return cached;

  const directory = path.join(process.cwd(), "data", "processed", config.slug);
  const load = Promise.all([
    readFile(path.join(directory, "historical-matches.json"), "utf8"),
    readFile(path.join(directory, "current-season-matches.json"), "utf8"),
    readFile(path.join(directory, "metadata.json"), "utf8"),
  ]).then(([historical, current, metadata]) => ({
    historical: JSON.parse(historical) as LocalDetailMatch[],
    current: JSON.parse(current) as LocalDetailMatch[],
    metadata: JSON.parse(metadata) as LocalDetailMetadata,
  }));
  datasetCache.set(config.slug, load);
  return load;
}

function latestFinishedDate(matches: LocalDetailMatch[]) {
  return matches
    .filter((match) => match.status === "FINISHED")
    .reduce<string | null>((latest, match) => (!latest || match.date > latest ? match.date : latest), null);
}

function toRecentFormMatch(match: LocalDetailMatch, team: string): RecentFormMatch | null {
  if (match.homeGoals == null || match.awayGoals == null) return null;
  const venue = match.homeTeam === team ? "home" : "away";
  const goalsFor = venue === "home" ? match.homeGoals : match.awayGoals;
  const goalsAgainst = venue === "home" ? match.awayGoals : match.homeGoals;
  return {
    id: match.id,
    date: match.date,
    season: match.season,
    opponent: venue === "home" ? match.awayTeam : match.homeTeam,
    venue,
    goalsFor,
    goalsAgainst,
    outcome: goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "D" : "L",
  };
}

/**
 * Returns a team's latest five league results before the selected fixture.
 * Current-season results are preferred chronologically; historical results only
 * fill the card when fewer than five current matches exist.
 */
export function getTeamRecentForm(context: LocalMatchDetailContext, team: string): TeamRecentForm {
  const currentIds = new Set(context.currentMatchesBeforeFixture.map((match) => match.id));
  const candidates = context.historicalMatches
    .concat(context.currentMatchesBeforeFixture)
    .filter((match) => match.homeTeam === team || match.awayTeam === team)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
    .slice(0, 5);
  const matches = candidates
    .map((match) => toRecentFormMatch(match, team))
    .filter((match): match is RecentFormMatch => match != null);
  const currentMatches = candidates.filter((match) => currentIds.has(match.id)).length;
  const historicalMatches = candidates.length - currentMatches;

  return {
    team,
    matches,
    record: matches.reduce((record, match) => ({
      played: record.played + 1,
      wins: record.wins + (match.outcome === "W" ? 1 : 0),
      draws: record.draws + (match.outcome === "D" ? 1 : 0),
      losses: record.losses + (match.outcome === "L" ? 1 : 0),
      points: record.points + (match.outcome === "W" ? 3 : match.outcome === "D" ? 1 : 0),
      goalsFor: record.goalsFor + match.goalsFor,
      goalsAgainst: record.goalsAgainst + match.goalsAgainst,
    }), { played: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }),
    coverage: matches.length === 0
      ? "unavailable"
      : currentMatches > 0 && historicalMatches > 0
        ? "current-and-historical"
        : currentMatches > 0
          ? "current-only"
          : "historical-only",
  };
}

export function getMatchRecentForms(context: LocalMatchDetailContext): MatchRecentForms {
  return {
    home: getTeamRecentForm(context, context.fixture.home.canonicalName),
    away: getTeamRecentForm(context, context.fixture.away.canonicalName),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function aggregateMetric(values: Array<number | null>): AggregateMetric {
  const available = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!available.length) return null;
  const total = available.reduce((sum, value) => sum + value, 0);
  return { total: round(total), average: round(total / available.length), sample: available.length };
}

function getTeamSideValue(
  match: LocalDetailMatch,
  team: string,
  homeKey: keyof LocalDetailMatch,
  awayKey: keyof LocalDetailMatch,
) {
  return (match.homeTeam === team ? match[homeKey] : match[awayKey]) as number | null;
}

function getVenueSeasonRecord(matches: LocalDetailMatch[], team: string, venue: VenueSeasonRecord["venue"]): VenueSeasonRecord {
  const venueMatches = matches.filter((match) => (
    venue === "home" ? match.homeTeam === team : match.awayTeam === team
  ));
  const results = venueMatches
    .map((match) => toRecentFormMatch(match, team))
    .filter((match): match is RecentFormMatch => match != null)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
  const points = results.reduce((sum, match) => sum + (match.outcome === "W" ? 3 : match.outcome === "D" ? 1 : 0), 0);

  return {
    team,
    venue,
    played: results.length,
    wins: results.filter((match) => match.outcome === "W").length,
    draws: results.filter((match) => match.outcome === "D").length,
    losses: results.filter((match) => match.outcome === "L").length,
    points,
    goalsFor: results.reduce((sum, match) => sum + match.goalsFor, 0),
    goalsAgainst: results.reduce((sum, match) => sum + match.goalsAgainst, 0),
    pointsPerGame: results.length ? round(points / results.length) : null,
    matches: results,
    dataThrough: latestFinishedDate(venueMatches),
  };
}

/**
 * Builds season-to-date team statistics using only the current CSV rows that
 * finished before the upcoming fixture. `null` explicitly means the source
 * does not have that metric, never a fabricated zero.
 */
export function getTeamSeasonStatistics(context: LocalMatchDetailContext, team: string): TeamSeasonStatistics {
  const matches = context.currentMatchesBeforeFixture.filter((match) => match.homeTeam === team || match.awayTeam === team);
  const completed = matches.filter((match) => match.homeGoals != null && match.awayGoals != null);
  const results = completed.map((match) => toRecentFormMatch(match, team)).filter((match): match is RecentFormMatch => match != null);
  const values = (homeKey: keyof LocalDetailMatch, awayKey: keyof LocalDetailMatch) => completed.map(
    (match) => getTeamSideValue(match, team, homeKey, awayKey),
  );
  const goalsFor = results.reduce((sum, match) => sum + match.goalsFor, 0);
  const goalsAgainst = results.reduce((sum, match) => sum + match.goalsAgainst, 0);

  return {
    team,
    season: context.coverage.currentSeason,
    played: results.length,
    wins: results.filter((match) => match.outcome === "W").length,
    draws: results.filter((match) => match.outcome === "D").length,
    losses: results.filter((match) => match.outcome === "L").length,
    points: results.reduce((sum, match) => sum + (match.outcome === "W" ? 3 : match.outcome === "D" ? 1 : 0), 0),
    goalsFor,
    goalsAgainst,
    goalsPerGame: results.length ? round(goalsFor / results.length) : null,
    goalsConcededPerGame: results.length ? round(goalsAgainst / results.length) : null,
    cleanSheets: results.filter((match) => match.goalsAgainst === 0).length,
    expectedGoalsFor: aggregateMetric(values("homeExpectedGoals", "awayExpectedGoals")),
    expectedGoalsAgainst: aggregateMetric(values("awayExpectedGoals", "homeExpectedGoals")),
    shotsFor: aggregateMetric(values("homeShots", "awayShots")),
    shotsAgainst: aggregateMetric(values("awayShots", "homeShots")),
    shotsOnTargetFor: aggregateMetric(values("homeShotsOnTarget", "awayShotsOnTarget")),
    shotsOnTargetAgainst: aggregateMetric(values("awayShotsOnTarget", "homeShotsOnTarget")),
    cornersFor: aggregateMetric(values("homeCorners", "awayCorners")),
    cornersAgainst: aggregateMetric(values("awayCorners", "homeCorners")),
    yellowCards: aggregateMetric(values("homeYellowCards", "awayYellowCards")),
    redCards: aggregateMetric(values("homeRedCards", "awayRedCards")),
    homeRecord: getVenueSeasonRecord(completed, team, "home"),
    awayRecord: getVenueSeasonRecord(completed, team, "away"),
    dataThrough: latestFinishedDate(completed),
  };
}

export function getMatchSeasonStatistics(context: LocalMatchDetailContext): MatchSeasonStatistics {
  return {
    home: getTeamSeasonStatistics(context, context.fixture.home.canonicalName),
    away: getTeamSeasonStatistics(context, context.fixture.away.canonicalName),
  };
}

type MutableStanding = Omit<LocalStanding, "position" | "goalDifference" | "zone" | "isFixtureTeam">;

function getStandingsZone(position: number, totalTeams: number): StandingsZone {
  if (position <= 4) return "champions";
  if (position === 5) return "europa";
  if (position === 6) return "conference";
  if (position > totalTeams - 3) return "relegation";
  return "neutral";
}

function createStanding(team: string): MutableStanding {
  return { team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
}

/**
 * Rebuilds the table from the same current-season, pre-fixture result set used
 * by the analysis. The ranking fallback is stated in the returned contract so
 * the UI never presents it as an official tie-break ruling.
 */
export function getLocalStandings(context: LocalMatchDetailContext): LocalStandings {
  const table = new Map<string, MutableStanding>();
  const ensure = (team: string) => {
    const existing = table.get(team);
    if (existing) return existing;
    const created = createStanding(team);
    table.set(team, created);
    return created;
  };

  for (const match of context.currentMatchesBeforeFixture) {
    if (match.homeGoals == null || match.awayGoals == null) continue;
    const home = ensure(match.homeTeam);
    const away = ensure(match.awayTeam);
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;
    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;
    if (match.homeGoals > match.awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeGoals < match.awayGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const standing of table.values()) {
    standing.form = context.currentMatchesBeforeFixture
      .filter((match) => match.homeTeam === standing.team || match.awayTeam === standing.team)
      .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
      .slice(0, 5)
      .map((match) => toRecentFormMatch(match, standing.team)?.outcome)
      .filter((outcome): outcome is FormOutcome => outcome != null);
  }

  const sorted = [...table.values()].sort((left, right) => {
    const goalDifference = (standing: MutableStanding) => standing.goalsFor - standing.goalsAgainst;
    return right.points - left.points
      || goalDifference(right) - goalDifference(left)
      || right.goalsFor - left.goalsFor
      || right.wins - left.wins
      || left.team.localeCompare(right.team);
  });
  const fixtureTeams = new Set([context.fixture.home.canonicalName, context.fixture.away.canonicalName]);

  return {
    season: context.coverage.currentSeason,
    dataThrough: latestFinishedDate(context.currentMatchesBeforeFixture),
    rows: sorted.map((standing, index) => ({
      ...standing,
      position: index + 1,
      goalDifference: standing.goalsFor - standing.goalsAgainst,
      zone: getStandingsZone(index + 1, sorted.length),
      isFixtureTeam: fixtureTeams.has(standing.team),
    })),
    tieBreakRule: "points-goal-difference-goals-for-wins-alphabetical",
  };
}

/**
 * Finds completed league meetings between the two clubs. Results in the
 * current season are limited to dates before the fixture just like every other
 * detail calculation, preventing an accidental future-data leak.
 */
export function getHeadToHead(context: LocalMatchDetailContext): HeadToHeadSummary {
  const homeTeam = context.fixture.home.canonicalName;
  const awayTeam = context.fixture.away.canonicalName;
  const matches = context.historicalMatches
    .concat(context.currentMatchesBeforeFixture)
    .filter((match) => (
      (match.homeTeam === homeTeam && match.awayTeam === awayTeam)
      || (match.homeTeam === awayTeam && match.awayTeam === homeTeam)
    ))
    .filter((match) => match.homeGoals != null && match.awayGoals != null)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
    .map<HeadToHeadMatch>((match) => {
      const fixtureHomeGoals = match.homeTeam === homeTeam ? match.homeGoals as number : match.awayGoals as number;
      const fixtureAwayGoals = match.homeTeam === homeTeam ? match.awayGoals as number : match.homeGoals as number;
      return {
        id: match.id,
        date: match.date,
        season: match.season,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeGoals: match.homeGoals as number,
        awayGoals: match.awayGoals as number,
        homeFixtureOutcome: fixtureHomeGoals > fixtureAwayGoals ? "W" : fixtureHomeGoals === fixtureAwayGoals ? "D" : "L",
      };
    });

  return {
    homeTeam,
    awayTeam,
    totalMatches: matches.length,
    homeWins: matches.filter((match) => match.homeFixtureOutcome === "W").length,
    draws: matches.filter((match) => match.homeFixtureOutcome === "D").length,
    awayWins: matches.filter((match) => match.homeFixtureOutcome === "L").length,
    homeGoals: matches.reduce((sum, match) => sum + (match.homeTeam === homeTeam ? match.homeGoals : match.awayGoals), 0),
    awayGoals: matches.reduce((sum, match) => sum + (match.homeTeam === awayTeam ? match.homeGoals : match.awayGoals), 0),
    matches,
    recentMatches: matches.slice(0, 5),
  };
}

/**
 * Loads the complete local data context for a fixture. Feature-specific
 * calculations use this same immutable pre-match context.
 */
export async function getLocalMatchDetailContext(request: MatchDetailRequest): Promise<LocalMatchDetailContext | null> {
  const config = configurations[request.competition];
  if (!config || !isoDate.test(request.fixtureDate)) return null;

  const dataset = await getDataset(config);
  const knownTeams = new Set(dataset.historical.concat(dataset.current).flatMap((match) => [match.homeTeam, match.awayTeam]));
  const home = resolveTeamIdentity(config.identityCompetition, request.homeTeam, knownTeams);
  const away = resolveTeamIdentity(config.identityCompetition, request.awayTeam, knownTeams);
  const currentMatchesBeforeFixture = dataset.current.filter(
    (match) => match.status === "FINISHED" && match.date < request.fixtureDate,
  );

  return {
    source: "local-csv",
    fixture: {
      competition: request.competition,
      fixtureDate: request.fixtureDate,
      home,
      away,
    },
    coverage: {
      generatedAt: dataset.metadata.generatedAt,
      historicalSeasons: dataset.metadata.historicalSeasons,
      currentSeason: dataset.metadata.currentSeason,
      preMatchDataThrough: latestFinishedDate(currentMatchesBeforeFixture),
      currentDatasetThrough: latestFinishedDate(dataset.current),
    },
    historicalMatches: dataset.historical.filter((match) => match.status === "FINISHED"),
    currentMatchesBeforeFixture,
  };
}
