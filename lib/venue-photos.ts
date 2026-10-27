export type VenuePhoto = {
  imageUrl: string;
  sourceUrl?: string;
};

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const localVenuePhotos: Record<string, Record<string, string>> = {
  "Ligue 1": {
    Angers: "/stadiums/ligue-1/angers_4_11zon.webp",
    Auxerre: "/stadiums/ligue-1/auxerre_5_11zon.webp",
    Brest: "/stadiums/ligue-1/stade-brestois_7_11zon.webp",
    "Le Havre": "/stadiums/ligue-1/le-havre-ac_1_11zon.webp",
    "Le Mans": "/stadiums/ligue-1/le-mans_3_11zon.webp",
    Lens: "/stadiums/ligue-1/lens.webp",
    Lille: "/stadiums/ligue-1/lille_13_11zon.webp",
    Lorient: "/stadiums/ligue-1/lorient.webp",
    Lyon: "/stadiums/ligue-1/olympique-lyon_16_11zon.webp",
    Marseille: "/stadiums/ligue-1/olympique-marseille_9_11zon.webp",
    Monaco: "/stadiums/ligue-1/monaco_11_11zon.webp",
    Nice: "/stadiums/ligue-1/ogc-nice_10_11zon.webp",
    "Paris FC": "/stadiums/ligue-1/paris-fc_14_11zon.webp",
    "Paris SG": "/stadiums/ligue-1/paris-saint-germain_15_11zon.webp",
    Rennes: "/stadiums/ligue-1/stade-rennais_12_11zon.webp",
    Strasbourg: "/stadiums/ligue-1/strasbourg_6_11zon.webp",
    Toulouse: "/stadiums/ligue-1/tolouse_8_11zon.webp",
    Troyes: "/stadiums/ligue-1/es-troyes-ac_2_11zon.webp",
  },
  LaLiga: {
    Alaves: "/stadiums/la-liga/alaves.webp",
    "Ath Bilbao": "/stadiums/la-liga/athletic-bilbao_7_11zon.webp",
    "Ath Madrid": "/stadiums/la-liga/atletico-de-madrid.webp",
    Barcelona: "/stadiums/la-liga/barcelona_10_11zon.webp",
    Betis: "/stadiums/la-liga/real-betis.webp",
    Celta: "/stadiums/la-liga/celta-de-vigo.webp",
    Elche: "/stadiums/la-liga/elche_4_11zon.webp",
    Espanol: "/stadiums/la-liga/espanyol_5_11zon.webp",
    Getafe: "/stadiums/la-liga/getafe_6_11zon.webp",
    "La Coruna": "/stadiums/la-liga/depor-coruna.webp",
    Levante: "/stadiums/la-liga/levante.webp",
    Malaga: "/stadiums/la-liga/malaga_1_11zon.webp",
    Osasuna: "/stadiums/la-liga/osasuna.webp",
    "Real Madrid": "/stadiums/la-liga/real-madrid.webp",
    Santander: "/stadiums/la-liga/real-racing-club_3_11zon.webp",
    Sevilla: "/stadiums/la-liga/sevilla_8_11zon.webp",
    Sociedad: "/stadiums/la-liga/real-sociedad_9_11zon.webp",
    Valencia: "/stadiums/la-liga/valencia_2_11zon.webp",
    Vallecano: "/stadiums/la-liga/rayo-vallecano.webp",
    Villarreal: "/stadiums/la-liga/villareal.webp",
  },
  "Premier League": {
    Arsenal: "/stadiums/premier-league/arsenal.webp",
    "Aston Villa": "/stadiums/premier-league/astonvilla.webp",
    Bournemouth: "/stadiums/premier-league/bournemouth.webp",
    Brentford: "/stadiums/premier-league/brentford.webp",
    Brighton: "/stadiums/premier-league/brighton.webp",
    Chelsea: "/stadiums/premier-league/chelsea.webp",
    Coventry: "/stadiums/premier-league/coventry-city.webp",
    "Crystal Palace": "/stadiums/premier-league/crystal-palace.webp",
    Everton: "/stadiums/premier-league/everton.webp",
    Fulham: "/stadiums/premier-league/fullham.webp",
    Hull: "/stadiums/premier-league/hullcity.webp",
    Ipswich: "/stadiums/premier-league/ipswich-town.webp",
    Leeds: "/stadiums/premier-league/leeds.webp",
    Liverpool: "/stadiums/premier-league/liverpool.webp",
    "Man United": "/stadiums/premier-league/manchester-united.webp",
    "Man City": "/stadiums/premier-league/manchester-city.webp",
    Newcastle: "/stadiums/premier-league/newcastle.webp",
    "Nott'm Forest": "/stadiums/premier-league/nottinham-forest.webp",
    Sunderland: "/stadiums/premier-league/sunderland.webp",
    Tottenham: "/stadiums/premier-league/tottenham.webp",
  },
  "Serie A": {
    Atalanta: "/stadiums/serie-a/atalanta.webp",
    Bologna: "/stadiums/serie-a/bologna.webp",
    Cagliari: "/stadiums/serie-a/cagliari.webp",
    Como: "/stadiums/serie-a/como.webp",
    Fiorentina: "/stadiums/serie-a/fiorentina.webp",
    Frosinone: "/stadiums/serie-a/frosinone.webp",
    Genoa: "/stadiums/serie-a/genoa.webp",
    Inter: "/stadiums/serie-a/inter-milan.webp",
    Juventus: "/stadiums/serie-a/juventus.webp",
    Lazio: "/stadiums/serie-a/lazio.webp",
    Lecce: "/stadiums/serie-a/lecce.webp",
    Milan: "/stadiums/serie-a/milan.webp",
    Monza: "/stadiums/serie-a/monza.webp",
    Napoli: "/stadiums/serie-a/napoli.webp",
    Parma: "/stadiums/serie-a/parma.webp",
    Roma: "/stadiums/serie-a/roma.webp",
    Sassuolo: "/stadiums/serie-a/sassuolo.webp",
    Torino: "/stadiums/serie-a/torino.webp",
    Udinese: "/stadiums/serie-a/udinese.webp",
    Venezia: "/stadiums/serie-a/venezia.webp",
  },
};

