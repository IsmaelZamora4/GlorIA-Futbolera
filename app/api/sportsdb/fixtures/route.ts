import { NextRequest, NextResponse } from "next/server";
import { getSportsDbEvents, sportsDbLeagues } from "../../../../lib/thesportsdb";

const validDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const league = request.nextUrl.searchParams.get("league") ?? "";
  if (!validDate.test(date)) return NextResponse.json({ error: "date debe usar formato YYYY-MM-DD." }, { status: 400 });
  if (!sportsDbLeagues[league]) return NextResponse.json({ error: "Selecciona una competición válida." }, { status: 400 });

  try {
    const events = await getSportsDbEvents(date, league);
    return NextResponse.json(
      { date, league, events, source: "thesportsdb", cacheTtlSeconds: 21_600 },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron obtener partidos." }, { status: 503 });
  }
}
