import { BoundedTtlCache } from "./bounded-ttl-cache.mjs";

const apiBaseUrl = "https://api.football-data.org/v4";
const fixtureCacheTtlMs = 21_600_000;
const fixtureCacheMaxEntries = 128;
const fixtureMemoryCache = new BoundedTtlCache<unknown[]>(fixtureCacheMaxEntries, fixtureCacheTtlMs);
const fixtureInFlight = new Map<string, Promise<unknown[]>>();

export const footballDataCompetitions: Record<string, string> = {
  "Serie A de Italia": "SA",
  "LaLiga de España": "PD",
  "Ligue 1 de Francia": "FL1",
  "Bundesliga de Alemania": "BL1",
  "Premier League": "PL",
  "Champions League": "CL",
};

export function getWeekEndDate(date: string) {
  const start = new Date(`${date}T12:00:00Z`);
  const daysUntilSunday = (7 - start.getUTCDay()) % 7;
  start.setUTCDate(start.getUTCDate() + daysUntilSunday);
  return start.toISOString().slice(0, 10);
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxFutureFixtureDays = 30;

function parseCalendarDate(value: string) {
  if (!datePattern.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function boundFixtureDateRange(dateFrom: string, dateTo: string, today = new Date()) {
  const from = parseCalendarDate(dateFrom);
  const to = parseCalendarDate(dateTo);
  if (!from || !to || dateFrom > dateTo) throw new Error("El rango de fechas de partidos no es válido.");
  const horizon = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + maxFutureFixtureDays, 12));
  const horizonDate = horizon.toISOString().slice(0, 10);
  if (dateFrom > horizonDate) throw new Error("Solo se pueden consultar partidos futuros dentro de los próximos 30 días.");
  return { dateFrom, dateTo: dateTo > horizonDate ? horizonDate : dateTo };
}

/** European domestic seasons start in August. This keeps Premier requests inside
 * the running season, never downloading prior seasons that already live in CSV. */
export function getSeasonStartDate(date: string) {
  const reference = new Date(`${date}T12:00:00Z`);
  const seasonYear = reference.getUTCMonth() < 7 ? reference.getUTCFullYear() - 1 : reference.getUTCFullYear();
  return `${seasonYear}-08-01`;
}

export async function getFootballDataFixtures(dateFrom: string, dateTo: string, competition: string) {
  const code = footballDataCompetitions[competition];
  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!code) throw new Error("Esta competición aún no tiene fuente de datos actuales configurada.");
  if (!apiKey) throw new Error("FOOTBALL_DATA_KEY no está configurada.");

  const range = boundFixtureDateRange(dateFrom, dateTo);
  dateFrom = range.dateFrom;
  dateTo = range.dateTo;

  const cacheKey = `${code}:${dateFrom}:${dateTo}`;
  const now = Date.now();
  const cached = fixtureMemoryCache.get(cacheKey, now);
  if (cached) return cached;
  const pending = fixtureInFlight.get(cacheKey);
  if (pending) return pending;

  const request = (async () => {
    // Sin barra inicial: conserva /v4 en la URL base.
    const url = new URL(`competitions/${code}/matches`, `${apiBaseUrl}/`);
    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    const response = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 21_600, tags: [`football-data:${code}:${dateFrom}:${dateTo}`] },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("La clave de football-data.org no es válida o no tiene acceso. Revisa FOOTBALL_DATA_KEY en .env.local.");
      }
      throw new Error(`football-data.org respondió ${response.status}.`);
    }
    const payload = await response.json();
    const matches = payload.matches ?? [];
    fixtureMemoryCache.set(cacheKey, matches, Date.now());
    return matches;
  })();
  fixtureInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    fixtureInFlight.delete(cacheKey);
  }
}

export type FootballDataStanding = {
  position: number;
  team: { id: number; name: string; crest?: string | null };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

/** Returns the current overall table. It is cached for six hours and never exposes the API key to the browser. */
export async function getFootballDataStandings(competition: string): Promise<FootballDataStanding[]> {
  const code = footballDataCompetitions[competition];
  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!code) throw new Error("Esta competición aún no tiene una tabla actual gratuita configurada.");
  if (!apiKey) throw new Error("FOOTBALL_DATA_KEY no está configurada.");

  const url = new URL(`competitions/${code}/standings`, `${apiBaseUrl}/`);
  const response = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 21_600, tags: [`football-data:${code}:standings`] },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("La clave de football-data.org no es válida o no tiene acceso. Revisa FOOTBALL_DATA_KEY en .env.local.");
    }
    throw new Error(`football-data.org respondió ${response.status}.`);
  }
  const payload = await response.json();
  return payload.standings?.find((standing: { type: string }) => standing.type === "TOTAL")?.table ?? [];
}
