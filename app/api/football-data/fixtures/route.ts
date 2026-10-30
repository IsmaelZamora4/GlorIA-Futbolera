import { NextRequest, NextResponse } from "next/server";
import { footballDataCompetitions, getFootballDataFixtures, getWeekEndDate } from "../../../../lib/football-data";
import { getLocalLeagueAnalysis, supportsLocalLeagueAnalysis } from "../../../../lib/league-analysis";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";

const validDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const competition = request.nextUrl.searchParams.get("competition") ?? "";
  const includeAnalysis = request.nextUrl.searchParams.get("includeAnalysis") === "1";
  if (!validDate.test(date)) return NextResponse.json({ error: "date debe usar formato YYYY-MM-DD." }, { status: 400 });
  if (!footballDataCompetitions[competition]) {
    return NextResponse.json({ error: "Esta competición aún no tiene una fuente actual gratuita configurada." }, { status: 400 });
  }
  const dateTo = getWeekEndDate(date);

  try {
    // The API supplies upcoming fixtures only. Every statistical estimate comes
    // from the local CSV pipeline, never from a historical API request.
    const seasonMatches = await getFootballDataFixtures(date, dateTo, competition);
    const fixtures = seasonMatches.filter((fixture: { utcDate: string; status: string }) => fixture.utcDate.slice(0, 10) >= date && fixture.status !== "FINISHED");
    const enrichedFixtures = includeAnalysis && supportsLocalLeagueAnalysis(competition)
      ? await Promise.all(fixtures.map(async (fixture: { utcDate: string; homeTeam: { name: string }; awayTeam: { name: string } }) => ({
          ...fixture,
          historicalAnalysis: await getLocalLeagueAnalysis(competition, fixture.homeTeam.name, fixture.awayTeam.name, fixture.utcDate.slice(0, 10)),
        })))
      : fixtures;
    return NextResponse.json(
      { dateFrom: date, dateTo, competition, fixtures: enrichedFixtures, source: "football-data.org", cacheTtlSeconds: 21_600 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron obtener partidos." }, { status: 503 });
  }
}
