import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getLocalLeagueAnalysis, supportsLocalLeagueAnalysis } from "../../../lib/league-analysis";
import { getFootballDataFixtures, footballDataCompetitions } from "../../../lib/football-data";
import { getLocalDate } from "../../../lib/local-date";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";

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
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const competition = params.get("competition");
  if (!date || !competition) {
    return NextResponse.json({ error: "date y competition son obligatorios" }, { status: 400 });
  }

  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ error: "date debe usar formato YYYY-MM-DD." }, { status: 400 });
  }

  const slug = datasets[competition];
  const analysisAvailable = supportsLocalLeagueAnalysis(competition);

  try {
    if (date >= getLocalDate() && footballDataCompetitions[competition]) {
      const dateFrom = new Date(`${date}T12:00:00Z`);
      dateFrom.setUTCDate(dateFrom.getUTCDate() - 1);
      const dateTo = new Date(`${date}T12:00:00Z`);
      dateTo.setUTCDate(dateTo.getUTCDate() + 1);
      const matches = await getFootballDataFixtures(dateFrom.toISOString().slice(0, 10), dateTo.toISOString().slice(0, 10), competition) as Array<{
        id: number;
        utcDate: string;
        status: string;
        venue?: string | null;
        homeTeam: { id: number; name: string; crest?: string | null };
        awayTeam: { id: number; name: string; crest?: string | null };
        score?: { fullTime?: { home?: number | null; away?: number | null } };
      }>;
      const fixtures = await Promise.all(matches
        .filter((match) => getLocalDate(new Date(match.utcDate)) === date)
        .map(async (match) => ({
        id: String(match.id),
        utcDate: match.utcDate,
        status: match.status,
        venue: match.venue ?? null,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        score: match.score,
        historicalAnalysis: analysisAvailable
          ? await getLocalLeagueAnalysis(competition, match.homeTeam.name, match.awayTeam.name, date)
          : undefined,
      })));
      return NextResponse.json({ date, competition, fixtures, source: "football-data.org", status: "current", analysisAvailable, cacheTtlSeconds: 21_600 });
    }

    if (!slug) {
      return NextResponse.json({
        date,
        competition,
        fixtures: [],
        source: "unavailable",
        status: date >= getLocalDate() ? "unavailable" : "insufficient",
        analysisAvailable,
        message: "Esta competición aún no tiene una fuente de partidos actuales configurada.",
      });
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
        historicalAnalysis: analysisAvailable
          ? await getLocalLeagueAnalysis(competition, match.homeTeam, match.awayTeam, match.date)
          : undefined,
      })));
    return NextResponse.json({ date, competition, fixtures, source: "local-dataset", status: "historical", analysisAvailable });
  } catch {
    return NextResponse.json({
      error: "No se pudieron obtener los partidos de esta competición.",
      date,
      competition,
      analysisAvailable,
    }, { status: 503 });
  }
}
