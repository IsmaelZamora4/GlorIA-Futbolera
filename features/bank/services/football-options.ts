import { readFile } from "node:fs/promises";
import path from "node:path";
import { getKnownTeamCrest } from "@/data/metadata/team-crests";

const competitions = [
  { id: "premier-league", name: "Premier League", dataset: "premier-league", logo: "/competitions/premier-league.svg" },
  { id: "la-liga", name: "LaLiga", dataset: "la-liga", logo: "/competitions/laliga.svg" },
  { id: "serie-a", name: "Serie A", dataset: "serie-a", logo: "/competitions/serie-a.svg" },
  { id: "bundesliga", name: "Bundesliga", dataset: "bundesliga", logo: "/competitions/bundesliga.svg" },
  { id: "ligue-1", name: "Ligue 1", dataset: "ligue-1", logo: "/competitions/ligue-1.svg" },
] as const;

export type BankFootballCompetition = {
  id: string;
  name: string;
  logo: string;
  teams: Array<{ name: string; crest: string }>;
};

let footballOptionsPromise: Promise<BankFootballCompetition[]> | null = null;

export function getBankFootballOptions(): Promise<BankFootballCompetition[]> {
  if (footballOptionsPromise) return footballOptionsPromise;
  footballOptionsPromise = Promise.all(competitions.map(async (competition) => {
    const content = await readFile(path.join(process.cwd(), "data", "processed", competition.dataset, "current-season-matches.json"), "utf8");
    const matches = JSON.parse(content) as Array<{ homeTeam: string; awayTeam: string }>;
    const teams = [...new Set(matches.flatMap((match) => [match.homeTeam, match.awayTeam]))]
      .sort((a, b) => a.localeCompare(b, "es"))
      .flatMap((name) => {
        const crest = getKnownTeamCrest(name);
        return crest ? [{ name, crest }] : [];
      });
    return { id: competition.id, name: competition.name, logo: competition.logo, teams };
  }));
  return footballOptionsPromise;
}

export async function resolveBankFootballLeg(competitionId: string, homeTeam: string, awayTeam: string) {
  const options = await getBankFootballOptions();
  const competition = options.find((item) => item.id === competitionId);
  if (!competition) return { error: "Selecciona una competición disponible." };
  if (!homeTeam || !awayTeam) return { error: "Selecciona los equipos local y visitante." };
  if (homeTeam === awayTeam) return { error: "El equipo local y el visitante deben ser distintos." };
  const validTeams = new Set(competition.teams.map((team) => team.name));
  if (!validTeams.has(homeTeam) || !validTeams.has(awayTeam)) return { error: "Los equipos seleccionados no pertenecen a esa competición." };
  return { competition: competition.name, homeTeam, awayTeam };
}

export async function resolveBankFootballEvent(competitionId: string, homeTeam: string, awayTeam: string) {
  const leg = await resolveBankFootballLeg(competitionId, homeTeam, awayTeam);
  if (leg.error) return leg;
  return { event: `${leg.competition} · ${leg.homeTeam} vs ${leg.awayTeam}` };
}
