export const competitions = [
  { id: 286, name: "Liga 1" },
  { id: 135, name: "Serie A" },
  { id: 140, name: "LaLiga" },
  { id: 61, name: "Ligue 1" },
  { id: 78, name: "Bundesliga" },
  { id: 39, name: "Premier League" },
  { id: 2, name: "Champions League" },
  { id: 3, name: "Europa League" },
] as const;

const apiBaseUrl = "https://v3.football.api-sports.io";
export const freePlanSeasons = [2022, 2023, 2024] as const;

export async function getFixturesForDate(date: string, leagueId?: number) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY no está configurada.");

  const requestedCompetitions = leagueId
    ? competitions.filter((competition) => competition.id === leagueId)
    : competitions;
  if (!requestedCompetitions.length) throw new Error("Competición no configurada.");

  const responses = await Promise.all(
    requestedCompetitions.map(async (competition) => {
      const url = new URL("/fixtures", apiBaseUrl);
      url.searchParams.set("league", String(competition.id));
      url.searchParams.set("season", date.slice(0, 4));
      url.searchParams.set("date", date);

      const response = await fetch(url, {
        headers: { "x-apisports-key": apiKey },
        // Shared Next.js Data Cache: one upstream request per league/date every six hours.
        next: { revalidate: 21_600, tags: [`fixtures:${competition.id}:${date}`] },
      });

      if (!response.ok) throw new Error(`${competition.name}: API-Football respondió ${response.status}.`);
      const payload = await response.json();
      if (payload.errors && Object.keys(payload.errors).length) {
        throw new Error(`${competition.name}: ${JSON.stringify(payload.errors)}`);
      }
      return payload.response ?? [];
    }),
  );

  return responses.flat();
}
