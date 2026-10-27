import Link from "next/link";
import { notFound } from "next/navigation";

import { AppSidebar } from "../../../components/AppSidebar";
import { MatchDetailClient } from "../../../components/MatchDetailClient";
import { getTeamVenue, resolveFixtureVenue } from "../../../data/team-venues";
import {
  getHeadToHead,
  getLocalMatchDetailContext,
  getLocalStandings,
  getMatchDetailCompetitionBySlug,
  getMatchRecentForms,
  getMatchSeasonStatistics,
} from "../../../lib/match-detail";
import { getLocalLeagueAnalysis } from "../../../lib/league-analysis";
import { getLocalVenuePhoto, getVenuePhoto } from "../../../lib/venue-photos";

type SearchParams = { fecha?: string; local?: string; visitante?: string; hora?: string; estadio?: string; escudoLocal?: string; escudoVisitante?: string };

function safeCrest(value: string | undefined) {
  if (!value) return undefined;
  if (value.startsWith("/") || /^https:\/\/crests\.football-data\.org\/[\w.-]+$/.test(value)) return value;
  return undefined;
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ competition: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ competition: competitionSlug }, query] = await Promise.all([params, searchParams]);
  const competition = getMatchDetailCompetitionBySlug(competitionSlug);
  if (!competition || !query.fecha || !query.local || !query.visitante) notFound();

  const context = await getLocalMatchDetailContext({
    competition,
    fixtureDate: query.fecha,
    homeTeam: query.local,
    awayTeam: query.visitante,
  });
  if (!context) notFound();

  const venue = resolveFixtureVenue(competition, query.local, query.estadio);
  const localVenue = getTeamVenue(competition, query.local);
  // Solo resolvemos la imagen de una sede conocida: la URL de consulta nunca
  // se usa para construir una petición remota.
  const localVenuePhoto = getLocalVenuePhoto(competition, context.fixture.home.canonicalName);
  const venuePhoto = localVenuePhoto
    ? Promise.resolve(localVenuePhoto)
    : localVenue?.stadium === venue ? getVenuePhoto(venue) : Promise.resolve(null);

  const [analysis, forms, statistics, standings, h2h, stadiumPhoto] = await Promise.all([
    getLocalLeagueAnalysis(competition, query.local, query.visitante, query.fecha),
    Promise.resolve(getMatchRecentForms(context)),
    Promise.resolve(getMatchSeasonStatistics(context)),
    Promise.resolve(getLocalStandings(context)),
    Promise.resolve(getHeadToHead(context)),
    venuePhoto,
  ]);
  const countTeamMatches = (team: string, matches: typeof context.historicalMatches) => matches.filter(
    (match) => match.homeTeam === team || match.awayTeam === team,
  ).length;
  const home = context.fixture.home.canonicalName;
  const away = context.fixture.away.canonicalName;
  const transparency = {
    home: {
      historicalMatches: countTeamMatches(home, context.historicalMatches),
      currentMatches: countTeamMatches(home, context.currentMatchesBeforeFixture),
    },
    away: {
      historicalMatches: countTeamMatches(away, context.historicalMatches),
      currentMatches: countTeamMatches(away, context.currentMatchesBeforeFixture),
    },
  };
  return <div className="app-shell"><AppSidebar active="Partidos" /><div className="main-area"><header className="match-detail-topbar"><Link href="/" className="detail-back">← Volver al análisis</Link><span>GlorIA · Detalle de partido</span><Link href="/partidos" className="detail-all-matches">Todos los partidos →</Link></header><MatchDetailClient context={{ fixture: context.fixture, coverage: context.coverage }} analysis={analysis} forms={forms} statistics={statistics} standings={standings} h2h={h2h} kickoff={query.hora || "Por confirmar"} venue={venue} venueCity={localVenue?.stadium === venue ? localVenue.city : undefined} venuePhoto={stadiumPhoto} homeCrest={safeCrest(query.escudoLocal)} awayCrest={safeCrest(query.escudoVisitante)} transparency={transparency} /></div></div>;
}