/** Foto de alta calidad incluida en el proyecto, sin solicitud de red. */
export function getLocalVenuePhoto(competition: string, canonicalTeam: string): VenuePhoto | null {
  const localCompetition = competition === "Serie A de Italia" ? "Serie A" : competition === "LaLiga de España" ? "LaLiga" : competition === "Ligue 1 de Francia" ? "Ligue 1" : competition;
  const imageUrl = localVenuePhotos[localCompetition]?.[canonicalTeam];
  return imageUrl ? { imageUrl } : null;
}

function isTrustedImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "thumb.wikimedia.org" || url.hostname === "upload.wikimedia.org");
  } catch {
    return false;
  }
}

function isTrustedSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "wikipedia.org" || url.hostname.endsWith(".wikipedia.org"));
  } catch {
    return false;
  }
}

type WikipediaSummary = {
  thumbnail?: { source?: unknown };
  originalimage?: { source?: unknown };
  content_urls?: { desktop?: { page?: unknown } };
};

/**
 * Obtiene solo metadatos públicos de una sede conocida. Next guarda la
 * respuesta por 30 días, por lo que abrir un partido no consulta una API de
 * fútbol ni vuelve a buscar la foto de ese estadio en cada visita.
 */
export async function getVenuePhoto(stadium: string): Promise<VenuePhoto | null> {
  if (!stadium || stadium === "Estadio por confirmar") return null;

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(stadium)}`, {
      next: { revalidate: THIRTY_DAYS, tags: [`venue-photo:${stadium.toLowerCase()}`] },
    });
    if (!response.ok) return null;

    const summary = await response.json() as WikipediaSummary;
    const imageUrl = summary.thumbnail?.source ?? summary.originalimage?.source;
    const sourceUrl = summary.content_urls?.desktop?.page;
    if (!isTrustedImageUrl(imageUrl) || !isTrustedSourceUrl(sourceUrl)) return null;

    return { imageUrl, sourceUrl };
  } catch {
    return null;
  }
}
