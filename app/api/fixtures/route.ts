import { NextRequest, NextResponse } from "next/server";
import { competitions, freePlanSeasons, getFixturesForDate } from "@/features/fixtures/services/football";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

const validDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const league = request.nextUrl.searchParams.get("league");
  if (!validDate.test(date)) {
    return NextResponse.json({ error: "date debe usar formato YYYY-MM-DD." }, { status: 400 });
  }
  const season = Number(date.slice(0, 4));
  if (!freePlanSeasons.includes(season as (typeof freePlanSeasons)[number])) {
    return NextResponse.json({ error: `El plan Free de API-Football no permite la temporada ${season}. Usa una fecha de 2022, 2023 o 2024.` }, { status: 400 });
  }
  if (!league || !/^\d+$/.test(league) || !competitions.some((competition) => competition.id === Number(league))) {
    return NextResponse.json({ error: "Selecciona una competición válida para limitar la consulta a una petición." }, { status: 400 });
  }

  try {
    const fixtures = await getFixturesForDate(date, Number(league));
    return NextResponse.json(
      { date, league: Number(league), fixtures, source: "api-football", cacheTtlSeconds: 21_600 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron obtener fixtures." },
      { status: 503 },
    );
  }
}
