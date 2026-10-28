import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getLocalLeagueAnalysis, supportsLocalLeagueAnalysis } from "../../../lib/league-analysis";
import { getFootballDataFixtures, footballDataCompetitions } from "../../../lib/football-data";
import { getLocalDate } from "../../../lib/local-date";

const datasets: Record<string, string> = {
  "Serie A de Italia": "serie-a",
  "LaLiga de España": "la-liga",
  "Ligue 1 de Francia": "ligue-1",
  "Bundesliga de Alemania": "bundesliga",
  "Premier League": "premier-league",
};

type LocalFixture = {
  id: string;
  date: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  status: "FINISHED" | "SCHEDULED";
  homeGoals: number | null;
  awayGoals: number | null;
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const competition = params.get("competition");
  if (!date || !competition) {
    return NextResponse.json({ error: "date y competition son obligatorios" }, { status: 400 });
  }

  const slug = datasets[competition];
  if (!slug) {
    return NextResponse.json({ date, competition, fixtures: [], source: "local-dataset", status: "insufficient" });
  }

  try {
    if (date >= getLocalDate() && footballDataCompetitions[competition]) {
      const matches = await getFootballDataFixtures(date, date, competition) as Array<{
        id: number;
        utcDate: string;
        status: string;
        venue?: string | null;
        homeTeam: { id: number; name: string; crest?: string | null };
        awayTeam: { id: number; name: string; crest?: string | null };
        score?: { fullTime?: { home?: number | null; away?: number | null } };
      }>;
      const fixtures = await Promise.all(matches.map(async (match) => ({
        id: String(match.id),
        utcDate: match.utcDate,
        status: match.status,
        venue: match.venue ?? null,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        score: match.score,
        historicalAnalysis: supportsLocalLeagueAnalysis(competition)
          ? await getLocalLeagueAnalysis(competition, match.homeTeam.name, match.awayTeam.name, date)
          : undefined,
      })));
      return NextResponse.json({ date, competition, fixtures, source: "football-data.org", status: "current", cacheTtlSeconds: 21_600 });
    }

    const file = path.join(process.cwd(), "data", "processed", slug, "current-season-matches.json");
    const matches = JSON.parse(await readFile(file, "utf8")) as LocalFixture[];
    const fixtures = await Promise.all(matches
      .filter((match) => match.date === date)
      .map(async (match) => ({
        id: match.id,
        utcDate: `${match.date}T${match.kickoff}:00Z`,
        status: match.status,
        venue: null,
        homeTeam: { id: 0, name: match.homeTeam, crest: null },
        awayTeam: { id: 0, name: match.awayTeam, crest: null },
        score: { fullTime: { home: match.homeGoals, away: match.awayGoals } },
        historicalAnalysis: supportsLocalLeagueAnalysis(competition)
          ? await getLocalLeagueAnalysis(competition, match.homeTeam, match.awayTeam, match.date)
          : undefined,
      })));
    return NextResponse.json({ date, competition, fixtures, source: "local-dataset", status: "historical" });
  } catch {
    return NextResponse.json({ error: "dataset local no disponible" }, { status: 500 });
  }
}
