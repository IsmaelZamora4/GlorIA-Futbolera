const apiBaseUrl = "https://www.thesportsdb.com/api/v1/json/123";

export const sportsDbLeagues: Record<string, string> = {
  "Liga 1 de Perú": "Peruvian Primera Division",
  "Serie A de Italia": "Italian Serie A",
  "LaLiga de España": "Spanish La Liga",
  "Ligue 1 de Francia": "French Ligue 1",
  "Bundesliga de Alemania": "German Bundesliga",
  "Premier League": "English Premier League",
  "Champions League": "UEFA Champions League",
  "Europa League": "UEFA Europa League",
};

const leagueAliases: Record<string, string[]> = {
  "Liga 1 de Perú": ["Peruvian Primera Division", "Liga 1"],
  "Serie A de Italia": ["Italian Serie A", "Serie A"],
  "LaLiga de España": ["Spanish La Liga", "La Liga"],
  "Ligue 1 de Francia": ["French Ligue 1", "Ligue 1"],
  "Bundesliga de Alemania": ["German Bundesliga", "Bundesliga"],
  "Premier League": ["English Premier League", "Premier League"],
  "Champions League": ["UEFA Champions League", "Champions League"],
  "Europa League": ["UEFA Europa League", "Europa League"],
};

export async function getSportsDbEvents(date: string, league: string) {
  const leagueName = sportsDbLeagues[league];
  if (!leagueName) throw new Error("Competición no configurada para TheSportsDB.");

  // Sin barra inicial: conserva la ruta /api/v1/json/123 del endpoint base.
  const url = new URL("eventsday.php", `${apiBaseUrl}/`);
  url.searchParams.set("d", date);
  url.searchParams.set("s", "Soccer");
  url.searchParams.set("v", "2");
  // Consultamos el día completo y filtramos localmente porque el filtro `l`
  // no es consistente entre ligas en la API gratuita.
  const response = await fetch(url, {
    next: { revalidate: 21_600, tags: [`sportsdb:${league}:${date}`] },
  });
  if (!response.ok) throw new Error(`TheSportsDB respondió ${response.status}.`);
  const payload = await response.json();
  const aliases = leagueAliases[league] ?? [leagueName];
  return (payload.events ?? []).filter((event: { strLeague?: string }) =>
    aliases.some((alias) => event.strLeague?.toLowerCase().includes(alias.toLowerCase())),
  );
}
