import { resolveTeamIdentity } from "../lib/team-identity";

export type TeamVenue = {
  stadium: string;
  city: string;
};

type LocalCompetition = "Bundesliga" | "LaLiga" | "Ligue 1" | "Premier League" | "Serie A";

const competitionAliases: Record<string, LocalCompetition> = {
  "Bundesliga de Alemania": "Bundesliga",
  "LaLiga de España": "LaLiga",
  "Ligue 1 de Francia": "Ligue 1",
  "Premier League": "Premier League",
  "Serie A de Italia": "Serie A",
};

/**
 * Sedes habituales de los clubes de las cinco competiciones cubiertas por los
 * datasets locales. Se consulta solo en memoria: no añade llamadas a APIs
 * durante la navegación. La sede entregada por un fixture conserva prioridad,
 * porque puede representar una cancha neutral o temporal.
 */
export const teamVenues: Record<LocalCompetition, Record<string, TeamVenue>> = {
  "Premier League": {
    "Arsenal": { stadium: "Emirates Stadium", city: "Londres" }, "Aston Villa": { stadium: "Villa Park", city: "Birmingham" }, "Bournemouth": { stadium: "Vitality Stadium", city: "Bournemouth" }, "Brentford": { stadium: "Gtech Community Stadium", city: "Londres" }, "Brighton": { stadium: "American Express Stadium", city: "Brighton" }, "Chelsea": { stadium: "Stamford Bridge", city: "Londres" }, "Coventry": { stadium: "Coventry Building Society Arena", city: "Coventry" }, "Crystal Palace": { stadium: "Selhurst Park", city: "Londres" }, "Everton": { stadium: "Hill Dickinson Stadium", city: "Liverpool" }, "Fulham": { stadium: "Craven Cottage", city: "Londres" }, "Hull": { stadium: "MKM Stadium", city: "Hull" }, "Ipswich": { stadium: "Portman Road", city: "Ipswich" }, "Leeds": { stadium: "Elland Road", city: "Leeds" }, "Liverpool": { stadium: "Anfield", city: "Liverpool" }, "Man City": { stadium: "Etihad Stadium", city: "Mánchester" }, "Man United": { stadium: "Old Trafford", city: "Mánchester" }, "Newcastle": { stadium: "St. James' Park", city: "Newcastle" }, "Nott'm Forest": { stadium: "City Ground", city: "Nottingham" }, "Sunderland": { stadium: "Stadium of Light", city: "Sunderland" }, "Tottenham": { stadium: "Tottenham Hotspur Stadium", city: "Londres" },
  },
  "Serie A": {
    "Atalanta": { stadium: "Gewiss Stadium", city: "Bérgamo" }, "Bologna": { stadium: "Stadio Renato Dall'Ara", city: "Bolonia" }, "Cagliari": { stadium: "Unipol Domus", city: "Cagliari" }, "Como": { stadium: "Stadio Giuseppe Sinigaglia", city: "Como" }, "Fiorentina": { stadium: "Stadio Artemio Franchi", city: "Florencia" }, "Frosinone": { stadium: "Stadio Benito Stirpe", city: "Frosinone" }, "Genoa": { stadium: "Stadio Luigi Ferraris", city: "Génova" }, "Inter": { stadium: "Stadio Giuseppe Meazza", city: "Milán" }, "Juventus": { stadium: "Allianz Stadium", city: "Turín" }, "Lazio": { stadium: "Stadio Olimpico", city: "Roma" }, "Lecce": { stadium: "Stadio Via del Mare", city: "Lecce" }, "Milan": { stadium: "Stadio Giuseppe Meazza", city: "Milán" }, "Monza": { stadium: "U-Power Stadium", city: "Monza" }, "Napoli": { stadium: "Stadio Diego Armando Maradona", city: "Nápoles" }, "Parma": { stadium: "Stadio Ennio Tardini", city: "Parma" }, "Roma": { stadium: "Stadio Olimpico", city: "Roma" }, "Sassuolo": { stadium: "MAPEI Stadium – Città del Tricolore", city: "Reggio Emilia" }, "Torino": { stadium: "Stadio Olimpico Grande Torino", city: "Turín" }, "Udinese": { stadium: "Bluenergy Stadium", city: "Údine" }, "Venezia": { stadium: "Stadio Pier Luigi Penzo", city: "Venecia" },
  },
  "LaLiga": {
    "Alaves": { stadium: "Estadio de Mendizorrotza", city: "Vitoria-Gasteiz" }, "Ath Bilbao": { stadium: "San Mamés", city: "Bilbao" }, "Ath Madrid": { stadium: "Riyadh Air Metropolitano", city: "Madrid" }, "Barcelona": { stadium: "Spotify Camp Nou", city: "Barcelona" }, "Betis": { stadium: "Estadio de La Cartuja", city: "Sevilla" }, "Celta": { stadium: "Abanca Balaídos", city: "Vigo" }, "Elche": { stadium: "Estadio Martínez Valero", city: "Elche" }, "Espanol": { stadium: "RCDE Stadium", city: "Cornellà de Llobregat" }, "Getafe": { stadium: "Coliseum", city: "Getafe" }, "La Coruna": { stadium: "Estadio de Riazor", city: "A Coruña" }, "Levante": { stadium: "Ciutat de València", city: "Valencia" }, "Malaga": { stadium: "La Rosaleda", city: "Málaga" }, "Osasuna": { stadium: "El Sadar", city: "Pamplona" }, "Real Madrid": { stadium: "Santiago Bernabéu", city: "Madrid" }, "Santander": { stadium: "El Sardinero", city: "Santander" }, "Sevilla": { stadium: "Ramón Sánchez-Pizjuán", city: "Sevilla" }, "Sociedad": { stadium: "Reale Arena", city: "San Sebastián" }, "Valencia": { stadium: "Mestalla", city: "Valencia" }, "Vallecano": { stadium: "Estadio de Vallecas", city: "Madrid" }, "Villarreal": { stadium: "Estadio de la Cerámica", city: "Vila-real" },
  },
  "Bundesliga": {
    "Augsburg": { stadium: "WWK Arena", city: "Augsburgo" }, "Bayern Munich": { stadium: "Allianz Arena", city: "Múnich" }, "Dortmund": { stadium: "SIGNAL IDUNA PARK", city: "Dortmund" }, "Ein Frankfurt": { stadium: "Deutsche Bank Park", city: "Fráncfort" }, "Elversberg": { stadium: "URSAPHARM-Arena an der Kaiserlinde", city: "Spiesen-Elversberg" }, "FC Koln": { stadium: "RheinEnergieSTADION", city: "Colonia" }, "Freiburg": { stadium: "Europa-Park Stadion", city: "Friburgo" }, "Hamburg": { stadium: "Volksparkstadion", city: "Hamburgo" }, "Hoffenheim": { stadium: "PreZero Arena", city: "Sinsheim" }, "Leverkusen": { stadium: "BayArena", city: "Leverkusen" }, "M'gladbach": { stadium: "BORUSSIA-PARK", city: "Mönchengladbach" }, "Mainz": { stadium: "MEWA ARENA", city: "Maguncia" }, "Paderborn": { stadium: "Home Deluxe Arena", city: "Paderborn" }, "RB Leipzig": { stadium: "Red Bull Arena", city: "Leipzig" }, "Schalke 04": { stadium: "VELTINS-Arena", city: "Gelsenkirchen" }, "Stuttgart": { stadium: "MHPArena", city: "Stuttgart" }, "Union Berlin": { stadium: "Stadion An der Alten Försterei", city: "Berlín" }, "Werder Bremen": { stadium: "Weserstadion", city: "Bremen" },
  },
  "Ligue 1": {
    "Angers": { stadium: "Stade Raymond Kopa", city: "Angers" }, "Auxerre": { stadium: "Stade de l'Abbé-Deschamps", city: "Auxerre" }, "Brest": { stadium: "Stade Francis-Le Blé", city: "Brest" }, "Le Havre": { stadium: "Stade Océane", city: "Le Havre" }, "Le Mans": { stadium: "Stade Marie-Marvingt", city: "Le Mans" }, "Lens": { stadium: "Stade Bollaert-Delelis", city: "Lens" }, "Lille": { stadium: "Stade Pierre-Mauroy", city: "Villeneuve-d'Ascq" }, "Lorient": { stadium: "Stade du Moustoir", city: "Lorient" }, "Lyon": { stadium: "Groupama Stadium", city: "Décines-Charpieu" }, "Marseille": { stadium: "Orange Vélodrome", city: "Marsella" }, "Monaco": { stadium: "Stade Louis-II", city: "Mónaco" }, "Nice": { stadium: "Allianz Riviera", city: "Niza" }, "Paris FC": { stadium: "Stade Jean-Bouin", city: "París" }, "Paris SG": { stadium: "Parc des Princes", city: "París" }, "Rennes": { stadium: "Roazhon Park", city: "Rennes" }, "Strasbourg": { stadium: "Stade de la Meinau", city: "Estrasburgo" }, "Toulouse": { stadium: "Stadium de Toulouse", city: "Toulouse" }, "Troyes": { stadium: "Stade de l'Aube", city: "Troyes" },
  },
};

export function getTeamVenue(competition: string, teamName: string): TeamVenue | null {
  const localCompetition = competitionAliases[competition] ?? competition;
  if (!(localCompetition in teamVenues)) return null;
  const venues = teamVenues[localCompetition as LocalCompetition];
  const identity = resolveTeamIdentity(localCompetition as LocalCompetition, teamName, Object.keys(venues));
  return venues[identity.canonicalName] ?? null;
}

export function resolveFixtureVenue(competition: string, homeTeam: string, fixtureVenue?: string | null) {
  const suppliedVenue = fixtureVenue?.trim();
  if (suppliedVenue && !/^(estadio|venue) por confirmar$/i.test(suppliedVenue)) return suppliedVenue;
  return getTeamVenue(competition, homeTeam)?.stadium || "Estadio por confirmar";
}
